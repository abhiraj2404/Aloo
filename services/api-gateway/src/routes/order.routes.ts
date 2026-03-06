import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { authorizedRoles } from "../middleware/roles";
import { createOrder, deleteOrder, getAllOrders, getOrderById, updateOrder } from "../controllers/order.controller";

const router: Router =  Router();

router.get("/:id", catchAsync(getOrderById));
router.get("/", authMiddleware, authorizedRoles("OWNER", "STAFF"),catchAsync(getAllOrders));
router.post("/", catchAsync(createOrder));
router.put("/:id", authMiddleware, authorizedRoles("OWNER", "STAFF"),catchAsync(updateOrder));
router.delete("/:id", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(deleteOrder));

export default router;