import { Response } from 'express';
import StockMovement, { IStockMovement } from '../models/StockMovement';
import ProductVariant from '../models/ProductVariant';
import { Order } from '../models/Order';
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

    // Verificar que la variante existe
    const variant = await ProductVariant.findById(variantId);

    if (!variant) {
      throw new AppError(404, 'Variante no encontrada');
    }

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

    // Verificar que la orden existe
    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError(404, 'Orden no encontrada');
    }

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
        data: movements,
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

// @desc    Crear movimiento de stock (endpoint unificado)
// @route   POST /api/stock-movements
// @access  Private (admin, funcionario)
export const createStockMovement = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { variantId, type, quantity, reason, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Usuario no autenticado');
    }

    if (!variantId) {
      throw new AppError(400, 'El ID de la variante es requerido');
    }

    if (!type) {
      throw new AppError(400, 'El tipo de movimiento es requerido');
    }

    if (quantity === undefined || quantity === null) {
      throw new AppError(400, 'La cantidad es requerida');
    }

    let movement: IStockMovement;

    try {
      switch (type) {
        case 'restock':
          movement = await restockVariant(variantId, quantity, userId, reason, notes);
          break;
        case 'adjustment':
          if (!reason) {
            throw new AppError(400, 'El motivo (reason) es requerido para ajustes');
          }
          movement = await adjustStock(variantId, quantity, reason, userId, notes);
          break;
        case 'return':
          if (!reason) {
            throw new AppError(400, 'El motivo (reason) es requerido para devoluciones');
          }
          // Para returns, llamamos directamente a StockMovement.createMovement
          const variant = await ProductVariant.findById(variantId);
          if (!variant) {
            throw new AppError(404, 'Variante no encontrada');
          }
          movement = await StockMovement.createMovement(
            variantId as any,
            'return',
            quantity,
            reason,
            { userId: userId as any, notes }
          );
          break;
        default:
          throw new AppError(400, `Tipo de movimiento inválido: ${type}`);
      }
    } catch (error: any) {
      // Convertir errores del servicio en AppError con códigos apropiados
      if (error.message?.includes('no encontrada')) {
        throw new AppError(404, error.message);
      }
      if (error.message?.includes('insuficiente') || error.message?.includes('stock')) {
        throw new AppError(400, error.message);
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Movimiento de stock creado exitosamente',
      data: { movement },
    });
  }
);
