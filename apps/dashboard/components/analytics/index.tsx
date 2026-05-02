"use client";

import { useEffect, useState, useCallback } from "react";
import { AnalyticsService } from "@repo/api-sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { IndianRupee, Users, Receipt, LayoutDashboard, RefreshCw, Clock, Utensils, CheckCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

type AnalyticsData = {
  periodRevenue: number;
  totalRevenue: number;
  periodOrdersCount: number;
  activeTablesCount: number;
  revenueByDate: { date: string; revenue: number }[];
  topSellingItems: { name: string; count: number; revenue: number }[];
  categorySales: { name: string; value: number }[];
  orderStatusSnapshot: { PENDING: number; CONFIRMED: number; PREPARING: number };
};

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

// Formats price from paise
const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount / 100);
};

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("today");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const fetchAnalytics = useCallback(async () => {
    if (period === "custom" && (!customStartDate || !customEndDate)) {
      return;
    }
    setLoading(true);
    try {
      const result = await AnalyticsService.getDashboardAnalytics(period, customStartDate, customEndDate);
      setData(result);
    } catch (e) {
      console.error("Failed to load analytics", e);
    } finally {
      setLoading(false);
    }
  }, [period, customStartDate, customEndDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-500">Track orders, revenue, and customer trends in real time.</p>
        </div>

        <div className="flex items-center gap-3">
          {period === "custom" && (
            <div className="flex items-center gap-2 mr-2">
              <input
                type="date"
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="date"
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-gray-400' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatPrice(data?.periodRevenue || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period Orders</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.periodOrdersCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.activeTablesCount || 0}</div>
            <p className="text-xs text-muted-foreground text-gray-500">Guests seated right now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(data?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground text-gray-500">All time earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Order Status Snapshot */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-yellow-50/50 border-yellow-200">
          <CardContent className="p-4 flex items-center gap-4">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Pending Orders</p>
              <p className="text-2xl font-bold text-yellow-600">{data?.orderStatusSnapshot?.PENDING || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-800">Confirmed Orders</p>
              <p className="text-2xl font-bold text-blue-600">{data?.orderStatusSnapshot?.CONFIRMED || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50/50 border-orange-200">
          <CardContent className="p-4 flex items-center gap-4">
            <Utensils className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-orange-800">Preparing Orders</p>
              <p className="text-2xl font-bold text-orange-600">{data?.orderStatusSnapshot?.PREPARING || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trending</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.revenueByDate || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                    fontSize={12}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val / 100}`}
                    fontSize={12}
                    width={60}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatPrice(value), "Revenue"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: "#ef4444" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Category Sales Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {(!data?.categorySales || data.categorySales.length === 0) ? (
              <p className="text-sm text-gray-500 italic flex items-center justify-center h-[250px]">No sales data available yet.</p>
            ) : (
              <div className="h-[320px] sm:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categorySales}
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.categorySales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [formatPrice(value), "Sales"]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {(!data?.topSellingItems || data.topSellingItems.length === 0) ? (
              <p className="text-sm text-gray-500 italic">No sales data available yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.topSellingItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{item.name}</p>
                      <p className="text-xs text-muted-foreground text-gray-500">
                        {item.count} ordered
                      </p>
                    </div>
                    <div className="font-semibold text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                      {formatPrice(item.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
