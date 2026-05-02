import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { prisma } from "@repo/database";

export const getDashboardAnalytics = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if(!shopId) throw new ApiError(400, "User is not related to a shop");

    const { period = "today", customStartDate, customEndDate } = req.query;

    let startDate = new Date();
    startDate.setHours(0,0,0,0);
    
    let endDate = new Date();
    endDate.setHours(23,59,59,999);

    if (period === "7d") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0,0,0,0);
    } else if (period === "30d") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0,0,0,0);
    } else if (period === "all") {
        startDate = new Date(0); // Epoch
    } else if (period === "custom" && customStartDate && customEndDate) {
        startDate = new Date(customStartDate as string);
        startDate.setHours(0,0,0,0);
        endDate = new Date(customEndDate as string);
        endDate.setHours(23,59,59,999);

        // Swap if inverted
        if (startDate > endDate) {
            const temp = startDate;
            startDate = endDate;
            endDate = temp;
        }
    }

    // 1. Period Revenue (Safely aggregated at the DB level)
    const periodBillsAgg = await prisma.bill.aggregate({
        _sum: { totalAmount: true },
        where: { shopId, status: "PAID", createdAt: { gte: startDate, lte: endDate } }
    });
    const periodRevenue = periodBillsAgg._sum.totalAmount || 0;

    // Total Revenue (Always all-time, safely aggregated)
    const allBillsAgg = await prisma.bill.aggregate({
        _sum: { totalAmount: true },
        where: { shopId, status: "PAID" }
    });
    const totalRevenue = allBillsAgg._sum.totalAmount || 0;

    // 2. Period Orders
    const periodOrdersCount = await prisma.order.count({
        where: { shopId, createdAt: { gte: startDate, lte: endDate } }
    });

    // 3. Active Tables
    const activeTablesCount = await prisma.tableSession.count({
        where: { shopId, endedAt: null }
    });

    // 4. Order Status Snapshot
    const activeOrdersMap = await prisma.order.groupBy({
        by: ['status'],
        where: { shopId, status: { in: ["PENDING", "CONFIRMED", "PREPARING"] } },
        _count: true
    });
    const orderStatusSnapshot = {
        PENDING: activeOrdersMap.find(o => o.status === "PENDING")?._count || 0,
        CONFIRMED: activeOrdersMap.find(o => o.status === "CONFIRMED")?._count || 0,
        PREPARING: activeOrdersMap.find(o => o.status === "PREPARING")?._count || 0
    };

    // 5. Revenue by Date 
    let chartStartDate = startDate;
    let chartEndDate = endDate;
    let daysToGenerate = 7;
    
    if (period === "today") {
        chartStartDate = new Date();
        chartStartDate.setDate(chartStartDate.getDate() - 6);
        chartStartDate.setHours(0, 0, 0, 0);
    } else if (period === "30d") {
        daysToGenerate = 30;
    } else if (period === "all") {
        daysToGenerate = 30; // Cap at 30 to prevent massive charts
        chartStartDate = new Date();
        chartStartDate.setDate(chartStartDate.getDate() - 29);
        chartStartDate.setHours(0,0,0,0);
    } else if (period === "custom") {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysToGenerate = Math.min(diffDays + 1, 30); // Cap at 30 days for clarity
        chartStartDate = new Date(endDate);
        chartStartDate.setDate(chartStartDate.getDate() - daysToGenerate + 1);
        chartStartDate.setHours(0, 0, 0, 0);
    } else {
        daysToGenerate = 7;
    }

    const recentBills = await prisma.bill.findMany({
        where: { shopId, status: "PAID", createdAt: { gte: chartStartDate, lte: chartEndDate } },
        select: { totalAmount: true, createdAt: true }
    });

    // Helper: format date in IST (UTC+5:30) to avoid server-timezone drift
    const toISTDateString = (d: Date): string => {
        const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 in ms
        const istDate = new Date(d.getTime() + istOffset);
        return istDate.toISOString().substring(0, 10); // YYYY-MM-DD
    };

    const revenueByDateMap: Record<string, number> = {};
    for (let i = daysToGenerate - 1; i >= 0; i--) {
        const d = new Date(chartEndDate);
        d.setDate(d.getDate() - i);
        revenueByDateMap[toISTDateString(d)] = 0;
    }
    recentBills.forEach(bill => {
        const dateStr = toISTDateString(bill.createdAt);
        if (revenueByDateMap[dateStr] !== undefined) {
            revenueByDateMap[dateStr] += bill.totalAmount;
        }
    });
    const revenueByDate = Object.entries(revenueByDateMap).map(([date, revenue]) => ({ date, revenue }));

    // 6. Category Sales & Top Items
    // Filter by orders whose session has a PAID bill — consistent with revenue source
    const completedOrdersQuery = await prisma.order.findMany({
        where: { 
            shopId, 
            status: "COMPLETED", 
            createdAt: { gte: startDate, lte: endDate },
            tableSession: {
                bill: {
                    status: "PAID"
                }
            }
        },
        select: { 
            orderItems: {
                select: { 
                    itemId: true, 
                    name: true, 
                    quantity: true, 
                    price: true,
                    item: { select: { category: { select: { name: true } } } } 
                }
            } 
        }
    });

    const itemSales: Record<string, {name: string, count: number, revenue: number}> = {};
    const categorySalesMap: Record<string, number> = {};

    completedOrdersQuery.forEach(order => {
        order.orderItems.forEach(oi => {
            const itemIdStr = oi.itemId || oi.name; // Fallback to name if generic item
            if(!itemSales[itemIdStr]) {
                itemSales[itemIdStr] = { name: oi.name, count: 0, revenue: 0 };
            }
            itemSales[itemIdStr].count += oi.quantity;
            const revenue = oi.price * oi.quantity;
            itemSales[itemIdStr].revenue += revenue;

            const catName = oi.item?.category?.name || "Uncategorized";
            if (!categorySalesMap[catName]) {
                categorySalesMap[catName] = 0;
            }
            categorySalesMap[catName] += revenue;
        });
    });

    const topSellingItems = Object.values(itemSales)
        .sort((a,b) => b.count - a.count)
        .slice(0, 5);

    const categorySales = Object.entries(categorySalesMap).map(([name, value]) => ({ name, value }));

    return res.status(200).json({
        success: true,
        message: "Analytics fetched successfully",
        data: {
            periodRevenue,
            totalRevenue,
            periodOrdersCount,
            activeTablesCount,
            revenueByDate,
            topSellingItems,
            categorySales,
            orderStatusSnapshot
        }
    });
};
