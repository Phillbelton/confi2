import { Request, Response } from 'express';
import { Order } from '../models/Order';
import ProductVariant from '../models/ProductVariant';
import ProductParent from '../models/ProductParent';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/asyncHandler';

interface SalesDataItem {
  date: string;
  sales: number;
  orders: number;
}

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard/stats
 * @access  Private/Admin
 */
export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    // Date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    monthAgo.setHours(0, 0, 0, 0);

    // Parallel queries for better performance
    const [
      todayOrders,
      todaySales,
      weekSales,
      monthSales,
      pendingOrders,
      lowStockVariants,
      totalProducts,
      totalCustomers,
    ] = await Promise.all([
      // Today's orders count
      Order.countDocuments({
        createdAt: { $gte: today },
        status: { $ne: 'cancelled' },
      }),

      // Today's sales total
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' },
          },
        },
      ]),

      // Week's sales total
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: weekAgo },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' },
          },
        },
      ]),

      // Month's sales total
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: monthAgo },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' },
          },
        },
      ]),

      // Pending orders (pending_whatsapp or confirmed)
      Order.countDocuments({
        status: { $in: ['pending_whatsapp', 'confirmed'] },
      }),

      // Low stock variants
      ProductVariant.countDocuments({
        active: true,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      }),

      // Total active products
      ProductParent.countDocuments({ active: true }),

      // Total customers (role: cliente)
      User.countDocuments({ role: 'cliente', active: true }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        todaySales: todaySales[0]?.total || 0,
        todayOrders,
        weekSales: weekSales[0]?.total || 0,
        monthSales: monthSales[0]?.total || 0,
        pendingOrders,
        lowStockProducts: lowStockVariants,
        totalProducts,
        totalCustomers,
      },
    });
  }
);

/**
 * @desc    Get sales data for chart (last 30 days)
 * @route   GET /api/admin/dashboard/sales-chart
 * @access  Private/Admin
 */
export const getSalesChart = asyncHandler(
  async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Aggregate sales by day
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          sales: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          sales: 1,
          orders: 1,
        },
      },
    ]);

    // Fill in missing days with zero values
    const result: SalesDataItem[] = [];
    const currentDate = new Date(startDate);
    const salesMap = new Map<string, SalesDataItem>(
      salesData.map((item: any) => [item.date, item])
    );

    for (let i = 0; i < days; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const data = salesMap.get(dateStr);

      result.push({
        date: dateStr,
        sales: data?.sales || 0,
        orders: data?.orders || 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  }
);

/**
 * @desc    Get top selling products
 * @route   GET /api/admin/dashboard/top-products
 * @access  Private/Admin
 */
export const getTopProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    // Aggregate top selling products
    const topProducts = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
        },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: '$items.variantSnapshot.name',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
          image: { $first: '$items.variantSnapshot.image' },
        },
      },
      {
        $sort: { revenue: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          totalSold: 1,
          revenue: 1,
          image: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: topProducts,
    });
  }
);

/**
 * @desc    Get recent orders
 * @route   GET /api/admin/dashboard/recent-orders
 * @access  Private/Admin
 */
export const getRecentOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('orderNumber customer total status createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: recentOrders,
    });
  }
);
