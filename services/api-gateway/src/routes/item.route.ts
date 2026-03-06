import {Router} from 'express';
import { catchAsync } from '../utils/catchAsync';
import { createItem, getItemById, updateItem, deleteItem, getItemsByCategory } from '../controllers/item.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authorizedRoles } from '../middleware/roles';

const router:Router=Router();

router.post('/',authMiddleware, authorizedRoles("OWNER", "STAFF") ,catchAsync(createItem));
router.get('/:id',catchAsync(getItemById));
router.put('/',authMiddleware, authorizedRoles("OWNER", "STAFF") ,catchAsync(updateItem));
router.delete('/',authMiddleware, authorizedRoles("OWNER"), catchAsync(deleteItem));
router.get('/category/:id', catchAsync(getItemsByCategory));
export default router;