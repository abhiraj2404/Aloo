import { Router } from "express";
import { login, logout, me, signup } from "../controllers/auth.controller";
import { catchAsync } from "../utils/catchAsync";
import { authMiddleware } from "../middleware/auth.middleware";

const router: Router = Router();

router.post("/signup", catchAsync(signup));
router.post("/login", catchAsync(login));
router.get('/logout',catchAsync(logout));
router.get('/me',authMiddleware,catchAsync(me));

export default router;
