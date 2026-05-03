import { ApiError } from "../../utils/ApiError";
import { writeAudit } from "./audit";
import type { DbClient } from "./numbering";

const STOREFRONT_URL =
    process.env.STOREFRONT_URL || "http://localhost:5001";

export type WhatsAppLinkResult = {
    url: string;          // wa.me deep link, ready to open
    phone: string;        // E.164 phone the message will go to
    message: string;      // pre-filled message
    publicBillUrl: string;
};

export const buildWhatsAppLink = async (
    db: DbClient,
    params: { shopId: string; billId: string; userId?: string | null },
): Promise<WhatsAppLinkResult> => {
    const { shopId, billId, userId } = params;

    const bill = await db.bill.findUnique({
        where: { id: billId },
        include: {
            shop: { select: { name: true } },
            customer: { select: { phone: true, name: true } },
        },
    });

    if (!bill) throw new ApiError(404, "Bill not found");
    if (bill.shopId !== shopId) throw new ApiError(403, "You do not have access to this bill");
    if (!bill.customer?.phone) {
        throw new ApiError(400, "No customer phone on this bill — bill cannot be sent via WhatsApp");
    }

    const totalRupees = (bill.totalAmount / 100).toFixed(2);
    const publicBillUrl = `${STOREFRONT_URL.replace(/\/$/, "")}/bill/${bill.id}`;
    const greeting = bill.customer.name ? `Hi ${bill.customer.name}` : "Hi";
    const message =
        `${greeting}, your bill at ${bill.shop.name} (#${bill.billNumber}): ₹${totalRupees}. ` +
        `View: ${publicBillUrl}`;

    // wa.me wants the number with no +, no spaces, no dashes — just digits
    const phoneDigits = bill.customer.phone.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;

    await writeAudit(db, {
        shopId,
        userId,
        action: "BILL_WHATSAPP_SENT",
        entity: "BILL",
        entityId: billId,
        metadata: { phone: bill.customer.phone, billNumber: bill.billNumber },
    });

    return {
        url,
        phone: bill.customer.phone,
        message,
        publicBillUrl,
    };
};
