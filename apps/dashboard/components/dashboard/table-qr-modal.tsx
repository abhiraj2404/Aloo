"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Check, Download, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { TableService } from "@repo/api-sdk";
import { useToast } from "@/lib/use-toast";

interface TableQrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  tableNumber: number;
  shopId: string;
  onMutated?: () => void;
}

export function TableQrModal({ open, onOpenChange, tableId, tableNumber, shopId, onMutated }: TableQrModalProps) {
  const [qrCode, setQrCode] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(tableNumber));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const tableLabel = `Table ${tableNumber}`;
  const { success, error: toastError } = useToast();

  useEffect(() => {
    if (shopId && tableNumber) {
      const base = (process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "").replace(/\/$/, "");
      const data = `${base}/shop/${shopId}?table=${tableNumber}`;
      QRCode.toDataURL(data, { width: 250, margin: 2 }).then(setQrCode);
    }
  }, [shopId, tableNumber]);

  // Reset transient state whenever the modal closes/reopens
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setEditValue(String(tableNumber));
      setConfirmDelete(false);
    }
  }, [open, tableNumber]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const base = (process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "").replace(/\/$/, "");
      const data = `${base}/shop/${shopId}?table=${tableNumber}`;
      const qrCanvas = document.createElement("canvas");
      await QRCode.toCanvas(qrCanvas, data, { width: 600, margin: 2 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 800;
      canvas.height = 1000;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "black";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText(tableLabel, canvas.width / 2, 130);

      const qrY = 200;
      const qrX = (canvas.width - qrCanvas.width) / 2;
      ctx.drawImage(qrCanvas, qrX, qrY);

      ctx.strokeStyle = "black";
      ctx.lineWidth = 4;
      ctx.strokeRect(qrX - 2, qrY - 2, qrCanvas.width + 4, qrCanvas.height + 4);

      const logoSvg = `<svg width="120" height="35" viewBox="0 0 240 70" xmlns="http://www.w3.org/2000/svg">
        <g fill="gray">
          <path d="M15 55 L35 15 L55 55 L47 55 L42 43 L28 43 L23 55 Z"/>
          <rect x="70" y="15" width="10" height="40" rx="3"/>
          <rect x="70" y="45" width="28" height="10" rx="3"/>
          <ellipse cx="145" cy="35" rx="20" ry="18"/>
          <ellipse cx="185" cy="35" rx="19" ry="17"/>
        </g>
      </svg>`;
      const logo = new Image();
      logo.src = `data:image/svg+xml,${encodeURIComponent(logoSvg)}`;
      await new Promise((resolve) => {
        logo.onload = resolve;
      });
      ctx.drawImage(logo, canvas.width - 120, 850, 100, 35);

      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `table-${tableNumber}-qr.png`;
          link.click();
          URL.revokeObjectURL(link.href);
          success("QR code downloaded successfully!");
        }
      });
    } catch (err) {
      toastError("Failed to download QR code");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveEdit = async () => {
    const n = parseInt(editValue, 10);
    if (!Number.isInteger(n) || n <= 0) {
      toastError("Table number must be a positive integer");
      return;
    }
    if (n === tableNumber) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await TableService.updateTable(tableId, n);
      success(`Renamed to Table ${n}`);
      setIsEditing(false);
      onMutated?.();
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to rename table";
      toastError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await TableService.deleteTable(tableId);
      success(`Table ${tableNumber} deleted`);
      onMutated?.();
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete table";
      toastError(msg);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isEditing ? (
              <div className="flex items-center justify-center gap-2">
                <span>Table</span>
                <Input
                  type="number"
                  min={1}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") setIsEditing(false);
                  }}
                  disabled={isSaving}
                  className="h-9 w-24 text-center"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>{tableLabel}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400 hover:text-blue-600"
                  onClick={() => {
                    setEditValue(String(tableNumber));
                    setIsEditing(true);
                  }}
                  title="Rename table"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-white p-6 rounded-xl border-2">
            <img
              src={qrCode}
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
          <Button variant="outline" className="w-full" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isDownloading ? "Generating..." : "Download"}
          </Button>

          {confirmDelete ? (
            <div className="w-full p-3 rounded-lg border border-red-200 bg-red-50 space-y-2">
              <p className="text-sm text-red-700">Delete {tableLabel}? This can't be undone.</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Table
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
