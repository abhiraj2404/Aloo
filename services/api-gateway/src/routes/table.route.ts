import {Router} from 'express';
import { createTable, updateTable, deleteTable, getAllTables } from '../controllers/table.controller';
import { catchAsync } from '../utils/catchAsync';        
import { authMiddleware } from '../middleware/auth.middleware';
import { authorizedRoles } from '../middleware/roles';

const router:Router=Router();

router.get('/:shopId', catchAsync(getAllTables));
router.post('/', authMiddleware,authorizedRoles("OWNER"), catchAsync(createTable));
router.put('/:id', authMiddleware, authorizedRoles("OWNER", "STAFF") ,catchAsync(updateTable));
router.delete('/:id', authMiddleware, authorizedRoles("OWNER"), catchAsync(deleteTable));

export default router;

