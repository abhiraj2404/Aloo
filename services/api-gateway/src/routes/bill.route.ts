import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { authorizedRoles } from "../middleware/roles";
import {
    generateBill,
    getBillById,
    getAllBills,
    applyDiscountCtrl,
    recordPaymentCtrl,
    cancelBillCtrl,
    getAuditCtrl,
    getReceiptCtrl,
} from "../controllers/bill.controller";

const router: Router = Router();

router.post("/generate/:tableSessionId", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(generateBill));
router.get("/", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(getAllBills));
router.get("/:id", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(getBillById));
router.patch("/:id/discount", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(applyDiscountCtrl));
router.post("/:id/payment", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(recordPaymentCtrl));
router.patch("/:id/cancel", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(cancelBillCtrl));
router.get("/:id/audit", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(getAuditCtrl));
router.get("/:id/receipt", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(getReceiptCtrl));

export default router;
