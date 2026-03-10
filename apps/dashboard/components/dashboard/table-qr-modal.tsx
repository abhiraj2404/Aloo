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

interface TableQrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableNumber: number;
  shopId: string;
}

export function TableQrModal({ open, onOpenChange, tableNumber, shopId }: TableQrModalProps) {
  const [qrCode, setQrCode] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const tableLabel = `Table ${tableNumber}`;

  useEffect(() => {
    if (shopId && tableNumber) {
      const data = `${process.env.NEXT_PUBLIC_QR_URL}/${shopId}?tableNumber=${tableNumber}`;
      QRCode.toDataURL(data, { width: 250, margin: 2 }).then(setQrCode);
    }
  }, [shopId, tableNumber]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const data = `${process.env.NEXT_PUBLIC_QR_URL}/${shopId}?tableNumber=${tableNumber}`;
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
        }
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
