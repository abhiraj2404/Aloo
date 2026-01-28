import {Router} from 'express';
import { createItem, getItemById, updateItem, deleteItem } from '../controllers/item.controller.js';

const router:Router=Router();

router.post('/create',createItem);
router.get('/get/:id',getItemById);
router.put('/update/:id',updateItem);
router.delete('/delete/:id',deleteItem);

export default router;