import {Router} from 'express';
import { createTable, updateTable, deleteTable, getAllTables } from '../controllers/table.controller.js';
import { catchAsync } from '../utils/catchAsync.js';        

const router:Router=Router();

router.post('/',catchAsync(createTable));
router.get('/:shopId', catchAsync(getAllTables));
router.put('/:id',catchAsync(updateTable));
router.delete('/:id',catchAsync(deleteTable));

export default router;

