import { Router } from "express";
import { catchAsync } from "../utils/catchAsync";
import { getAllShops, getAllUsers } from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router:Router=Router(); 

router.get("/shop", authMiddleware, catchAsync(getAllShops));
router.get("/user", authMiddleware, catchAsync(getAllUsers))

export default router;
