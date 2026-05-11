import { ApiError } from "../../utils/ApiError";
import { writeAudit } from "./audit";
import type { DbClient } from "./numbering";

export type ReceiptDTO = {
    billId: string;
    billNumber: string;
    shopName: string;
    shopAddress: string;
    gstNumber: string | null;
    tableName: string | null;
    pax: number | null;
    createdAt: string;

    customer: {
        name: string | null;
        phone: string;
    } | null;

    items: {
        name: string;
        variantName: string | null;
        addons: { name: string; price: number }[];
        quantity: number;
        price: number;        // paise per unit (variant + addons baked in)
        total: number;        // paise
    }[];

    subtotal: number;
    discountType: string | null;
    discountValue: number;
    discountAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    serviceChargeAmount: number;
    roundOff: number;
    totalAmount: number;
    paidAmount: number;
    balance: number;

    payments: {
        mode: string;
        amount: number;
        reference: string | null;
        createdAt: string;
    }[];

    status: string;
};

export const buildReceiptDTO = async (
    db: DbClient,
    billId: string,
    options: { userId?: string | null; writeAuditEntry?: boolean } = {},
): Promise<ReceiptDTO> => {
    const bill = await db.bill.findUnique({
        where: { id: billId },
        include: {
            shop: true,
            customer: { select: { id: true, phone: true, name: true } },
            payments: { orderBy: { createdAt: "asc" } },
            tableSession: {
                include: {
                    table: true,
                    orders: {
                        where: { status: { not: "CANCELLED" } },
                        include: { orderItems: true },
                    },
                },
            },
        },
    });

    if (!bill) throw new ApiError(404, "Bill not found");

    const items = bill.tableSession.orders.flatMap((order) =>
        order.orderItems.map((oi) => ({
            name: oi.name,
            variantName: oi.variantName ?? null,
            addons: Array.isArray(oi.addons) ? (oi.addons as { name: string; price: number }[]) : [],
            quantity: oi.quantity,
            price: oi.price,
            total: oi.price * oi.quantity,
        })),
    );

    if (options.writeAuditEntry) {
        await writeAudit(db, {
            shopId: bill.shopId,
            userId: options.userId ?? null,
            action: "BILL_PRINTED",
            entity: "BILL",
            entityId: billId,
        });
    }

    return {
        billId: bill.id,
        billNumber: bill.billNumber,
        shopName: bill.shop.name,
        shopAddress: bill.shop.address,
        gstNumber: bill.shop.gstNumber,
        tableName: bill.tableSession.table
            ? `Table ${bill.tableSession.table.tableNumber}`
            : null,
        pax: bill.tableSession.pax ?? null,
        createdAt: bill.createdAt.toISOString(),

        customer: bill.customer
            ? { name: bill.customer.name, phone: bill.customer.phone }
            : null,

        items,

        subtotal: bill.subtotal,
        discountType: bill.discountType,
        discountValue: bill.discountValue,
        discountAmount: bill.discountAmount,
        cgstAmount: bill.cgstAmount,
        sgstAmount: bill.sgstAmount,
        serviceChargeAmount: bill.serviceChargeAmount,
        roundOff: bill.roundOff,
        totalAmount: bill.totalAmount,
        paidAmount: bill.paidAmount,
        balance: bill.totalAmount - bill.paidAmount,

        payments: bill.payments.map((p) => ({
            mode: p.mode,
            amount: p.amount,
            reference: p.reference,
            createdAt: p.createdAt.toISOString(),
        })),

        status: bill.status,
    };
};
