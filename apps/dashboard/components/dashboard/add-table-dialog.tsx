"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { TableService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";

interface AddTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  onCreated: () => void;
}

export function AddTableDialog({ open, onOpenChange, shopId, onCreated }: AddTableDialogProps) {
  const [tableNumber, setTableNumber] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async () => {
    const n = parseInt(tableNumber, 10);
    if (!Number.isInteger(n) || n <= 0) {
      error("Table number must be a positive integer");
      return;
    }
    setIsSubmitting(true);
    try {
      await TableService.createTable(shopId, n);
      success(`Table ${n} added`);
      setTableNumber("");
      onCreated();
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to add table";
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Table</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <label className="text-xs font-medium text-gray-600">Table number</label>
          <Input
            type="number"
            min={1}
            placeholder="e.g. 12"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            disabled={isSubmitting}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            autoFocus
          />
          <p className="text-xs text-gray-500">Each shop can have only one table per number.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            {isSubmitting ? "Adding..." : "Add Table"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
