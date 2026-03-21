import type { Category } from '@/types';

/**
 * Extended Category type with subcategories array
 */
export interface CategoryWithSubcategories extends Category {
  subcategories?: Category[];
}

/**
 * Build a hierarchical tree from a flat array of categories
 */
export function buildCategoryTree(
  flatCategories: Category[]
): CategoryWithSubcategories[] {
  const mainCategories = flatCategories.filter((cat) => !cat.parent);
  const subcategories = flatCategories.filter((cat) => cat.parent);

  return mainCategories.map((mainCat) => ({
    ...mainCat,
    subcategories: subcategories.filter((sub) => {
      const parentId =
        typeof sub.parent === 'string' ? sub.parent : sub.parent?._id;
      return parentId === mainCat._id;
    }),
  }));
}

/**
 * Flatten a hierarchical category tree back to a flat array
 */
export function flattenCategoryTree(
  tree: CategoryWithSubcategories[]
): Category[] {
  const result: Category[] = [];

  tree.forEach((parent) => {
    result.push(parent);
    if (parent.subcategories && parent.subcategories.length > 0) {
      result.push(...parent.subcategories);
    }
  });

  return result;
}

/**
 * Get the full path of a category (e.g., "Bebidas > Gaseosas")
 */
export function getCategoryPath(
  categoryId: string,
  allCategories: Category[]
): string {
  const category = allCategories.find((c) => c._id === categoryId);
  if (!category) return '';

  const parts: string[] = [category.name];

  if (category.parent) {
    const parentId =
      typeof category.parent === 'string'
        ? category.parent
        : category.parent._id;
    const parent = allCategories.find((c) => c._id === parentId);
    if (parent) {
      parts.unshift(parent.name);
    }
  }

  return parts.join(' > ');
}

/**
 * Check if a category has subcategories
 */
export function hasSubcategories(
  categoryId: string,
  allCategories: Category[]
): boolean {
  return allCategories.some((cat) => {
    const parentId =
      typeof cat.parent === 'string' ? cat.parent : cat.parent?._id;
    return parentId === categoryId;
  });
}

/**
 * Get count of subcategories for a parent category
 */
export function getSubcategoryCount(
  categoryId: string,
  allCategories: Category[]
): number {
  return allCategories.filter((cat) => {
    const parentId =
      typeof cat.parent === 'string' ? cat.parent : cat.parent?._id;
    return parentId === categoryId;
  }).length;
}

/**
 * Get all subcategories for a parent category
 */
export function getSubcategories(
  categoryId: string,
  allCategories: Category[]
): Category[] {
  return allCategories.filter((cat) => {
    const parentId =
      typeof cat.parent === 'string' ? cat.parent : cat.parent?._id;
    return parentId === categoryId;
  });
}
