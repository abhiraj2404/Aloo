import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorizedRoles } from "../middleware/roles";
import { catchAsync } from "../utils/catchAsync";
import { searchCustomers, upsertCustomer } from "../controllers/customer.controller";

const router: Router = Router();

router.use(authMiddleware, authorizedRoles("OWNER", "STAFF"));

router.get("/search", catchAsync(searchCustomers));
router.post("/upsert", catchAsync(upsertCustomer));

export default router;
