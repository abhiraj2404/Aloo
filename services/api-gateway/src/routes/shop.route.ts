import{Router} from 'express';
import { createShop, getShopById, updateShop, deleteShop } from '../controllers/shop.controller';
import { catchAsync } from '../utils/catchAsync';
import { authMiddleware } from '../middleware/auth.middleware';
import { authorizedRoles } from '../middleware/roles';
const router:Router=Router();


router.post('/', authMiddleware, catchAsync(createShop));
router.get('/:id',catchAsync(getShopById)); // this is the only PUBLIC route that can be accessed by any user to see the shop page
router.put('/',authMiddleware, authorizedRoles("OWNER") ,catchAsync(updateShop));
router.delete('/',authMiddleware,authorizedRoles("OWNER"),catchAsync(deleteShop));

export default router;