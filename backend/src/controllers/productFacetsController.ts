import { Response } from 'express';
import mongoose from 'mongoose';
import ProductParent from '../models/ProductParent';
import ProductVariant from '../models/ProductVariant';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import Collection from '../models/Collection';
import { AuthRequest, ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Helper local: IDs de ProductParent con descuento activo (variant fixed o tiered).
 * Espeja la lógica del modelo ProductVariant.hasActiveDiscount.
 */
async function getOnSaleParentIds(): Promise<mongoose.Types.ObjectId[]> {
  const now = new Date();
  const dateValid = (field: string) => ({
    $and: [
      {
        $or: [
          { [`${field}.startDate`]: { $exists: false } },
          { [`${field}.startDate`]: null },
          { [`${field}.startDate`]: { $lte: now } },
        ],
      },
      {
        $or: [
          { [`${field}.endDate`]: { $exists: false } },
          { [`${field}.endDate`]: null },
          { [`${field}.endDate`]: { $gte: now } },
        ],
      },
    ],
  });

  const ids = await ProductVariant.find({
    active: true,
    $or: [
      { 'fixedDiscount.enabled': true, ...dateValid('fixedDiscount') },
      {
        'tieredDiscount.active': true,
        'tieredDiscount.tiers.0': { $exists: true },
        ...dateValid('tieredDiscount'),
      },
    ],
  }).distinct('parentProduct');

  return ids as mongoose.Types.ObjectId[];
}

/**
 * GET /api/products/parents/facets
 *
 * Devuelve los counts de facetas (subcategorías, marcas, colecciones, promos)
 * según un filtro base (category, search, price, collection, active).
 *
 * Cascada UNIDIRECCIONAL: solo `category + search + price` filtra el set base.
 * Marcas y colecciones NO se influyen entre sí — facilita el caching y simplifica
 * el agregado a una sola pasada.
 */
export const getProductFacets = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      collection: collectionSlug,
    } = req.query as Record<string, string | undefined>;

    // ---------------------------------------------------------------
    // 1. Construir baseMatch para ProductParent
    // ---------------------------------------------------------------
    const baseMatch: any = { active: true };

    // Categoría: aceptar slug o ID
    let categoryId: mongoose.Types.ObjectId | undefined;
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryId = new mongoose.Types.ObjectId(category);
      } else {
        const cat = await Category.findOne({ slug: category, active: true })
          .select('_id')
          .lean();
        if (cat) categoryId = cat._id as mongoose.Types.ObjectId;
      }
      if (categoryId) {
        baseMatch.categories = { $in: [categoryId] };
      } else {
        // categoría inexistente → todo vacío
        baseMatch._id = { $in: [] };
      }
    }

    // Búsqueda por texto
    if (search) {
      baseMatch.$text = { $search: search };
    }

    // Colección (intersecar con products[]). Como faceta es unidireccional,
    // sólo se aplica si el cliente la mandó como filtro activo.
    if (collectionSlug) {
      const coll = await Collection.findOne({
        slug: collectionSlug,
        active: true,
      })
        .select('products')
        .lean();
      if (coll && coll.products?.length) {
        baseMatch._id = { $in: coll.products };
      } else {
        baseMatch._id = { $in: [] };
      }
    }

    // ---------------------------------------------------------------
    // 2. Filtro de precio (por variantes) — restringe el universo previo
    // ---------------------------------------------------------------
    if (minPrice || maxPrice) {
      const variantPriceFilter: any = { active: true };
      if (minPrice) variantPriceFilter.price = { $gte: parseFloat(minPrice) };
      if (maxPrice) {
        variantPriceFilter.price = {
          ...(variantPriceFilter.price || {}),
          $lte: parseFloat(maxPrice),
        };
      }
      const parentIdsInPriceRange = await ProductVariant.find(variantPriceFilter).distinct(
        'parentProduct'
      );
      const existing = baseMatch._id?.$in;
      if (existing) {
        const set = new Set(parentIdsInPriceRange.map((i: any) => i.toString()));
        baseMatch._id = {
          $in: existing.filter((id: any) => set.has(id.toString())),
        };
      } else {
        baseMatch._id = { $in: parentIdsInPriceRange };
      }
    }

    // ---------------------------------------------------------------
    // 3. Aggregation pipeline con $facet — counts por dimensión
    // ---------------------------------------------------------------
    const onSaleIds = await getOnSaleParentIds();

    const facetResult = await ProductParent.aggregate([
      { $match: baseMatch },
      {
        $facet: {
          totalAgg: [{ $count: 'count' }],
          brandsAgg: [
            { $match: { brand: { $exists: true, $ne: null } } },
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          subcategoriesAgg: [
            { $unwind: '$categories' },
            { $group: { _id: '$categories', count: { $sum: 1 } } },
          ],
          featuredAgg: [
            { $match: { featured: true } },
            { $count: 'count' },
          ],
          onSaleAgg: [
            { $match: { _id: { $in: onSaleIds } } },
            { $count: 'count' },
          ],
          allIds: [{ $project: { _id: 1 } }],
        },
      },
    ]);

    const result = facetResult[0] || {};
    const total = result.totalAgg?.[0]?.count || 0;
    const featuredCount = result.featuredAgg?.[0]?.count || 0;
    const onSaleCount = result.onSaleAgg?.[0]?.count || 0;
    const allParentIds: mongoose.Types.ObjectId[] = (result.allIds || []).map(
      (p: any) => p._id
    );

    // ---------------------------------------------------------------
    // 4. Resolver Brands con name+slug
    // ---------------------------------------------------------------
    const brandIds = (result.brandsAgg || []).map((b: any) => b._id).filter(Boolean);
    const brandsDocs = (await Brand.find({ _id: { $in: brandIds }, active: true })
      .select('name slug')
      .lean()) as Array<{ _id: any; name: string; slug: string }>;
    const brandMap = new Map(brandsDocs.map((b) => [b._id.toString(), b]));

    const brands = (result.brandsAgg || [])
      .map((b: any) => {
        const doc = brandMap.get(b._id?.toString());
        if (!doc) return null;
        return {
          _id: doc._id.toString(),
          name: doc.name,
          slug: doc.slug,
          count: b.count as number,
        };
      })
      .filter(Boolean);

    // ---------------------------------------------------------------
    // 5. Resolver Subcategorías
    //    - Si hay categoría activa: solo devolver hijas de esa categoría
    //    - Si no: devolver todas las categorías presentes en el resultset
    // ---------------------------------------------------------------
    const subcatIdsInResults = (result.subcategoriesAgg || []).map((s: any) => s._id);

    let subcategoryDocs: any[];
    if (categoryId) {
      // Solo hijas directas de la categoría activa
      subcategoryDocs = await Category.find({
        _id: { $in: subcatIdsInResults },
        parent: categoryId,
        active: true,
      })
        .select('name slug parent')
        .lean();
    } else {
      // Categorías raíz presentes
      subcategoryDocs = await Category.find({
        _id: { $in: subcatIdsInResults },
        parent: null,
        active: true,
      })
        .select('name slug')
        .lean();
    }

    const subCountMap: Map<string, number> = new Map(
      (result.subcategoriesAgg || []).map((s: any) => [
        s._id.toString(),
        s.count as number,
      ])
    );

    const subcategories = subcategoryDocs
      .map((sc: any) => ({
        _id: sc._id.toString(),
        name: sc.name,
        slug: sc.slug,
        count: subCountMap.get(sc._id.toString()) || 0,
      }))
      .filter((sc) => sc.count > 0)
      .sort((a, b) => b.count - a.count);

    // ---------------------------------------------------------------
    // 6. Resolver Colecciones (cuáles tienen products en el resultset)
    // ---------------------------------------------------------------
    const allParentIdSet = new Set(allParentIds.map((id) => id.toString()));
    const allCollections = await Collection.find({
      active: true,
      showOnHome: true,
    })
      .select('name slug emoji products')
      .lean();

    const collections = allCollections
      .map((c: any) => {
        const count = (c.products || []).reduce(
          (acc: number, pid: any) =>
            allParentIdSet.has(pid.toString()) ? acc + 1 : acc,
          0
        );
        return {
          _id: c._id.toString(),
          name: c.name,
          slug: c.slug,
          count,
        };
      })
      .filter((c: any) => c.count > 0)
      .sort((a: any, b: any) => b.count - a.count);

    // ---------------------------------------------------------------
    // 7. Respuesta
    // ---------------------------------------------------------------
    res.status(200).json({
      success: true,
      data: {
        total,
        subcategories,
        brands,
        collections,
        promos: {
          onSale: onSaleCount,
          featured: featuredCount,
        },
      },
    });
  }
);
