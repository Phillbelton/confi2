import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * Dashboard Routes
 * All routes require admin or funcionario authentication
 */

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics (sales, orders, products, customers)
// @access  Private/Admin/Funcionario
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  dashboardController.getDashboardStats
);

// @route   GET /api/admin/dashboard/sales-chart
// @desc    Get sales data for chart (last N days)
// @access  Private/Admin/Funcionario
router.get(
  '/sales-chart',
  authenticate,
  authorize('admin'),
  dashboardController.getSalesChart
);

// @route   GET /api/admin/dashboard/top-products
// @desc    Get top selling products
// @access  Private/Admin/Funcionario
router.get(
  '/top-products',
  authenticate,
  authorize('admin'),
  dashboardController.getTopProducts
);

// @route   GET /api/admin/dashboard/recent-orders
// @desc    Get recent orders
// @access  Private/Admin/Funcionario
router.get(
  '/recent-orders',
  authenticate,
  authorize('admin'),
  dashboardController.getRecentOrders
);

export default router;
