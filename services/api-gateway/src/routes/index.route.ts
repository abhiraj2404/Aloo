import {Router} from 'express';
import authRouter from './auth.routes'
import userRouter from './user.route';
import shopRouter from './shop.route';
import categoryRouter from './category.route';
import itemRouter from './item.route';
import tableRouter from './table.route';
import menuRouter from './menu.routes';
import adminRouter from './admin.routes'
import orderRouter from './order.routes'
import { authMiddleware } from '../middleware/auth.middleware';

const router:Router=Router();

// TODO : setup ZOD validation for all controllers 

router.use('/auth',authRouter);
router.use('/user',userRouter);
router.use('/shop',shopRouter);
router.use('/menu', menuRouter);
router.use('/order', orderRouter);
router.use('/category',categoryRouter);
router.use('/item',itemRouter);
router.use('/table',tableRouter);
router.use('/admin', authMiddleware , adminRouter);

export default router;
