import { Router } from "express";
import { createUser, getUserById, updateUser, deleteUser } from "../controllers/user.controller.js";
import { catchAsync } from "../utils/catchAsync.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router: Router =Router();

router.get('/:id',catchAsync(getUserById));
router.post('/',catchAsync(createUser));
router.put('/:id', authMiddleware, catchAsync(updateUser));
router.delete('/:id', authMiddleware, catchAsync(deleteUser));

export default router;