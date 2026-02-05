import { Router } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { getShopMenu } from "../controllers/menu.controller.js";

const router:Router = Router();

router.get('/:shopId', catchAsync(getShopMenu));

export default router;