import type { Prisma } from "@repo/database";

export type DbClient = Prisma.TransactionClient;

export const currentFinancialYear = (now = new Date()): string => {
    const m = now.getMonth(); // 0-based; April = 3
    const y = now.getFullYear();
    const start = m >= 3 ? y : y - 1;
    return `FY${String(start).slice(2)}-${String(start + 1).slice(2)}`;
};

export const nextBillNumber = async (
    db: DbClient,
    shopId: string,
    now = new Date(),
): Promise<string> => {
    const fy = currentFinancialYear(now);
    const seq = await db.billNumberSequence.upsert({
        where: { shopId_financialYear: { shopId, financialYear: fy } },
        update: { lastNumber: { increment: 1 } },
        create: { shopId, financialYear: fy, lastNumber: 1 },
    });
    return `${fy}/${String(seq.lastNumber).padStart(4, "0")}`;
};
