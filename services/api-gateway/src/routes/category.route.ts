import {Router} from 'express';
import { createCategory, getCategoryById, updateCategory, deleteCategory, getCategoriesByMenuId } from '../controllers/category.controller.js';
import { catchAsync } from '../utils/catchAsync.js'; 

const router:Router=Router();  

router.post('/',catchAsync(createCategory));
router.get('/:id',catchAsync(getCategoryById));
router.put('/',catchAsync(updateCategory));
router.delete('/',catchAsync(deleteCategory));
router.get('/menu/:menuId',catchAsync(getCategoriesByMenuId));

export default router;