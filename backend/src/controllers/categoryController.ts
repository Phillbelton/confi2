import { Response } from 'express';
import { Category } from '../models/Category';
import Product from "../models/Product";
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

    // Devolver lista plana con `subcategories` (hijos directos) embebido en cada nodo.
    // Plana permite al cliente reconstruir el árbol N-tier; el campo embebido preserva
    // compatibilidad con consumidores que leen `root.subcategories`.
    const childrenByParent = new Map<string, typeof categories>();
    for (const cat of categories) {
      const pid = cat.parent?.toString();
      if (!pid) continue;
      if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
      childrenByParent.get(pid)!.push(cat);
    }

    const categoriesWithSubs = categories.map(cat => ({
      ...cat,
      subcategories: childrenByParent.get(cat._id.toString()) || [],
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

    // Contar productos usando Product
    const productCount = await Product.countDocuments({
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

    const productCount = await Product.countDocuments({
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
        const productCount = await Product.countDocuments({
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
    const {
      name,
      description,
      icon,
      color,
      parent,
      order,
      active,
      facetableAttributes,
    } = req.body;

    // Jerarquía de 2 niveles: una subcategoría solo puede colgar de una
    // categoría raíz. No se permiten sub-subcategorías.
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        throw new AppError(400, 'La categoría padre no existe');
      }
      if (parentCategory.parent) {
        throw new AppError(
          400,
          'Solo se pueden crear subcategorías a partir de categorías raíz'
        );
      }
    }

    const category = await Category.create({
      name,
      description,
      icon,
      color,
      parent,
      order,
      active,
      facetableAttributes,
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

    const {
      name,
      description,
      icon,
      color,
      order,
      active,
      facetableAttributes,
    } = req.body;

    // El `parent` NO es editable: una categoría no se puede mover de rama.
    // La relación raíz/subcategoría se fija al crear y no cambia. Esto evita
    // ciclos y jerarquías de más de 2 niveles.

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;
    if (order !== undefined) category.order = order;
    if (active !== undefined) category.active = active;
    if (facetableAttributes !== undefined) {
      category.facetableAttributes = facetableAttributes;
    }

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
    const productCount = await Product.countDocuments({
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

// @desc    Obtener facetableAttributes efectivos (self + ancestors deduplicados)
// @route   GET /api/categories/:id/facetable-attributes
// @access  Public
export const getFacetableAttributes = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const category = await Category.findById(req.params.id).select('_id').lean();
    if (!category) throw new AppError(404, 'Categoría no encontrada');

    const attributes = await (Category as any).getEffectiveFacetableAttributes([
      category._id,
    ]);

    res.status(200).json({
      success: true,
      data: { attributes },
    });
  }
);
