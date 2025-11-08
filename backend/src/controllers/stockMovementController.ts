import { Response } from 'express';
import StockMovement, { IStockMovement } from '../models/StockMovement';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { adjustStock, restockVariant } from '../services/stockService';

/**
 * Controller para StockMovement (Auditoría de Stock)
 */

// @desc    Obtener historial de movimientos de una variante
// @route   GET /api/stock-movements/variant/:variantId
// @access  Private (admin, funcionario)
export const getVariantMovements = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { variantId } = req.params;
    const { limit = '50' } = req.query as any;

    const movements = await StockMovement.getVariantHistory(
      variantId as any,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: { movements },
    });
  }
);

// @desc    Obtener movimientos de una orden
// @route   GET /api/stock-movements/order/:orderId
// @access  Private (admin, funcionario)
export const getOrderMovements = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { orderId } = req.params;

    const movements = await StockMovement.getOrderMovements(orderId as any);

    res.status(200).json({
      success: true,
      data: { movements },
    });
  }
);

// @desc    Obtener todos los movimientos con filtros
// @route   GET /api/stock-movements
// @access  Private (admin, funcionario)
export const getMovements = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { type, limit = '100', page = '1' } = req.query as any;

    const query: any = {};
    if (type) {
      query.type = type;
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    const movements = await StockMovement.find(query)
      .populate('variant', 'sku name price')
      .populate('order', 'orderNumber status')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await StockMovement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        movements,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  }
);

// @desc    Ajustar stock manualmente (para admin/funcionario)
// @route   POST /api/stock-movements/adjust
// @access  Private (admin, funcionario)
export const adjustStockManually = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { variant, quantity, reason, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Usuario no autenticado');
    }

    const movement = await adjustStock(variant, quantity, reason, userId, notes);

    res.status(200).json({
      success: true,
      message: 'Stock ajustado exitosamente',
      data: { movement },
    });
  }
);

// @desc    Reabastecer stock (para admin/funcionario)
// @route   POST /api/stock-movements/restock
// @access  Private (admin, funcionario)
export const restockProduct = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { variant, quantity, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Usuario no autenticado');
    }

    const movement = await restockVariant(variant, quantity, userId, notes);

    res.status(200).json({
      success: true,
      message: 'Stock reabastecido exitosamente',
      data: { movement },
    });
  }
);
