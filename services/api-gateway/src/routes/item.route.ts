import {Router} from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { createItem, getItemById, updateItem, deleteItem, getItemsByCategory } from '../controllers/item.controller.js';

const router:Router=Router();

router.post('/create',catchAsync(createItem));
router.get('/get/:id',catchAsync(getItemById));
router.put('/update',catchAsync(updateItem));
router.delete('/delete',catchAsync(deleteItem));
router.get('/get', catchAsync(getItemsByCategory));
export default router;