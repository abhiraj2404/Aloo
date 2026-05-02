"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BillService, type ReceiptDTO } from "@repo/api-sdk";
import { ReceiptPrintView } from "@/components/bills/receipt-print-view";
import { Loader2 } from "lucide-react";

export default function ReceiptPage() {
    const params = useParams();
    const billId = params.billId as string;
    const [receipt, setReceipt] = useState<ReceiptDTO | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!billId) return;

        const fetchAndPrint = async () => {
            try {
                const data = await BillService.getReceipt(billId);
                setReceipt(data);
                // Auto-print after a brief delay to let the DOM render
                setTimeout(() => window.print(), 500);
            } catch (err: any) {
                setError(err?.response?.data?.message || "Failed to load receipt");
            }
        };

        fetchAndPrint();
    }, [billId]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (!receipt) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading receipt...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex justify-center py-8">
            <ReceiptPrintView receipt={receipt} />
        </div>
    );
}
