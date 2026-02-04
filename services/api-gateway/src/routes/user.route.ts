import { Router } from "express";
import { createUser, getUserById, updateUser, deleteUser } from "../controllers/user.controller.js";
import { catchAsync } from "../utils/catchAsync.js";

const router: Router =Router();



router.get('/:id',catchAsync(getUserById));
router.post('/',catchAsync(createUser));
router.put('/:id',catchAsync(updateUser));
router.delete('/:id',catchAsync(deleteUser));

export default router;