import {Router} from 'express';
import authRouter from './auth.routes.js'
import userRouter from './user.route.js';
import shopRouter from './shop.route.js';
import categoryRouter from './category.route.js';
import itemRouter from './item.route.js';
import tableRouter from './table.route.js';
import menuRouter from './menu.routes.js';
import adminRouter from './admin.routes.js'

const router:Router=Router();

// TODO : setup ZOD validation for all controllers 

router.use('/auth',authRouter);
router.use('/user',userRouter);
router.use('/shop',shopRouter);
router.use('/menu', menuRouter);
router.use('/category',categoryRouter);
router.use('/item',itemRouter);
router.use('/table',tableRouter);
router.use('/admin',adminRouter);

export default router;
