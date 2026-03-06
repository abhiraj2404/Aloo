import { Router } from "express";
import { login, signup } from "../controllers/auth.controller";
import { catchAsync } from "../utils/catchAsync";

const router: Router = Router();

router.post("/signup", catchAsync(signup));
router.post("/login", catchAsync(login));

export default router;
