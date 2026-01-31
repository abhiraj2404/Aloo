import {Router} from 'express';
import { createCategory, getCategoryById, updateCategory, deleteCategory, getCategoriesByMenuId } from '../controllers/category.controller.js';
import { catchAsync } from '../utils/catchAsync.js'; 

const router:Router=Router();  

router.post('/create',catchAsync(createCategory));
router.get('/get/:id',catchAsync(getCategoryById));
router.put('/update',catchAsync(updateCategory));
router.delete('/delete',catchAsync(deleteCategory));
router.get('/:menuId',catchAsync(getCategoriesByMenuId));

export default router;