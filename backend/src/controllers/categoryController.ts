import { Response } from 'express';
import { Category } from '../models/Category';
import ProductParent from '../models/ProductParent';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// @desc    Obtener todas las categorías activas
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const includeInactive = req.query.includeInactive === 'true';

    const query = includeInactive ? {} : { active: true };

    const categories = await Category.find(query)
      .sort({ order: 1, name: 1 })
      .lean();

    // Organizar en estructura jerárquica
    const mainCategories = categories.filter(cat => !cat.parent);
    const subcategories = categories.filter(cat => cat.parent);

    const categoriesWithSubs = mainCategories.map(mainCat => ({
      ...mainCat,
      subcategories: subcategories.filter(
        sub => sub.parent?.toString() === mainCat._id.toString()
      ),
    }));

    res.status(200).json({
      success: true,
      data: {
        categories: categoriesWithSubs,
      },
    });
  }
);

// @desc    Obtener categoría por ID
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug');

    if (!category) {
      throw new AppError(404, 'Categoría no encontrada');
    }

    // Obtener subcategorías si es categoría principal
    const subcategories = await Category.find({
      parent: category._id,
      active: true,
    }).sort({ order: 1 });

    // Contar productos usando ProductParent
    const productCount = await ProductParent.countDocuments({
      categories: category._id,
      active: true,
    });

    res.status(200).json({
      success: true,
      data: {
        category: {
          ...category.toJSON(),
          subcategories,
          productCount,
        },
      },
    });
  }
);

// @desc    Obtener categoría por slug
// @route   GET /api/categories/slug/:slug
// @access  Public
export const getCategoryBySlug = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const category = await Category.findOne({ slug: req.params.slug })
      .populate('parent', 'name slug');

    if (!category) {
      throw new AppError(404, 'Categoría no encontrada');
    }

    const subcategories = await Category.find({
      parent: category._id,
      active: true,
    }).sort({ order: 1 });

    const productCount = await ProductParent.countDocuments({
      categories: category._id,
      active: true,
    });

    res.status(200).json({
      success: true,
      data: {
        category: {
          ...category.toJSON(),
          subcategories,
          productCount,
        },
      },
    });
  }
);

// @desc    Obtener categorías principales
// @route   GET /api/categories/main
// @access  Public
export const getMainCategories = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const categories = await Category.find({ parent: null, active: true })
      .sort({ order: 1, name: 1 });

    // Contar productos por categoría
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await ProductParent.countDocuments({
          categories: category._id,
          active: true,
        });

        const subcategories = await Category.find({
          parent: category._id,
          active: true,
        }).sort({ order: 1 });

        return {
          ...category.toJSON(),
          productCount,
          subcategories,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        categories: categoriesWithCount,
      },
    });
  }
);

// @desc    Obtener subcategorías de una categoría
// @route   GET /api/categories/:id/subcategories
// @access  Public
export const getSubcategories = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const parentCategory = await Category.findById(req.params.id);

    if (!parentCategory) {
      throw new AppError(404, 'Categoría padre no encontrada');
    }

    const subcategories = await Category.find({
      parent: parentCategory._id,
      active: true,
    }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: {
        subcategories,
      },
    });
  }
);

// @desc    Crear nueva categoría
// @route   POST /api/categories
// @access  Admin, Funcionario
export const createCategory = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { name, description, icon, color, parent, order, active } = req.body;

    const category = await Category.create({
      name,
      description,
      icon,
      color,
      parent,
      order,
      active,
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: { category },
    });
  }
);

// @desc    Actualizar categoría
// @route   PUT /api/categories/:id
// @access  Admin, Funcionario
export const updateCategory = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError(404, 'Categoría no encontrada');
    }

    const { name, description, icon, color, parent, order, active } = req.body;

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;
    if (parent !== undefined) category.parent = parent;
    if (order !== undefined) category.order = order;
    if (active !== undefined) category.active = active;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: { category },
    });
  }
);

// @desc    Eliminar categoría
// @route   DELETE /api/categories/:id
// @access  Admin
export const deleteCategory = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new AppError(404, 'Categoría no encontrada');
    }

    // Verificar que no tenga productos
    const productCount = await ProductParent.countDocuments({
      categories: category._id,
    });

    if (productCount > 0) {
      throw new AppError(
        400,
        'No se puede eliminar la categoría porque tiene productos asociados'
      );
    }

    // Verificar que no tenga subcategorías
    const subcategoryCount = await Category.countDocuments({
      parent: category._id,
    });

    if (subcategoryCount > 0) {
      throw new AppError(
        400,
        'No se puede eliminar la categoría porque tiene subcategorías'
      );
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Categoría eliminada exitosamente',
    });
  }
);
