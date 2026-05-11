import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorizedRoles } from "../middleware/roles";
import { catchAsync } from "../utils/catchAsync";
import { updateOrderItemStatus } from "../controllers/orderItem.controller";

const router: Router = Router();

router.use(authMiddleware, authorizedRoles("OWNER", "STAFF"));

router.patch("/:id/status", catchAsync(updateOrderItemStatus));

export default router;
