import userRoutes from './user.route.js';
import shopRoutes from './shop.route.js';
import categoryRoutes from './category.route.js';
import itemRoutes from './item.route.js';
import tableRoutes from './table.route.js';
import adminRoutes from './admin.routes.js'
import {Router} from 'express';

const router:Router=Router();

// TODO : setup ZOD validation for all controllers 

router.use('/user',userRoutes);
router.use('/shop',shopRoutes);
router.use('/category',categoryRoutes);
router.use('/item',itemRoutes);
router.use('/table',tableRoutes);
router.use('/admin',adminRoutes);

export default router;
