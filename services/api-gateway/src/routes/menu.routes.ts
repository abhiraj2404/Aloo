import { Router } from "express";
import { catchAsync } from "../utils/catchAsync";
import { getShopMenu } from "../controllers/menu.controller";

const router:Router = Router();

router.get('/:shopId', catchAsync(getShopMenu));

export default router;