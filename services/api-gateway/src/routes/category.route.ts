import {Router} from 'express';
import { createCategory, getCategoryById, updateCategory, deleteCategory, getCategoriesByMenuId } from '../controllers/category.controller';
import { catchAsync } from '../utils/catchAsync'; 
import { authMiddleware } from '../middleware/auth.middleware';
import { authorizedRoles } from '../middleware/roles';

const router:Router=Router();  

router.get('/:id',catchAsync(getCategoryById));
router.get('/menu/:menuId',catchAsync(getCategoriesByMenuId));
router.post('/', authMiddleware, authorizedRoles("OWNER"), catchAsync(createCategory));
router.put('/', authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(updateCategory));
router.delete('/',authMiddleware, authorizedRoles("OWNER"), catchAsync(deleteCategory));

export default router;