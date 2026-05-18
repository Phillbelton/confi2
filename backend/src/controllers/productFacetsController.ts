import { Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import { Format } from '../models/Format';
import { Flavor } from '../models/Flavor';
import Collection from '../models/Collection';
import { AuthRequest, ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * GET /api/products/facets
 * Devuelve counts de cada dimensión filtrable según el filtro base.
 * Cascada unidireccional: solo `category + search + price + collection`.
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

    const baseMatch: any = { active: true };

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
        // Incluir descendientes (3 niveles) — filtrar por L1 trae también L2 y L3
        const descendantIds = await (Category as any).getDescendantIds(categoryId);
        baseMatch.categories = { $in: descendantIds };
      } else {
        baseMatch._id = { $in: [] };
      }
    }

    if (search) baseMatch.$text = { $search: search };

    if (collectionSlug) {
      const coll = await Collection.findOne({ slug: collectionSlug, active: true })
        .select('products')
        .lean();
      if (coll && coll.products?.length) baseMatch._id = { $in: coll.products };
      else baseMatch._id = { $in: [] };
    }

    if (minPrice || maxPrice) {
      baseMatch.unitPrice = {};
      if (minPrice) baseMatch.unitPrice.$gte = parseFloat(minPrice);
      if (maxPrice) baseMatch.unitPrice.$lte = parseFloat(maxPrice);
    }

    // Filtros dinámicos `attr_<key>=v1,v2` → attributes.<key>: { $in: [...] }
    const activeAttrFilters = new Map<string, string[]>();
    for (const [qKey, qValRaw] of Object.entries(req.query as Record<string, any>)) {
      if (!qKey.startsWith('attr_') || qValRaw == null) continue;
      const attrKey = qKey.slice(5);
      if (!attrKey) continue;
      const values = String(qValRaw)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      if (values.length === 0) continue;
      activeAttrFilters.set(attrKey, values);
      baseMatch[`attributes.${attrKey}`] = { $in: values };
    }

    const facetResult = await Product.aggregate([
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
          formatsAgg: [
            { $match: { format: { $exists: true, $ne: null } } },
            { $group: { _id: '$format', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          flavorsAgg: [
            { $match: { flavor: { $exists: true, $ne: null } } },
            { $group: { _id: '$flavor', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          featuredAgg: [{ $match: { featured: true } }, { $count: 'count' }],
          onSaleAgg: [
            {
              $match: {
                $or: [
                  { 'tiers.0': { $exists: true } },
                  { 'fixedDiscount.enabled': true },
                ],
              },
            },
            { $count: 'count' },
          ],
          attributesAgg: [
            { $match: { attributes: { $exists: true, $ne: null } } },
            { $project: { attrs: { $objectToArray: '$attributes' } } },
            { $unwind: '$attrs' },
            { $unwind: '$attrs.v' },
            { $group: { _id: { key: '$attrs.k', value: '$attrs.v' }, count: { $sum: 1 } } },
          ],
          allIds: [{ $project: { _id: 1 } }],
        },
      },
    ]);

    const result = facetResult[0] || {};
    const total = result.totalAgg?.[0]?.count || 0;
    const featuredCount = result.featuredAgg?.[0]?.count || 0;
    const onSaleCount = result.onSaleAgg?.[0]?.count || 0;
    const allIds: mongoose.Types.ObjectId[] = (result.allIds || []).map((p: any) => p._id);

    // Resolver Brands
    const brandIds = (result.brandsAgg || []).map((b: any) => b._id).filter(Boolean);
    const brandsDocs = await Brand.find({ _id: { $in: brandIds }, active: true })
      .select('name slug')
      .lean();
    const brandMap = new Map(brandsDocs.map((b: any) => [b._id.toString(), b]));
    const brands = (result.brandsAgg || [])
      .map((b: any) => {
        const doc = brandMap.get(b._id?.toString());
        if (!doc) return null;
        return { _id: doc._id.toString(), name: doc.name, slug: doc.slug, count: b.count };
      })
      .filter(Boolean);

    // Subcategorías
    const subIds = (result.subcategoriesAgg || []).map((s: any) => s._id);
    let subDocs: any[];
    if (categoryId) {
      subDocs = await Category.find({
        _id: { $in: subIds },
        parent: categoryId,
        active: true,
      }).select('name slug parent').lean();
    } else {
      subDocs = await Category.find({
        _id: { $in: subIds },
        parent: null,
        active: true,
      }).select('name slug').lean();
    }
    const subCountMap: Map<string, number> = new Map(
      (result.subcategoriesAgg || []).map((s: any) => [s._id.toString(), s.count])
    );
    const subcategories = subDocs
      .map((sc: any) => ({
        _id: sc._id.toString(),
        name: sc.name,
        slug: sc.slug,
        count: subCountMap.get(sc._id.toString()) || 0,
      }))
      .filter((sc) => sc.count > 0)
      .sort((a, b) => b.count - a.count);

    // Formats
    const formatIds = (result.formatsAgg || []).map((f: any) => f._id).filter(Boolean);
    const formatDocs = await Format.find({ _id: { $in: formatIds }, active: true })
      .select('label value unit slug')
      .lean();
    const formatMap = new Map(formatDocs.map((f: any) => [f._id.toString(), f]));
    const formats = (result.formatsAgg || [])
      .map((f: any) => {
        const doc = formatMap.get(f._id?.toString());
        if (!doc) return null;
        return { _id: doc._id.toString(), label: doc.label, value: doc.value, unit: doc.unit, slug: doc.slug, count: f.count };
      })
      .filter(Boolean);

    // Flavors
    const flavorIds = (result.flavorsAgg || []).map((f: any) => f._id).filter(Boolean);
    const flavorDocs = await Flavor.find({ _id: { $in: flavorIds }, active: true })
      .select('name slug color')
      .lean();
    const flavorMap = new Map(flavorDocs.map((f: any) => [f._id.toString(), f]));
    const flavors = (result.flavorsAgg || [])
      .map((f: any) => {
        const doc = flavorMap.get(f._id?.toString());
        if (!doc) return null;
        return { _id: doc._id.toString(), name: doc.name, slug: doc.slug, color: doc.color, count: f.count };
      })
      .filter(Boolean);

    // Collections
    const allIdSet = new Set(allIds.map((id) => id.toString()));
    const allCollections = await Collection.find({ active: true, showOnHome: true })
      .select('name slug emoji products')
      .lean();
    const collections = allCollections
      .map((c: any) => {
        const count = (c.products || []).reduce(
          (acc: number, pid: any) => (allIdSet.has(pid.toString()) ? acc + 1 : acc),
          0
        );
        return { _id: c._id.toString(), name: c.name, slug: c.slug, count };
      })
      .filter((c: any) => c.count > 0)
      .sort((a: any, b: any) => b.count - a.count);

    // === Atributos dinámicos ===
    // Resolver labels desde la categoría filtrada (o sus raíces) usando
    // getEffectiveFacetableAttributes. Si no hay categoría filtrada, agregamos
    // todas las raíces para abarcar el catálogo entero.
    let effectiveAttrIds: mongoose.Types.ObjectId[];
    if (categoryId) {
      effectiveAttrIds = [categoryId];
    } else {
      const roots = await Category.find({ parent: null, active: true })
        .select('_id')
        .lean();
      effectiveAttrIds = roots.map((r: any) => r._id);
    }
    const effectiveAttrs: Array<{
      key: string;
      label: string;
      multiSelect: boolean;
      order: number;
      options: Array<{ value: string; label: string }>;
    }> = await (Category as any).getEffectiveFacetableAttributes(effectiveAttrIds);

    const attrCountMap = new Map<string, Map<string, number>>();
    for (const row of (result.attributesAgg || []) as Array<any>) {
      const k = row._id?.key as string;
      const v = row._id?.value as string;
      if (!k || v == null) continue;
      if (!attrCountMap.has(k)) attrCountMap.set(k, new Map());
      attrCountMap.get(k)!.set(v, row.count);
    }

    const attributes = effectiveAttrs
      .map((a) => {
        const counts = attrCountMap.get(a.key) || new Map();
        const options = (a.options || [])
          .map((opt) => ({
            value: opt.value,
            label: opt.label,
            count: counts.get(opt.value) || 0,
          }))
          .filter((opt) => opt.count > 0);
        if (options.length === 0) return null;
        return {
          key: a.key,
          label: a.label,
          multiSelect: a.multiSelect,
          options,
        };
      })
      .filter(Boolean);

    res.status(200).json({
      success: true,
      data: {
        total,
        subcategories,
        brands,
        formats,
        flavors,
        collections,
        attributes,
        promos: { onSale: onSaleCount, featured: featuredCount },
      },
    });
  }
);
