import { Router } from "express";
import { getDashboardAnalytics } from "../controllers/analytics.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorizedRoles } from "../middleware/roles";
import { catchAsync } from "../utils/catchAsync";

const router: Router = Router();

router.get("/", authMiddleware, authorizedRoles("OWNER"), catchAsync(getDashboardAnalytics));

export default router;
