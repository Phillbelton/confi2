import mongoose from 'mongoose';
import ProductVariant from '../models/ProductVariant';
import StockMovement, { IStockMovement, StockMovementType } from '../models/StockMovement';

/**
 * Service para gestión de stock y movimientos
 */

interface StockDeductionOptions {
  orderId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  notes?: string;
}

interface StockValidationResult {
  available: boolean;
  currentStock: number;
  requested: number;
  allowBackorder: boolean;
  message?: string;
}

/**
 * Deduce stock de una variante y crea registro de movimiento
 * @param variantId ID de la variante
 * @param quantity Cantidad a deducir (debe ser positivo)
 * @param orderId ID de la orden relacionada
 * @param options Opciones adicionales (userId, notes)
 * @returns Movimiento de stock creado
 */
export async function deductStock(
  variantId: mongoose.Types.ObjectId | string,
  quantity: number,
  orderId: mongoose.Types.ObjectId | string,
  options?: Omit<StockDeductionOptions, 'orderId'>
): Promise<IStockMovement> {
  try {
    if (quantity <= 0) {
      throw new Error('La cantidad a deducir debe ser mayor a 0');
    }

    // Validar disponibilidad antes de deducir
    const validation = await checkStockAvailability(variantId, quantity);

    // Si no hay stock suficiente y no se permite backorder, lanzar error
    if (!validation.available && !validation.allowBackorder) {
      throw new Error(
        `Stock insuficiente. Disponible: ${validation.currentStock}, Solicitado: ${validation.requested}`
      );
    }

    // Crear movimiento de stock (cantidad negativa para deducción)
    const movement = await StockMovement.createMovement(
      variantId as mongoose.Types.ObjectId,
      'sale',
      -quantity, // Negativo para deducción
      `Venta - Orden ${orderId}`,
      {
        orderId: orderId as mongoose.Types.ObjectId,
        userId: options?.userId,
        notes: options?.notes,
      }
    );

    return movement;
  } catch (error) {
    console.error('Error en deductStock:', error);
    throw error;
  }
}

/**
 * Restaura stock de una variante (cancelación, devolución)
 * @param variantId ID de la variante
 * @param quantity Cantidad a restaurar (debe ser positivo)
 * @param orderId ID de la orden relacionada
 * @param type Tipo de restauración ('cancellation' | 'return')
 * @param options Opciones adicionales (userId, notes)
 * @returns Movimiento de stock creado
 */
export async function restoreStock(
  variantId: mongoose.Types.ObjectId | string,
  quantity: number,
  orderId: mongoose.Types.ObjectId | string,
  type: 'cancellation' | 'return' = 'cancellation',
  options?: Omit<StockDeductionOptions, 'orderId'>
): Promise<IStockMovement> {
  try {
    if (quantity <= 0) {
      throw new Error('La cantidad a restaurar debe ser mayor a 0');
    }

    // Crear movimiento de stock (cantidad positiva para restauración)
    const reason =
      type === 'cancellation'
        ? `Cancelación - Orden ${orderId}`
        : `Devolución - Orden ${orderId}`;

    const movement = await StockMovement.createMovement(
      variantId as mongoose.Types.ObjectId,
      type,
      quantity, // Positivo para restauración
      reason,
      {
        orderId: orderId as mongoose.Types.ObjectId,
        userId: options?.userId,
        notes: options?.notes,
      }
    );

    return movement;
  } catch (error) {
    console.error('Error en restoreStock:', error);
    throw error;
  }
}

/**
 * Verifica disponibilidad de stock para una variante
 * @param variantId ID de la variante
 * @param quantity Cantidad solicitada
 * @returns Resultado de la validación
 */
export async function checkStockAvailability(
  variantId: mongoose.Types.ObjectId | string,
  quantity: number
): Promise<StockValidationResult> {
  try {
    const variant = await ProductVariant.findById(variantId);

    if (!variant) {
      throw new Error('Variante no encontrada');
    }

    // Si no se trackea el stock, siempre está disponible
    if (!variant.trackStock) {
      return {
        available: true,
        currentStock: variant.stock,
        requested: quantity,
        allowBackorder: variant.allowBackorder,
        message: 'Stock no trackeado - siempre disponible',
      };
    }

    // Si se permite backorder, siempre está disponible
    if (variant.allowBackorder) {
      return {
        available: true,
        currentStock: variant.stock,
        requested: quantity,
        allowBackorder: true,
        message: variant.stock < quantity ? 'Permitido por backorder' : 'Stock suficiente',
      };
    }

    // Verificar si hay stock suficiente
    const available = variant.stock >= quantity;

    return {
      available,
      currentStock: variant.stock,
      requested: quantity,
      allowBackorder: false,
      message: available ? 'Stock suficiente' : 'Stock insuficiente',
    };
  } catch (error) {
    console.error('Error en checkStockAvailability:', error);
    throw error;
  }
}

/**
 * Obtiene variantes con stock bajo (por debajo del umbral)
 * @param limit Límite de resultados (default: 50)
 * @returns Array de variantes con stock bajo
 */
