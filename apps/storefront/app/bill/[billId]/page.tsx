import { BillService } from "@repo/api-sdk";
import { PublicBillView } from "@/components/bill/public-bill-view";

interface PageProps {
    params: Promise<{ billId: string }>;
}

export default async function PublicBillPage({ params }: PageProps) {
    const { billId } = await params;

    let receipt;
    try {
        receipt = await BillService.getPublicReceipt(billId);
    } catch {
        receipt = null;
    }

    if (!receipt) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 bg-white">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-gray-900">Bill not found</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        This link may be expired or invalid.
                    </p>
                </div>
            </div>
        );
    }

    return <PublicBillView receipt={receipt} />;
}
