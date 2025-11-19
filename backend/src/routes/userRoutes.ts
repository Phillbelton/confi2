import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLog } from '../middleware/auditMiddleware';
import * as userSchemas from '../schemas/userSchemas';

const router = Router();

// All routes protected (admin only)
router.use(authenticate);
router.use(authorize('admin'));

// User management
router.get('/', validate(userSchemas.getUsersQuerySchema), userController.getUsers);
router.get('/funcionarios', userController.getFuncionarios);
router.get('/:id', validate(userSchemas.getUserByIdSchema), userController.getUserById);
router.post('/', validate(userSchemas.createUserSchema), auditLog('user', 'create'), userController.createUser);
router.put('/:id', validate(userSchemas.updateUserSchema), auditLog('user', 'update'), userController.updateUser);
router.put('/:id/password', validate(userSchemas.changeUserPasswordSchema), auditLog('user', 'update'), userController.changeUserPassword);
router.put('/:id/activate', validate(userSchemas.toggleUserActiveSchema), auditLog('user', 'update'), userController.activateUser);
router.delete('/:id', validate(userSchemas.toggleUserActiveSchema), auditLog('user', 'block'), userController.deactivateUser);

export default router;
