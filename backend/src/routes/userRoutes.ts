import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLog, captureBeforeState } from '../middleware/auditMiddleware';
import User from '../models/User';
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
router.put('/:id', captureBeforeState(User), validate(userSchemas.updateUserSchema), auditLog('user', 'update'), userController.updateUser);
router.put('/:id/password', captureBeforeState(User), validate(userSchemas.changeUserPasswordSchema), auditLog('user', 'update'), userController.changeUserPassword);
router.put('/:id/activate', captureBeforeState(User), validate(userSchemas.toggleUserActiveSchema), auditLog('user', 'update'), userController.activateUser);
router.delete('/:id', captureBeforeState(User), validate(userSchemas.toggleUserActiveSchema), auditLog('user', 'block'), userController.deactivateUser);

export default router;
