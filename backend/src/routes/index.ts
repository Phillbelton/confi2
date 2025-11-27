import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import tagRoutes from './tagRoutes';
import brandRoutes from './brandRoutes';
import orderRoutes from './orderRoutes';
import stockRoutes from './stockRoutes';
import userRoutes from './userRoutes';
import addressRoutes from './addressRoutes';
import auditRoutes from './auditRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

/**
 * API Routes - Sistema ProductParent + ProductVariant
 *
 * Estructura:
 * - /api/auth - Authentication (register, login, profile)
 * - /api/products - ProductParent + ProductVariant
 * - /api/categories - Categories con subcategorías (2 niveles)
 * - /api/tags - Tags predefinidos
 * - /api/brands - Brands
 * - /api/orders - Orders con integración WhatsApp + Stock + Discounts
 * - /api/stock-movements - Stock audit trail
 * - /api/users - User management (admin only)
 * - /api/users/me/addresses - Address management (authenticated users)
 * - /api/audit-logs - Audit trail (admin only)
 * - /api/admin/dashboard - Admin dashboard statistics and analytics
 */

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/brands', brandRoutes);
router.use('/orders', orderRoutes);
router.use('/stock-movements', stockRoutes);
// IMPORTANT: More specific routes must come BEFORE general routes
// Otherwise /users middleware (admin-only) will intercept /users/me/addresses
router.use('/users/me/addresses', addressRoutes);
router.use('/users', userRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/admin/dashboard', dashboardRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
