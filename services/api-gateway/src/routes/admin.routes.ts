import { Router } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { getAllShops, getAllUsers } from "../controllers/admin.controller.js";

const router:Router=Router(); 

router.get("/shop", catchAsync(getAllShops));
router.get("/user", catchAsync(getAllUsers))

export default router;
