import {Router} from 'express';
import { createCategory, getCategoryById, updateCategory, deleteCategory } from '../controllers/category.controller.js';
import { catchAsync } from '../utils/catchAsync.js'; 

const router:Router=Router();  

router.post('/create',catchAsync(createCategory));
router.get('/get/:id',catchAsync(getCategoryById));
router.put('/update/:id',catchAsync(updateCategory));
router.delete('/delete/:id',catchAsync(deleteCategory));

export default router;