import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { authorizedRoles } from "../middleware/roles";
import { createOrder, deleteOrder, getAllOrders, getOrderById, moveOrder, streamOrders, updateOrderItems, updateOrderStatus } from "../controllers/order.controller";

const router: Router = Router();

router.post("/", catchAsync(createOrder));
router.get("/", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(getAllOrders));
router.get("/stream", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(streamOrders));
router.get("/:id", catchAsync(getOrderById));
router.put("/:id/items", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(updateOrderItems));
router.patch("/:id/status", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(updateOrderStatus));
router.patch("/:id/move", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(moveOrder));
router.delete("/:id", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(deleteOrder));

export default router;