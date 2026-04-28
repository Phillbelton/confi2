import { productService } from '@/services/products';
import { categoryService } from '@/services/categories';

export const productsM = {
  list: productService.getProducts,
  featured: productService.getFeaturedProducts,
  bySlug: productService.getProductBySlug,
  variants: productService.getProductVariants,
};

export const categoriesM = {
  all: categoryService.getAll,
  hierarchical: categoryService.getAllHierarchical,
  main: categoryService.getMainCategories,
};

export default productsM;
