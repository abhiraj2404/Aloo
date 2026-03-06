import { Router } from "express";
import { getUserById, updateUser, deleteUser } from "../controllers/user.controller";
import { catchAsync } from "../utils/catchAsync";
import { authMiddleware } from "../middleware/auth.middleware";

const router: Router =Router();

router.get('/',catchAsync(getUserById));
// router.post('/',catchAsync(createUser)); // not needed , this is basically just signup
router.put('/ ', authMiddleware, catchAsync(updateUser));
router.delete('/', authMiddleware, catchAsync(deleteUser));

export default router;