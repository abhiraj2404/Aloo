import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { authorizedRoles } from "../middleware/roles";
import { generateBill, getBillById, getAllBills, updateBillStatus } from "../controllers/bill.controller";

const router: Router = Router();

router.post("/generate/:tableSessionId", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(generateBill));
router.get("/", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(getAllBills));
router.get("/:id", catchAsync(getBillById));
router.patch("/:id/status", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(updateBillStatus));

export default router;
