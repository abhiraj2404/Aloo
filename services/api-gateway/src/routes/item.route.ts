import {Router} from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { createItem, getItemById, updateItem, deleteItem, getItemsByCategory } from '../controllers/item.controller.js';

const router:Router=Router();

router.post('/',catchAsync(createItem));
router.get('/:id',catchAsync(getItemById));
router.put('/',catchAsync(updateItem));
router.delete('/',catchAsync(deleteItem));
router.get('/category', catchAsync(getItemsByCategory));
export default router;