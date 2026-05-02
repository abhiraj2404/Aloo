"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Loader2 } from "lucide-react";
import { ShopService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";

type BillingConfig = {
    gstNumber: string;
    cgstRate: number;   // basis points
    sgstRate: number;
    serviceChargeRate: number;
};

type BillingConfigFormProps = {
    config: BillingConfig;
    onUpdated: (config: BillingConfig) => void;
};

// Convert basis points (250) to display percentage (2.5)
const bpToPercent = (bp: number) => (bp / 100).toFixed(2);
// Convert display percentage (2.5) to basis points (250)
const percentToBp = (pct: string) => Math.round(parseFloat(pct || "0") * 100);

export function BillingConfigForm({ config, onUpdated }: BillingConfigFormProps) {
    const [gstNumber, setGstNumber] = useState(config.gstNumber || "");
    const [cgstPct, setCgstPct] = useState(bpToPercent(config.cgstRate));
    const [sgstPct, setSgstPct] = useState(bpToPercent(config.sgstRate));
    const [scPct, setScPct] = useState(bpToPercent(config.serviceChargeRate));
    const [isSaving, setIsSaving] = useState(false);
    const { success, error } = useToast();

    useEffect(() => {
        setGstNumber(config.gstNumber || "");
        setCgstPct(bpToPercent(config.cgstRate));
        setSgstPct(bpToPercent(config.sgstRate));
        setScPct(bpToPercent(config.serviceChargeRate));
    }, [config.gstNumber, config.cgstRate, config.sgstRate, config.serviceChargeRate]);

    const isDirty =
        gstNumber !== (config.gstNumber || "") ||
        percentToBp(cgstPct) !== config.cgstRate ||
        percentToBp(sgstPct) !== config.sgstRate ||
        percentToBp(scPct) !== config.serviceChargeRate;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isDirty) return;

        const payload: Record<string, any> = {};
        const newGst = gstNumber.trim() || null;
        if (newGst !== (config.gstNumber || null)) payload.gstNumber = newGst;

        const newCgst = percentToBp(cgstPct);
        const newSgst = percentToBp(sgstPct);
        const newSc = percentToBp(scPct);
        if (newCgst !== config.cgstRate) payload.cgstRate = newCgst;
        if (newSgst !== config.sgstRate) payload.sgstRate = newSgst;
        if (newSc !== config.serviceChargeRate) payload.serviceChargeRate = newSc;

        if (Object.keys(payload).length === 0) return;

        setIsSaving(true);
        try {
            await ShopService.updateShop(payload);
            success("Billing configuration updated");
            onUpdated({
                gstNumber: newGst || "",
                cgstRate: newCgst,
                sgstRate: newSgst,
                serviceChargeRate: newSc,
            });
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to update billing config";
            error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="gst-number">GST Number</Label>
                <Input
                    id="gst-number"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    maxLength={20}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="cgst-rate">CGST %</Label>
                    <Input
                        id="cgst-rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={cgstPct}
                        onChange={(e) => setCgstPct(e.target.value)}
                        placeholder="2.50"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sgst-rate">SGST %</Label>
                    <Input
                        id="sgst-rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={sgstPct}
                        onChange={(e) => setSgstPct(e.target.value)}
                        placeholder="2.50"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sc-rate">Service Charge %</Label>
                    <Input
                        id="sc-rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={scPct}
                        onChange={(e) => setScPct(e.target.value)}
                        placeholder="5.00"
                    />
                </div>
            </div>

            <p className="text-xs text-gray-500">
                Tax rates are applied on the taxable amount (subtotal − discount). Service charge is also on the taxable amount.
            </p>

            <div className="flex justify-end">
                <Button
                    type="submit"
                    className="bg-red-500 hover:bg-red-600"
                    disabled={!isDirty || isSaving}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </div>
        </form>
    );
}
