import { Response } from 'express';
import AuditLog, { AuditAction, AuditEntity } from '../models/AuditLog';
import { AuthRequest, ApiResponse, PaginatedResponse } from '../types';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

/**
 * @desc    Obtener logs de auditoría con filtros y paginación
 * @route   GET /api/audit-logs
 * @access  Admin
 */
export const getAuditLogs = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<any>>>) => {
    const {
      page = '1',
      limit = '50',
      action,
      entityType,
      entityId,
      userId,
      startDate,
      endDate,
      ip,
    } = req.query as any;

    // Construir filtros
    const filter: any = {};

    if (action) {
      filter.action = action;
    }

    if (entityType) {
      filter.entity = entityType;
    }

    if (entityId) {
      filter.entityId = new mongoose.Types.ObjectId(entityId);
    }

    if (userId) {
      filter.user = new mongoose.Types.ObjectId(userId);
    }

    if (ip) {
      filter.ip = ip;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Paginación
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Query
    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Total
    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
    });
  }
);

/**
 * @desc    Obtener historial de auditoría de una entidad específica
 * @route   GET /api/audit-logs/entity/:entityType/:entityId
 * @access  Admin
 */
export const getEntityHistory = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { entityType, entityId } = req.params;
    const { limit = '50', page = '1' } = req.query as any;

    // Validar entityType
    const validEntities: AuditEntity[] = ['product', 'variant', 'order', 'user', 'category', 'brand', 'tag'];
    if (!validEntities.includes(entityType as AuditEntity)) {
      throw new AppError(400, 'Tipo de entidad inválido');
    }

    const logs = await AuditLog.getEntityHistory(
      entityType as AuditEntity,
      new mongoose.Types.ObjectId(entityId),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        entity: entityType,
        entityId,
        history: logs,
      },
    });
  }
);

/**
 * @desc    Obtener actividad de un usuario específico
 * @route   GET /api/audit-logs/user/:userId
 * @access  Admin
 */
export const getUserActivity = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { userId } = req.params;
    const { limit = '100', page = '1', action, startDate, endDate } = req.query as any;

    // Verify user exists
    const { User } = await import('../models/User');
    const userExists = await User.findById(userId);
    if (!userExists) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const filter: any = { user: new mongoose.Types.ObjectId(userId) };

    if (action) {
      filter.action = action;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        userId,
        activity: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
    });
  }
);

/**
 * @desc    Obtener logs recientes (dashboard admin)
 * @route   GET /api/audit-logs/recent
 * @access  Admin
 */
export const getRecentLogs = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { limit = '50', action } = req.query as any;

    const filters: any = {};
    if (action) filters.action = action as AuditAction;

    const logs = await AuditLog.getRecentLogs(parseInt(limit), filters);

    res.status(200).json({
      success: true,
      data: {
        logs,
      },
    });
  }
);

/**
 * @desc    Obtener estadísticas de auditoría
 * @route   GET /api/audit-logs/stats
 * @access  Admin
 */
export const getAuditStats = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { startDate, endDate, groupBy = 'action' } = req.query as any;

    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Estadísticas por acción
    const actionStats = await AuditLog.aggregate([
      { $match: filter },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Estadísticas por entidad
    const entityStats = await AuditLog.aggregate([
      { $match: filter },
      { $group: { _id: '$entity', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Usuarios más activos
    const topUsers = await AuditLog.aggregate([
      { $match: filter },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$_id',
          count: 1,
          name: '$userInfo.name',
          email: '$userInfo.email',
          role: '$userInfo.role',
        },
      },
    ]);

    // Total de logs
    const totalLogs = await AuditLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        totalLogs,
        actionStats,
        entityStats,
        topUsers,
      },
    });
  }
);
