import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { prisma } from "@repo/database";
import z from "zod";
import { ApplyDiscountSchema, RecordPaymentSchema, CancelBillSchema } from "@repo/types";
import { generateBillForSession } from "../modules/billing/generate";
import { applyDiscount } from "../modules/billing/discount";
import { recordPayment } from "../modules/billing/settle";
import { cancelBill } from "../modules/billing/cancel";
import { listAuditForBill } from "../modules/billing/audit";
import { buildReceiptDTO } from "../modules/billing/receipt";
import { buildWhatsAppLink } from "../modules/billing/whatsapp";

const BILL_INCLUDE = {
    payments: { orderBy: { createdAt: "asc" as const } },
    customer: { select: { id: true, phone: true, name: true } },
    tableSession: {
        include: {
            table: true,
            orders: {
                include: { orderItems: true },
            },
        },
    },
} as const;

export const generateBill = async (req: Request<{ tableSessionId: string }>, res: Response) => {
    const { tableSessionId } = req.params;
    if (!tableSessionId) throw new ApiError(400, "TableSessionId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");
    const userId = req.user?.id;

    const bill = await prisma.$transaction(async (tx) =>
        generateBillForSession(tx, { shopId, tableSessionId, userId }),
    );

    return res.status(201).json({
        success: true,
        message: "Bill generated successfully",
        data: { bill },
    });
};

export const getBillById = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "BillId is required");

    const bill = await prisma.bill.findUnique({
        where: { id },
        include: BILL_INCLUDE,
    });
    if (!bill) throw new ApiError(404, "Bill not found");

    return res.status(200).json({
        success: true,
        message: "Bill fetched successfully",
        data: { bill },
    });
};

export const getAllBills = async (req: Request, res: Response) => {
    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");

    const bills = await prisma.bill.findMany({
        where: { shopId },
        include: BILL_INCLUDE,
        orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
        success: true,
        message: "Bills fetched successfully",
        data: { bills },
    });
};

export const applyDiscountCtrl = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "BillId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");
    const userId = req.user?.id;

    // body can be { type, value } or null (to clear)
    let discount: { type: "PERCENT" | "FLAT"; value: number } | null = null;
    if (req.body !== null && req.body !== undefined && Object.keys(req.body).length > 0) {
        const validation = z.safeParse(ApplyDiscountSchema, req.body);
        if (!validation.success) throw new ApiError(400, "Invalid discount input", [validation.error]);
        discount = validation.data;
    }

    const bill = await prisma.$transaction(async (tx) =>
        applyDiscount(tx, { shopId, billId: id, userId, discount }),
    );

    return res.status(200).json({
        success: true,
        message: discount ? "Discount applied successfully" : "Discount cleared successfully",
        data: { bill },
    });
};

export const recordPaymentCtrl = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "BillId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");
    const userId = req.user?.id;

    const validation = z.safeParse(RecordPaymentSchema, req.body);
    if (!validation.success) throw new ApiError(400, "Invalid payment input", [validation.error]);

    const { mode, amount, reference, notes } = validation.data;

    const bill = await prisma.$transaction(async (tx) =>
        recordPayment(tx, { shopId, billId: id, userId, mode, amount, reference, notes }),
    );

    return res.status(200).json({
        success: true,
        message: "Payment recorded successfully",
        data: { bill },
    });
};

export const cancelBillCtrl = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "BillId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");
    const userId = req.user?.id;

    const validation = z.safeParse(CancelBillSchema, req.body);
    if (!validation.success) throw new ApiError(400, "Invalid input", [validation.error]);

    const bill = await prisma.$transaction(async (tx) =>
        cancelBill(tx, { shopId, billId: id, userId, reason: validation.data.reason }),
    );

    return res.status(200).json({
        success: true,
        message: "Bill cancelled successfully",
        data: { bill },
    });
};

export const getAuditCtrl = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "BillId is required");

    const audit = await listAuditForBill(prisma, id);

    return res.status(200).json({
        success: true,
        message: "Audit log fetched successfully",
        data: { audit },
    });
};

export const getReceiptCtrl = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "BillId is required");

    const userId = req.user?.id;

    const receipt = await prisma.$transaction(async (tx) =>
        buildReceiptDTO(tx, id, { userId, writeAuditEntry: true }),
    );

    return res.status(200).json({
        success: true,
        message: "Receipt fetched successfully",
        data: { receipt },
    });
};

// Public route: customer accesses their own bill via the WhatsApp link.
// No auth, no audit (would spam the log every time the customer reloads).
export const getPublicReceiptCtrl = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "BillId is required");

    const receipt = await buildReceiptDTO(prisma, id, { writeAuditEntry: false });

    return res.status(200).json({
        success: true,
        message: "Receipt fetched successfully",
        data: { receipt },
    });
};

export const sendWhatsAppCtrl = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "BillId is required");

    const shopId = req.user?.shopMembership?.shopId;
    if (!shopId) throw new ApiError(400, "User is not related to a shop");
    const userId = req.user?.id;

    const result = await prisma.$transaction(async (tx) =>
        buildWhatsAppLink(tx, { shopId, billId: id, userId }),
    );

    return res.status(200).json({
        success: true,
        message: "WhatsApp link generated",
        data: result,
    });
};
