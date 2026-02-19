"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Download, Share2 } from "lucide-react";

interface TableQrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableNumber: number;
  categoryName?: string;
}

export function TableQrModal({ open, onOpenChange, tableNumber, categoryName }: TableQrModalProps) {
  const tableLabel = categoryName ? `${categoryName} - Table ${tableNumber}` : `Table ${tableNumber}`;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{tableLabel}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {/* QR Code Image */}
          <div className="bg-white p-6 rounded-xl border-2">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://aloo.app/menu?table=1"
              alt={`QR Code for ${tableLabel}`}
              width={250}
              height={250}
              className="rounded"
            />
          </div>
          <div className="text-center">
            <p className="font-medium text-lg">Scan to Order</p>
            <p className="text-sm text-gray-500">
              Customers can scan this QR to view menu & place orders
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
