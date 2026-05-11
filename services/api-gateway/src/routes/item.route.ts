import {Router} from 'express';
import { catchAsync } from '../utils/catchAsync';
import {
    createItem,
    getItemById,
    updateItem,
    deleteItem,
    getItemsByCategory,
    createVariant,
    updateVariant,
    deleteVariant,
    setItemAddonGroups,
} from '../controllers/item.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authorizedRoles } from '../middleware/roles';

const router:Router=Router();

router.post('/',authMiddleware, authorizedRoles("OWNER", "STAFF") ,catchAsync(createItem));
router.get('/:id',catchAsync(getItemById));
router.put('/',authMiddleware, authorizedRoles("OWNER", "STAFF") ,catchAsync(updateItem));
router.delete('/',authMiddleware, authorizedRoles("OWNER"), catchAsync(deleteItem));
router.get('/category/:id', catchAsync(getItemsByCategory));

// Variants (nested under an item)
router.post('/:itemId/variants', authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(createVariant));
router.put('/variants/:variantId', authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(updateVariant));
router.delete('/variants/:variantId', authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(deleteVariant));

// Attach a set of reusable addon groups to an item
router.put('/:itemId/addon-groups', authMiddleware, authorizedRoles("OWNER", "STAFF"), catchAsync(setItemAddonGroups));

export default router;