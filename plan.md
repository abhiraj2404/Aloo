lan
  ⎿  Current Plan
     C:\Users\chauh.claude\plans\magical-whistling-moler.md

     Plan: Billing MVP — modular monolith refactor + 8 features

     Context

     Current billing in services/api-gateway/src/controllers/bill.controller.ts is minimal: generateBill sums
     Order.totalAmount for a TableSession into a Bill row with subtotal = totalAmount, tax = 0, discount = 0. Status
     flow is GENERATED → PAID | CANCELLED. No tax math, no discounts, no payment-mode tracking, no bill numbers, no
     receipt, no audit, no order-type tagging.

     We agreed to keep everything inside api-gateway and refactor it to a modular monolith — introduce a modules/
     business-logic layer, keep controllers thin, and ship 8 MVP features that close the gap with a PetPooja-class core
     billing flow:

     1. Tax engine (CGST + SGST, shop-configurable)
     2. Discount (bill-level, % or flat)
     3. Round-off (to nearest rupee)
     4. Multiple payment modes (cash, card, UPI, wallet, other) with split / partial support
     5. FY-aware sequential bill numbering (FY25-26/0001, gap-free per shop)
     6. Print/share receipt (browser-rendered styled page, window.print())
     7. Order types (DINE_IN | TAKEAWAY | DELIVERY)
     8. Audit log (who did what, when)

     Money stays in paise (integers) — already the codebase convention. Tax/discount percentages stored in basis points
     (e.g., 250 = 2.5%) to keep all math integer.

     ---
     Architecture: modular monolith inside api-gateway

     New folder under services/api-gateway/src/:

     modules/
     └── billing/
         ├── compute.ts        # pure: subtotal → discount → tax → service → roundoff → total
         ├── numbering.ts      # nextBillNumber(tx, shopId) — FY-aware, transactional
         ├── generate.ts       # generateBillForSession(tx, ctx) — used by generate endpoint
         ├── settle.ts         # recordPayment(tx, ...) — appends Payment, may flip status
         ├── discount.ts       # applyDiscount / clearDiscount — recomputes totals
         ├── cancel.ts         # cancelBill — guards + audit
         ├── audit.ts          # writeAudit(tx, {...}) helper
         └── receipt.ts        # buildReceiptDTO(billId) — render-ready data

     Each function takes a Prisma.TransactionClient | PrismaClient first arg (call it db) so it can be composed inside
     prisma.$transaction. No Express types in modules/.

     Controllers in services/api-gateway/src/controllers/bill.controller.ts become 10-line wrappers: validate body with
     Zod → call module function → respond. Existing generateBill/getBillById/getAllBills get reorganised to use the new
     modules. updateBillStatus is deleted and replaced by explicit endpoints (see below).

     This is a no-behaviour-change refactor first; the new features land in the new modules.

     ---
     Schema changes — packages/database/prisma/models/

     shop.prisma — add billing config fields to Shop

     model Shop {
         // existing fields...

         // billing config
         gstNumber          String?
         cgstRate           Int     @default(0)   // basis points, 0-10000 (e.g. 250 = 2.5%)
         sgstRate           Int     @default(0)
         serviceChargeRate  Int     @default(0)

         // existing relations...
         bills              Bill[]
         payments           Payment[]
         auditLogs          AuditLog[]
         billNumberSequences BillNumberSequence[]
     }

     order.prisma — extend enums + Bill model + new models

     enum OrderType {
         DINE_IN
         TAKEAWAY
         DELIVERY
     }

     enum BillStatus {
         GENERATED
         PARTIALLY_PAID  // NEW
         PAID
         CANCELLED
     }

     enum DiscountType {
         PERCENT  // value in basis points
         FLAT     // value in paise
     }

     enum PaymentMode {
         CASH
         CARD
         UPI
         WALLET
         OTHER
     }

     enum AuditAction {
         BILL_GENERATED
         BILL_DISCOUNT_APPLIED
         BILL_DISCOUNT_CLEARED
         BILL_PAYMENT_RECORDED
         BILL_CANCELLED
         BILL_PRINTED
     }

     model Order {
         // existing fields...
         orderType  OrderType  @default(DINE_IN)
     }

     model Bill {
         id              String        @id @default(cuid())
         shopId          String
         tableSessionId  String        @unique

         billNumber      String                              // "FY25-26/0001"
         subtotal        Int

         discountType    DiscountType?
         discountValue   Int           @default(0)          // bp if PERCENT, paise if FLAT
         discountAmount  Int           @default(0)          // computed paise

         cgstAmount      Int           @default(0)
         sgstAmount      Int           @default(0)
         serviceChargeAmount Int       @default(0)

         roundOff        Int           @default(0)          // can be negative
         totalAmount     Int
         paidAmount      Int           @default(0)

         status          BillStatus    @default(GENERATED)
         cancelledReason String?

         createdAt DateTime @default(now())
         updatedAt DateTime @updatedAt

         shop         Shop         @relation(fields: [shopId], references: [id])
         tableSession TableSession @relation(fields: [tableSessionId], references: [id])
         payments     Payment[]

         @@unique([shopId, billNumber])
         @@index([shopId, createdAt])
     }

     model Payment {
         id        String      @id @default(cuid())
         billId    String
         shopId    String
         mode      PaymentMode
         amount    Int                                      // paise
         reference String?                                  // txn id for UPI/card
         notes     String?
         createdAt DateTime    @default(now())

         bill Bill @relation(fields: [billId], references: [id], onDelete: Cascade)
         shop Shop @relation(fields: [shopId], references: [id])

         @@index([billId])
         @@index([shopId, createdAt])
     }

     model BillNumberSequence {
         id            String @id @default(cuid())
         shopId        String
         financialYear String                              // "FY25-26"
         lastNumber    Int    @default(0)

         shop Shop @relation(fields: [shopId], references: [id])

         @@unique([shopId, financialYear])
     }

     model AuditLog {
         id        String      @id @default(cuid())
         shopId    String
         userId    String?
         action    AuditAction
         entity    String                                  // "BILL"
         entityId  String
         metadata  Json?
         createdAt DateTime    @default(now())

         shop Shop  @relation(fields: [shopId], references: [id])
         user User? @relation(fields: [userId], references: [id])

         @@index([shopId, createdAt])
         @@index([entity, entityId])
     }

     user.prisma — add the auditLogs back-relation on User.

     Migration strategy

     pnpm --filter @repo/database db:migrate dev --name billing_mvp will generate the migration. To handle existing
     data:

     - New nullable / defaulted columns are safe.
     - Bill.billNumber is required + unique. Backfill in the migration's data step: walk existing bills ordered by
     createdAt, assign sequential numbers per shop per FY, then add the NOT NULL + unique constraint. (If the dev DB has
      no real data, just truncate Bill before migrating — simpler.)
     - Existing PAID bills should have paidAmount = totalAmount and a synthetic Payment row with mode: OTHER (so reports
      stay consistent). Add this as a one-shot services/api-gateway/scripts/backfill-bills.ts if needed.

     ---
     Compute module — modules/billing/compute.ts

     Single pure function. All inputs/outputs in paise; rates in basis points.

     type ComputeInput = {
         subtotal: number;
         discountType?: "PERCENT" | "FLAT" | null;
         discountValue?: number;       // bp or paise
         cgstRateBp: number;
         sgstRateBp: number;
         serviceChargeRateBp: number;
     };

     type ComputeOutput = {
         subtotal: number;
         discountAmount: number;
         taxableAmount: number;        // subtotal - discount
         cgstAmount: number;
         sgstAmount: number;
         serviceChargeAmount: number;
         preRoundTotal: number;
         roundOff: number;             // can be negative
         totalAmount: number;
     };

     // Order: subtotal → discount → tax (CGST/SGST on taxable) → serviceCharge (on taxable)
     //        → preRound = taxable + cgst + sgst + service
     //        → roundOff = nearestRupee(preRound) - preRound
     //        → total = preRound + roundOff

     Discount caps at subtotal. Anything < 0 is clamped to 0. nearestRupee(x) = Math.round(x / 100) * 100.

     This is the only place these computations live. Called from generate.ts, discount.ts, and any future "edit items"
     flow.

     ---
     Numbering module — modules/billing/numbering.ts

     export const currentFinancialYear = (now = new Date()) => {
         const m = now.getMonth(); // 0-based
         const y = now.getFullYear();
         const start = m >= 3 ? y : y - 1; // April (m=3) starts new FY
         return `FY${String(start).slice(2)}-${String(start + 1).slice(2)}`; // "FY25-26"
     };

     export const nextBillNumber = async (
         db: PrismaTx,
         shopId: string,
         now = new Date()
     ): Promise<string> => {
         const fy = currentFinancialYear(now);
         const seq = await db.billNumberSequence.upsert({
             where: { shopId_financialYear: { shopId, financialYear: fy } },
             update: { lastNumber: { increment: 1 } },
             create: { shopId, financialYear: fy, lastNumber: 1 },
         });
         return `${fy}/${String(seq.lastNumber).padStart(4, "0")}`;
     };

     Concurrency: called inside the same prisma.$transaction as Bill.create. Postgres row-level lock on the upserted
     sequence row guarantees gap-free numbering per (shopId, financialYear).

     ---
     Audit helper — modules/billing/audit.ts

     export const writeAudit = (db: PrismaTx, params: {
         shopId: string;
         userId?: string;
         action: AuditAction;
         entity: string;        // "BILL"
         entityId: string;
         metadata?: object;
     }) => db.auditLog.create({ data: { ...params, metadata: params.metadata ?? Prisma.JsonNull } });

     Called inside the same transaction as the mutation it records.

     ---
     Endpoints — services/api-gateway/src/routes/bill.route.ts

     Replace existing routes with:

     POST   /bill/generate/:tableSessionId   # generate (uses shop config for tax rates)
     GET    /bill                            # list (existing)
     GET    /bill/:id                        # detail (existing — extend response shape)
     PATCH  /bill/:id/discount               # body: { type, value } | null to clear
     POST   /bill/:id/payment                # body: { mode, amount, reference?, notes? }
     PATCH  /bill/:id/cancel                 # body: { reason }
     GET    /bill/:id/audit                  # audit trail for one bill
     GET    /bill/:id/receipt                # receipt-ready DTO

     updateBillStatus (the old PATCH /:id/status) is removed; the new endpoints replace it cleanly.

     Shop billing config is patched via the existing PUT /shop (updateShop). Extend UpdateShopSchema in
     packages/types/src/shop/index.ts to optionally accept gstNumber, cgstRate, sgstRate, serviceChargeRate (validated
     0-10000 for rates).

     All routes keep existing authMiddleware + authorizedRoles("OWNER","STAFF") gating.

     ---
     Types — packages/types/src/bill/index.ts

     Replace the current minimal BillSchema with the new shape (all the new fields + enums for DiscountType,
     PaymentMode, OrderType, AuditAction). Add input schemas:

     export const ApplyDiscountSchema = z.discriminatedUnion("type", [
         z.object({ type: z.literal("PERCENT"), value: z.int().min(0).max(10000) }),
         z.object({ type: z.literal("FLAT"), value: z.int().min(0) }),
     ]).nullable();

     export const RecordPaymentSchema = z.object({
         mode: PaymentModeEnum,
         amount: z.int().positive(),
         reference: z.string().max(100).optional(),
         notes: z.string().max(500).optional(),
     });

     export const CancelBillSchema = z.object({
         reason: z.string().min(1).max(500),
     });

     Also add OrderType to packages/types/src/order/index.ts and extend CreateOrderSchema with an optional orderType
     (defaults DINE_IN).

     ---
     SDK — packages/api-sdk/src/services/bill.service.ts

     Replace with:

     export const BillService = {
         generateBill:  (tableSessionId) => ...,           // existing
         getAllBills:   () => ...,                          // existing
         getBillById:   (id) => ...,                        // existing
         applyDiscount: (id, body) => apiClient.patch(`/bill/${id}/discount`, body),
         clearDiscount: (id) => apiClient.patch(`/bill/${id}/discount`, null),
         recordPayment: (id, body) => apiClient.post(`/bill/${id}/payment`, body),
         cancelBill:    (id, reason) => apiClient.patch(`/bill/${id}/cancel`, { reason }),
         getAudit:      (id) => apiClient.get(`/bill/${id}/audit`).then(r => r.data?.data?.audit),
         getReceipt:    (id) => apiClient.get(`/bill/${id}/receipt`).then(r => r.data?.data?.receipt),
     };

     updateBillStatus is removed.

     ---
     Dashboard changes — apps/dashboard/

     1. Bill detail dialog — replace inline BillCard actions

     Convert the expanded section of apps/dashboard/components/bills/bill-card.tsx into a click-through that opens a
     <BillDetailDialog> (new file). The dialog shows:

     - Header: bill number (FY25-26/0001), table, time, status badge.
     - Items: existing list (read-only).
     - Charges breakdown: subtotal, discount (with inline edit button → opens small popover for type/value), CGST, SGST,
      service charge, round-off, total, paid, balance.
     - Payments tab: list of recorded payments, "+ Record Payment" button → opens form (mode dropdown, amount, ref,
     notes). Auto-marks bill PAID when paidAmount >= totalAmount (server-side).
     - Audit tab: chronological list from BillService.getAudit(id).
     - Footer actions: "Print Receipt" (opens new file <ReceiptPrintView> in a new window and triggers window.print()),
     "Cancel Bill" (with reason prompt).

     2. Receipt print view — apps/dashboard/components/bills/receipt-print-view.tsx (new)

     A standalone, print-styled component that renders the receipt DTO from GET /bill/:id/receipt. Uses inline CSS sized
      for ~80mm thermal width. Owner can also print from a regular A4 printer. Triggered by opening a small Next.js
     route at /dashboard/[id]/receipt/[billId] that renders this component then auto-fires window.print(). Calling the
     print endpoint also writes a BILL_PRINTED audit row.

     3. Settings — billing config card

     Extend apps/dashboard/components/settings/settings-view.tsx with a third card "Billing Configuration":
     - GST number (text)
     - CGST % (number, 2 decimals → store as bp)
     - SGST % (number, 2 decimals → store as bp)
     - Service charge % (number, 2 decimals → store as bp)

     Submit via ShopService.updateShop (already wired). New file
     apps/dashboard/components/settings/billing-config-form.tsx.

     4. Order type selector

     In apps/dashboard/components/orders/new-order-form.tsx add a small <Tabs> or <Select> above the table picker:
     Dine-in / Takeaway / Delivery. Table picker hidden + not required for Takeaway/Delivery. Pass orderType to
     OrderService.createOrder. The order card in apps/dashboard/components/orders/order-card.tsx shows a small badge for
      non-DINE_IN orders.

     Storefront passes nothing (defaults to DINE_IN).

     ---
     Verification (end-to-end manual test)

     1. pnpm --filter @repo/database db:migrate dev --name billing_mvp → applies cleanly.
     2. pnpm --filter api-gateway dev + pnpm --filter dashboard dev.
     3. Sign in as owner → Settings → set CGST 2.5%, SGST 2.5%, service charge 5%, GST number → Save.
     4. Place an order from storefront for table 1 (₹500 worth of items). Mark all order items COMPLETED in the
     dashboard.
     5. From OrdersView "Generate Bill" button → expect bill number FY25-26/0001, subtotal 50000 paise, CGST 1250, SGST
     1250, service charge 2500, round-off computed, total ≈ 55000.
     6. Open bill detail → Apply 10% discount → see discountAmount 5000, all downstream amounts recomputed.
     7. Record cash payment ₹200 → status flips PARTIALLY_PAID. Record UPI payment for the balance → status flips PAID,
     table session ends.
     8. Click Print Receipt → new tab renders bill, browser print dialog opens, audit entry BILL_PRINTED recorded.
     9. Place a TAKEAWAY order from dashboard new-order-form → no table required, order shows takeaway badge in
     OrdersView. Generate its bill → numbering continues FY25-26/0002.
     10. Cancel a fresh GENERATED bill with reason → status CANCELLED, table session NOT ended, audit row written.
     11. Negative tests: duplicate payment-mode entry over total → server clamps or rejects (decide); applying discount
     > subtotal → 400; cancelling a PAID bill → 400.
     12. pnpm --filter api-gateway build && pnpm --filter dashboard check-types → both clean.

     ---
     Defaults I'm baking in (tell me to flip any)

     1. Tax model: split CGST + SGST (not single GST). Both at shop level. No item-level/HSN-level taxes for MVP.
     2. Discount: bill-level only (no per-item). Either PERCENT or FLAT. No coupon codes.
     3. Service charge is on taxable amount (subtotal - discount), not on (subtotal - discount + tax). Common in India;
     simpler.
     4. Round-off to nearest whole rupee.
     5. Receipt is browser-printed HTML (no PDF library, no thermal printer ESC/POS). Works on A4 and on browser-driven
     thermal printers.
     6. Payment overpayment: server rejects payments that would push paidAmount > totalAmount with 400. No refund flow
     in MVP.
     7. Bill cancellation is allowed in GENERATED and PARTIALLY_PAID (refund the recorded payments outside the system);
     blocked for PAID.
     8. Audit log is internal-only (no UI for shop-wide audit feed yet — only per-bill in the detail dialog).
     9. Numbering starts at 1 each new financial year per shop. Does NOT continue across shops.