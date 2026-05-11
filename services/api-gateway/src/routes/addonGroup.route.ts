import { Router } from "express";
import { catchAsync } from "../utils/catchAsync";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorizedRoles } from "../middleware/roles";
import {
    listAddonGroups,
    createAddonGroup,
    updateAddonGroup,
    deleteAddonGroup,
} from "../controllers/addonGroup.controller";

const router: Router = Router();

router.get("/", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(listAddonGroups));
router.post("/", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(createAddonGroup));
router.put("/:id", authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(updateAddonGroup));
router.delete("/:id", authMiddleware, authorizedRoles("OWNER"), catchAsync(deleteAddonGroup));

export default router;
