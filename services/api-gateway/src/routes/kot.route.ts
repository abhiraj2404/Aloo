import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorizedRoles } from "../middleware/roles";
import { catchAsync } from "../utils/catchAsync";
import { getActiveKots, getKotById, printKot, streamKots } from "../controllers/kot.controller";

const router: Router = Router();

router.use(authMiddleware, authorizedRoles("OWNER", "STAFF"));

router.get("/", catchAsync(getActiveKots));
router.get("/stream", catchAsync(streamKots));
router.get("/:id", catchAsync(getKotById));
router.post("/:id/print", catchAsync(printKot));

export default router;