export async function getLowStockVariants(limit: number = 50) {
  try {
    const lowStockVariants = await ProductVariant.aggregate([
      {
        $match: {
          active: true,
          trackStock: true,
          $expr: {
            $and: [
              { $gt: ['$stock', 0] }, // Stock mayor a 0
              { $lte: ['$stock', '$lowStockThreshold'] }, // Menor o igual al umbral
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'productparents',
          localField: 'parentProduct',
          foreignField: '_id',
          as: 'parent',
        },
      },
      {
        $unwind: '$parent',
      },
      {
        $project: {
          _id: 1,
          sku: 1,
          name: 1,
          stock: 1,
          lowStockThreshold: 1,
          price: 1,
          'parent.name': 1,
          'parent.slug': 1,
        },
      },
      {
        $sort: { stock: 1 }, // Ordenar por stock ascendente
      },
      {
        $limit: limit,
      },
    ]);

    return lowStockVariants;
  } catch (error) {
    console.error('Error en getLowStockVariants:', error);
    throw error;
  }
}

/**
 * Obtiene variantes sin stock (stock = 0)
 * @param limit Límite de resultados (default: 50)
 * @returns Array de variantes sin stock
 */
export async function getOutOfStockVariants(limit: number = 50) {
  try {
    const outOfStockVariants = await ProductVariant.aggregate([
      {
        $match: {
          active: true,
          trackStock: true,
          stock: { $lte: 0 },
          allowBackorder: false, // Solo mostrar si NO se permite backorder
        },
      },
      {
        $lookup: {
          from: 'productparents',
          localField: 'parentProduct',
          foreignField: '_id',
          as: 'parent',
        },
      },
      {
        $unwind: '$parent',
      },
      {
        $project: {
          _id: 1,
          sku: 1,
          name: 1,
          stock: 1,
          price: 1,
          'parent.name': 1,
          'parent.slug': 1,
        },
      },
      {
        $sort: { 'parent.name': 1 },
      },
      {
        $limit: limit,
      },
    ]);

    return outOfStockVariants;
  } catch (error) {
    console.error('Error en getOutOfStockVariants:', error);
    throw error;
  }
}

/**
 * Ajuste manual de stock (para admin/funcionario)
 * @param variantId ID de la variante
 * @param newStock Nuevo stock
 * @param reason Razón del ajuste
 * @param userId ID del usuario que realiza el ajuste
 * @param notes Notas adicionales
 * @returns Movimiento de stock creado
 */
export async function adjustStock(
  variantId: mongoose.Types.ObjectId | string,
  newStock: number,
  reason: string,
  userId: mongoose.Types.ObjectId | string,
  notes?: string
): Promise<IStockMovement> {
  try {
    if (newStock < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    if (!reason || reason.trim() === '') {
      throw new Error('Debe proporcionar una razón para el ajuste de stock');
    }

    // Obtener la variante actual
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      throw new Error('Variante no encontrada');
    }

    const currentStock = variant.stock;
    const difference = newStock - currentStock;

    if (difference === 0) {
      throw new Error('El nuevo stock es igual al stock actual');
    }

    // Crear movimiento de stock
    const movement = await StockMovement.createMovement(
      variantId as mongoose.Types.ObjectId,
      'adjustment',
      difference, // Positivo o negativo según corresponda
      `Ajuste manual: ${reason}`,
      {
        userId: userId as mongoose.Types.ObjectId,
        notes,
      }
    );

    return movement;
  } catch (error) {
    console.error('Error en adjustStock:', error);
    throw error;
  }
}

/**
 * Restock de variante (para admin/funcionario)
 * @param variantId ID de la variante
 * @param quantity Cantidad a agregar (debe ser positivo)
 * @param userId ID del usuario que realiza el restock
 * @param notes Notas adicionales
 * @returns Movimiento de stock creado
 */
export async function restockVariant(
  variantId: mongoose.Types.ObjectId | string,
  quantity: number,
  userId: mongoose.Types.ObjectId | string,
  notes?: string
): Promise<IStockMovement> {
  try {
    if (quantity <= 0) {
      throw new Error('La cantidad a agregar debe ser mayor a 0');
    }

    // Crear movimiento de stock
    const movement = await StockMovement.createMovement(
      variantId as mongoose.Types.ObjectId,
      'restock',
      quantity, // Positivo para restock
      'Reposición de stock',
      {
        userId: userId as mongoose.Types.ObjectId,
        notes,
      }
    );

    return movement;
  } catch (error) {
    console.error('Error en restockVariant:', error);
    throw error;
  }
}

/**
 * Obtiene el historial de movimientos de una variante
 * @param variantId ID de la variante
 * @param limit Límite de resultados (default: 50)
 * @returns Array de movimientos de stock
 */
export async function getVariantStockHistory(
  variantId: mongoose.Types.ObjectId | string,
  limit: number = 50
) {
  try {
    return await StockMovement.getVariantHistory(
      variantId as mongoose.Types.ObjectId,
      limit
    );
  } catch (error) {
    console.error('Error en getVariantStockHistory:', error);
    throw error;
  }
}
