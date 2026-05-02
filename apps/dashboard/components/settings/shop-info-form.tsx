"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Loader2 } from "lucide-react";
import { ShopService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";

type ShopInfoFormProps = {
    shop: { id: string; name: string; address: string };
    onUpdated: (shop: { id: string; name: string; address: string }) => void;
};

export function ShopInfoForm({ shop, onUpdated }: ShopInfoFormProps) {
    const [name, setName] = useState(shop.name);
    const [address, setAddress] = useState(shop.address);
    const [isSaving, setIsSaving] = useState(false);
    const { success, error } = useToast();

    useEffect(() => {
        setName(shop.name);
        setAddress(shop.address);
    }, [shop.id, shop.name, shop.address]);

    const isDirty = name !== shop.name || address !== shop.address;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isDirty) return;

        const payload: { name?: string; address?: string } = {};
        if (name !== shop.name) payload.name = name.trim();
        if (address !== shop.address) payload.address = address.trim();

        setIsSaving(true);
        try {
            const updated = await ShopService.updateShop(payload);
            success("Shop updated successfully");
            onUpdated({ id: shop.id, name: updated.name, address: updated.address });
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to update shop";
            error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="shop-name">Shop Name</Label>
                <Input
                    id="shop-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your restaurant name"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="shop-address">Address</Label>
                <Input
                    id="shop-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, city, postal code"
                    required
                />
            </div>

            <div className="flex justify-end">
                <Button
                    type="submit"
                    className="bg-red-500 hover:bg-red-600"
                    disabled={!isDirty || isSaving || !name.trim() || !address.trim()}
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
