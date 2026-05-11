import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorizedRoles } from "../middleware/roles";
import { catchAsync } from "../utils/catchAsync";
import { getTablePos, previewTotals, updateSession } from "../controllers/pos.controller";

const router: Router = Router();

router.use(authMiddleware, authorizedRoles("OWNER", "STAFF"));

router.get("/table/:tableId", catchAsync(getTablePos));
router.post("/preview", catchAsync(previewTotals));
router.patch("/session/:sessionId", catchAsync(updateSession));

export default router;
