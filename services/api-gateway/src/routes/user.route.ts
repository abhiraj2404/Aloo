import { Router } from "express";
import { createUser, getUserById, updateUser, deleteUser } from "../controllers/user.controller.js";
import { catchAsync } from "../utils/catchAsync.js";

const router: Router =Router();



router.post('/create',catchAsync(createUser));
router.get('/get/:id',catchAsync(getUserById));
router.put('/update/:id',catchAsync(updateUser));
router.delete('/delete/:id',catchAsync(deleteUser));

export default router;