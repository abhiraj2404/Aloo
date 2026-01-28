import{Router} from 'express';
import { createShop, getShopById, updateShop, deleteShop } from '../controllers/shop.controller.js';
import { catchAsync } from '../utils/catchAsync.js';
const router:Router=Router();


router.post('/create',catchAsync(createShop));
router.get('/get/:id',catchAsync(getShopById));
router.put('/update/:id',catchAsync(updateShop));
router.delete('/delete/:id',catchAsync(deleteShop));


export default router;