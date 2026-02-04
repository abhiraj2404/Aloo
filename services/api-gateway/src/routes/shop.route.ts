import{Router} from 'express';
import { createShop, getShopById, updateShop, deleteShop, getAllShops } from '../controllers/shop.controller.js';
import { catchAsync } from '../utils/catchAsync.js';
const router:Router=Router();


router.post('/',catchAsync(createShop));
router.get('/:id',catchAsync(getShopById)); // only by owner of that shop
router.put('/:id',catchAsync(updateShop));
router.delete('/:id',catchAsync(deleteShop));


export default router;