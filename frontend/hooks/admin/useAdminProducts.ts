import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productService } from '@/services/products';
import { adminProductService } from '@/services/admin/products';
import type {
  ProductQueryParams,
  ProductParent,
  ProductVariant,
} from '@/types';
import type {
  CreateProductParentInput,
  UpdateProductParentInput,
  CreateProductVariantInput,
  UpdateProductVariantInput,
  UpdateStockInput,
} from '@/services/admin/products';

export function useAdminProducts(params?: ProductQueryParams) {
  const queryClient = useQueryClient();

  // Get products query
  const productsQuery = useQuery({
    queryKey: ['admin-products', params],
    queryFn: () => productService.getProducts(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProductParentInput) =>
      adminProductService.createProductParent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el producto');
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductParentInput }) =>
      adminProductService.updateProductParent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product'] });
      toast.success('Producto actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el producto');
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminProductService.deleteProductParent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el producto');
    },
  });

  // Upload images mutation
  const uploadImagesMutation = useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) =>
      adminProductService.uploadProductParentImages(id, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product'] });
      toast.success('Imágenes cargadas exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cargar imágenes');
    },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) =>
      adminProductService.deleteProductParentImage(id, filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product'] });
      toast.success('Imagen eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar imagen');
    },
  });

  return {
    products: productsQuery.data?.data || [],
    pagination: productsQuery.data?.pagination,
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    createProduct: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateProduct: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteProduct: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    uploadImages: uploadImagesMutation.mutate,
    isUploadingImages: uploadImagesMutation.isPending,
    deleteImage: deleteImageMutation.mutate,
    isDeletingImage: deleteImageMutation.isPending,
    refetch: productsQuery.refetch,
  };
}

export function useAdminProduct(id: string) {
  const queryClient = useQueryClient();

  const productQuery = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    product: productQuery.data?.data,
    isLoading: productQuery.isLoading,
    error: productQuery.error,
    refetch: productQuery.refetch,
  };
}

export function useAdminProductVariants(parentId: string) {
  const queryClient = useQueryClient();

  const variantsQuery = useQuery({
    queryKey: ['admin-product-variants', parentId],
    queryFn: () => productService.getProductVariants(parentId),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: (data: CreateProductVariantInput) =>
      adminProductService.createProductVariant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-variants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Variante creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear la variante');
    },
  });

  // Update variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductVariantInput }) =>
      adminProductService.updateProductVariant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-variants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Variante actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar la variante');
    },
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockInput }) =>
      adminProductService.updateVariantStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-variants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Stock actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el stock');
    },
  });

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: (id: string) => adminProductService.deleteProductVariant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-variants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Variante eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar la variante');
    },
  });

  return {
    variants: variantsQuery.data?.data || [],
    isLoading: variantsQuery.isLoading,
    error: variantsQuery.error,
    createVariant: createVariantMutation.mutate,
    isCreatingVariant: createVariantMutation.isPending,
    updateVariant: updateVariantMutation.mutate,
    isUpdatingVariant: updateVariantMutation.isPending,
    updateStock: updateStockMutation.mutate,
    isUpdatingStock: updateStockMutation.isPending,
    deleteVariant: deleteVariantMutation.mutate,
    isDeletingVariant: deleteVariantMutation.isPending,
    refetch: variantsQuery.refetch,
  };
}
