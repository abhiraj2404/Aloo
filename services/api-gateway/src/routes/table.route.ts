import {Router} from 'express';
import { createTable, updateTable, deleteTable, getAllTables } from '../controllers/table.controller.js';
import { catchAsync } from '../utils/catchAsync.js';        

const router:Router=Router();

router.post('/create',catchAsync(createTable));
router.get('/get/:shopId', catchAsync(getAllTables));
router.put('/update/:id',catchAsync(updateTable));
router.delete('/delete/:id',catchAsync(deleteTable));


export default router;

