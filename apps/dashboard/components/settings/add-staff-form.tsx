"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Loader2 } from "lucide-react";
import { StaffService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";

type AddStaffFormProps = {
    onSuccess: () => void;
    onCancel: () => void;
};

export function AddStaffForm({ onSuccess, onCancel }: AddStaffFormProps) {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) return;

        setIsSubmitting(true);
        try {
            await StaffService.addStaff(trimmed);
            success(`Credentials sent to ${trimmed}`);
            setEmail("");
            onSuccess();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to add staff";
            error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-5 space-y-4">
            <div>
                <h3 className="text-lg font-semibold">Add Staff Member</h3>
                <p className="text-sm text-gray-500 mt-1">
                    A temporary password will be generated and emailed to this address.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                    id="staff-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@example.com"
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="flex-1 bg-red-500 hover:bg-red-600"
                    disabled={isSubmitting || !email.trim()}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Sending...
                        </>
                    ) : (
                        "Add & Send Email"
                    )}
                </Button>
            </div>
        </form>
    );
}
