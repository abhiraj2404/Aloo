"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useToast } from "@/lib/use-toast";

interface RestaurantQrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  shopName?: string;
}

// Restaurant-wide QR — no table param. Storefront prompts for dine-in/takeaway
// + table number at checkout. Stick this at the entrance, counter, or food-court
// hub.
export function RestaurantQrModal({ open, onOpenChange, shopId, shopName }: RestaurantQrModalProps) {
  const [qrCode, setQrCode] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const { success, error: toastError } = useToast();
  const label = shopName ? `${shopName} — Scan to Order` : "Scan to Order";

  useEffect(() => {
    if (!open || !shopId) return;
    const base = (process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "").replace(/\/$/, "");
    const data = `${base}/shop/${shopId}`;
    QRCode.toDataURL(data, { width: 250, margin: 2 }).then(setQrCode);
  }, [open, shopId]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const base = (process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "").replace(/\/$/, "");
      const data = `${base}/shop/${shopId}`;
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
      ctx.font = "bold 40px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Scan to Order", canvas.width / 2, 110);
      if (shopName) {
        ctx.font = "28px Arial";
        ctx.fillText(shopName, canvas.width / 2, 160);
      }

      const qrY = 220;
      const qrX = (canvas.width - qrCanvas.width) / 2;
      ctx.drawImage(qrCanvas, qrX, qrY);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 4;
      ctx.strokeRect(qrX - 2, qrY - 2, qrCanvas.width + 4, qrCanvas.height + 4);

      ctx.font = "20px Arial";
      ctx.fillText("Pick Dine-in or Takeaway at checkout", canvas.width / 2, 900);

      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `restaurant-qr.png`;
          link.click();
          URL.revokeObjectURL(link.href);
          success("QR downloaded");
        }
      });
    } catch (err) {
      toastError("Failed to download QR");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Restaurant QR</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-white p-6 rounded-xl border-2">
            {qrCode ? (
              <img
                src={qrCode}
                alt={label}
                width={250}
                height={250}
                className="rounded"
              />
            ) : (
              <div className="w-[250px] h-[250px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          <div className="text-center px-4">
            <p className="font-medium text-base">Single QR for the whole restaurant</p>
            <p className="text-sm text-gray-500 mt-1">
              Place at the entrance or counter. Customers pick Dine-in or Takeaway at checkout — and choose their table number if dining in.
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
