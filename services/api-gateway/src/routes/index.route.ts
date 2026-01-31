import userRoutes from './user.route.js';
import shopRoutes from './shop.route.js';
import categoryRoutes from './category.route.js';
import itemRoutes from './item.route.js';
import tableRoutes from './table.route.js';
import {Router} from 'express';

const router:Router=Router();

router.use('/user',userRoutes);
router.use('/shop',shopRoutes);
router.use('/category',categoryRoutes);
router.use('/item',itemRoutes);
router.use('/table',tableRoutes);

export default router;
