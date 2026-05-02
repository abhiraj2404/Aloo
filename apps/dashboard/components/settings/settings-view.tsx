"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@repo/ui/components/dialog";
import { VisuallyHidden } from "@repo/ui/components/visually-hidden";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { ShopService, StaffService, type StaffMember } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";
import { ShopInfoForm } from "./shop-info-form";
import { StaffList } from "./staff-list";
import { AddStaffForm } from "./add-staff-form";
import { BillingConfigForm } from "./billing-config-form";

type ShopInfo = { id: string; name: string; address: string };
type BillingConfig = {
    gstNumber: string;
    cgstRate: number;
    sgstRate: number;
    serviceChargeRate: number;
};

export function SettingsView() {
    const [shop, setShop] = useState<ShopInfo | null>(null);
    const [billingConfig, setBillingConfig] = useState<BillingConfig | null>(null);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const { error } = useToast();

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        try {
            const [shopRes, staffRes] = await Promise.all([
                ShopService.getMyShop(),
                StaffService.getStaff(),
            ]);
            setShop({
                id: shopRes.id,
                name: shopRes.name,
                address: shopRes.address,
            });
            setBillingConfig({
                gstNumber: shopRes.gstNumber || "",
                cgstRate: shopRes.cgstRate || 0,
                sgstRate: shopRes.sgstRate || 0,
                serviceChargeRate: shopRes.serviceChargeRate || 0,
            });
            setStaff(staffRes);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to load settings";
            error(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const refreshStaff = useCallback(async () => {
        try {
            const next = await StaffService.getStaff();
            setStaff(next);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to refresh staff";
            error(msg);
        }
    }, [error]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Settings</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={fetchAll}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 h-[calc(100vh-160px)]">
                <div className="max-w-3xl mx-auto py-4 space-y-4 pr-4">
                    {isLoading && !shop ? (
                        <div className="flex items-center justify-center py-12 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading settings...
                        </div>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Shop Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {shop && (
                                        <ShopInfoForm
                                            shop={shop}
                                            onUpdated={(updated) => setShop(updated)}
                                        />
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Staff Members</CardTitle>
                                    <Button
                                        size="sm"
                                        className="bg-red-500 hover:bg-red-600"
                                        onClick={() => setIsAddOpen(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Staff
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <StaffList staff={staff} onChange={refreshStaff} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Billing Configuration</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {billingConfig && (
                                        <BillingConfigForm
                                            config={billingConfig}
                                            onUpdated={(updated) => setBillingConfig(updated)}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </ScrollArea>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="border-0 bg-transparent p-0 shadow-none max-w-md">
                    <VisuallyHidden>
                        <DialogTitle>Add Staff</DialogTitle>
                    </VisuallyHidden>
                    <AddStaffForm
                        onSuccess={() => {
                            setIsAddOpen(false);
                            refreshStaff();
                        }}
                        onCancel={() => setIsAddOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
