import { Response } from 'express';
import { Tag, ITag } from '../models/Tag';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

/**
 * Controller para Tag
 */

// @desc    Obtener todos los tags activos
// @route   GET /api/tags
// @access  Public
export const getTags = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { includeInactive } = req.query;

    const query = includeInactive === 'true' ? {} : { active: true };

    const tags = await Tag.find(query).sort({ order: 1, name: 1 }).lean();

    res.status(200).json({
      success: true,
      data: { tags },
    });
  }
);

// @desc    Obtener tags activos (método estático del modelo)
// @route   GET /api/tags/active
// @access  Public
export const getActiveTags = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const tags = await Tag.getActiveTags();

    res.status(200).json({
      success: true,
      data: { tags },
    });
  }
);

// @desc    Obtener tag por ID
// @route   GET /api/tags/:id
// @access  Public
export const getTagById = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { id } = req.params;

    const tag = await Tag.findById(id);

    if (!tag) {
      throw new AppError(404, 'Tag no encontrado');
    }

    res.status(200).json({
      success: true,
      data: { tag },
    });
  }
);

// @desc    Obtener tag por slug
// @route   GET /api/tags/slug/:slug
// @access  Public
export const getTagBySlug = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { slug } = req.params;

    const tag = await Tag.findOne({ slug, active: true });

    if (!tag) {
      throw new AppError(404, 'Tag no encontrado');
    }

    res.status(200).json({
      success: true,
      data: { tag },
    });
  }
);

// @desc    Crear tag
// @route   POST /api/tags
// @access  Private (admin, funcionario)
export const createTag = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { name, color, description, order } = req.body;

    // Check for duplicate tag name
    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
      throw new AppError(400, 'Ya existe un tag con ese nombre');
    }

    const tag = await Tag.create({
      name,
      color: color || '#10B981',
      description,
      order: order || 0,
      active: true,
    });

    res.status(201).json({
      success: true,
      message: 'Tag creado exitosamente',
      data: { tag },
    });
  }
);

// @desc    Actualizar tag
// @route   PUT /api/tags/:id
// @access  Private (admin, funcionario)
export const updateTag = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const { name, color, description, order, active } = req.body;

    const tag = await Tag.findById(id);

    if (!tag) {
      throw new AppError(404, 'Tag no encontrado');
    }

    if (name !== undefined) tag.name = name;
    if (color !== undefined) tag.color = color;
    if (description !== undefined) tag.description = description;
    if (order !== undefined) tag.order = order;
    if (active !== undefined) tag.active = active;

    await tag.save();

    res.status(200).json({
      success: true,
      message: 'Tag actualizado exitosamente',
      data: { tag },
    });
  }
);

// @desc    Eliminar tag (soft delete)
// @route   DELETE /api/tags/:id
// @access  Private (admin)
export const deleteTag = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { id } = req.params;

    const tag = await Tag.findById(id);

    if (!tag) {
      throw new AppError(404, 'Tag no encontrado');
    }

    tag.active = false;
    await tag.save();

    res.status(200).json({
      success: true,
      message: 'Tag eliminado exitosamente',
    });
  }
);

// @desc    Obtener o crear tag (para importaciones)
// @route   POST /api/tags/get-or-create
// @access  Private (admin, funcionario)
export const getOrCreateTag = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { name } = req.body;

    const tag = await Tag.getOrCreate(name);

    res.status(200).json({
      success: true,
      data: { tag },
    });
  }
);
