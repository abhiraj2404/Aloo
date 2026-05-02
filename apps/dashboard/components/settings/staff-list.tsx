"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@repo/ui/components/dialog";
import { VisuallyHidden } from "@repo/ui/components/visually-hidden";
import { Loader2, Trash2 } from "lucide-react";
import { StaffService, type StaffMember } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";

type StaffListProps = {
    staff: StaffMember[];
    onChange: () => void;
};

export function StaffList({ staff, onChange }: StaffListProps) {
    const [target, setTarget] = useState<StaffMember | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { success, error } = useToast();

    const handleConfirmRemove = async () => {
        if (!target) return;
        setIsDeleting(true);
        try {
            await StaffService.removeStaff(target.id);
            success(`${target.user.email} removed`);
            setTarget(null);
            onChange();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to remove staff";
            error(msg);
        } finally {
            setIsDeleting(false);
        }
    };

    if (staff.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 text-sm border border-dashed rounded-md">
                No staff members yet. Add one to get started.
            </div>
        );
    }

    return (
        <>
            <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="text-left px-4 py-2 font-medium">Email</th>
                            <th className="text-left px-4 py-2 font-medium">Name</th>
                            <th className="text-left px-4 py-2 font-medium">Joined</th>
                            <th className="text-right px-4 py-2 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staff.map((s) => (
                            <tr key={s.id} className="border-t border-gray-100">
                                <td className="px-4 py-2 text-gray-900">{s.user.email}</td>
                                <td className="px-4 py-2 text-gray-700">{s.user.name}</td>
                                <td className="px-4 py-2 text-gray-500 text-xs">
                                    {new Date(s.joinedAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => setTarget(s)}
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Remove
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
                <DialogContent>
                    <VisuallyHidden>
                        <DialogTitle>Remove Staff Confirmation</DialogTitle>
                    </VisuallyHidden>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold">Remove staff member</h3>
                        <p className="text-gray-600 mt-2">
                            Are you sure you want to remove{" "}
                            <span className="font-medium">{target?.user.email}</span>? They
                            will lose access to this shop's dashboard.
                        </p>
                        <div className="flex gap-2 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setTarget(null)}
                                className="flex-1"
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmRemove}
                                className="flex-1"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Removing...
                                    </>
                                ) : (
                                    "Remove"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
