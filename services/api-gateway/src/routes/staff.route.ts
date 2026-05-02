import { Router } from "express";
import { catchAsync } from "../utils/catchAsync";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorizedRoles } from "../middleware/roles";
import { getShopStaff, addStaff, removeStaff } from "../controllers/staff.controller";

const router: Router = Router();

router.get("/", authMiddleware, authorizedRoles("OWNER"), catchAsync(getShopStaff));
router.post("/", authMiddleware, authorizedRoles("OWNER"), catchAsync(addStaff));
router.delete("/:id", authMiddleware, authorizedRoles("OWNER"), catchAsync(removeStaff));

export default router;
