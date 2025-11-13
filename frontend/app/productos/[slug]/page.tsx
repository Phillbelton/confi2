'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ShoppingCart, Check, Minus, Plus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useProductBySlug, useProductVariants, useProducts } from '@/hooks/useProducts';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'sonner';
import type { ProductVariant } from '@/types';
import { cn } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Fetch product and variants
  const { data: productData, isLoading: productLoading } = useProductBySlug(slug);
  const product = productData?.data;

  const { data: variantsData, isLoading: variantsLoading } = useProductVariants(
    product?._id || ''
  );
  const variants = variantsData?.data || [];

  // Fetch related products (same first category)
  const firstCategoryId =
    typeof product?.categories?.[0] === 'string'
      ? product.categories[0]
      : product?.categories?.[0]?._id;

  const { data: relatedData } = useProducts({
    categories: firstCategoryId ? [firstCategoryId] : undefined,
    limit: 4,
  });
  const relatedProducts = Array.isArray(relatedData?.data)
    ? relatedData.data.filter((p) => p._id !== product?._id)
    : [];

  // State
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  // Set initial variant when variants load
  if (variants.length > 0 && !selectedVariantId) {
    setSelectedVariantId(variants[0]._id);
  }

  const selectedVariant = variants.find((v) => v._id === selectedVariantId);

  // Get images (from variant or parent)
  const images = selectedVariant?.images?.length
    ? selectedVariant.images
    : product?.images || [];
  const mainImage = images[selectedImageIndex] || '/placeholder-product.jpg';

  // Check stock status
  const isOutOfStock = selectedVariant && selectedVariant.stock === 0;
  const maxQuantity = selectedVariant?.allowBackorder
    ? 999
    : selectedVariant?.stock || 1;

  // Handle quantity changes
  const incrementQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity((q) => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product || !selectedVariant || isOutOfStock) return;

    setIsAdding(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      addItem(product, selectedVariant, quantity);

      setJustAdded(true);
      toast.success('Producto agregado al carrito', {
        description: `${product.name} ${
          product.hasVariants ? `- ${selectedVariant.displayName}` : ''
        } × ${quantity}`,
      });

      setTimeout(() => setJustAdded(false), 2000);
    } catch (error) {
      toast.error('Error al agregar el producto');
    } finally {
      setIsAdding(false);
    }
  };

  // Get tiered discount for selected variant
  const getTieredDiscount = () => {
    if (!product || !selectedVariant) return null;

    for (const discount of product.tieredDiscounts || []) {
      if (!discount.active) continue;

      // Check if this discount applies to current variant
      const variantValue = selectedVariant.attributes[discount.attribute];
      if (variantValue === discount.attributeValue) {
        return discount;
      }
    }

    return null;
  };

  const tieredDiscount = getTieredDiscount();

  // Calculate discounted price for current quantity
  const getDiscountedPrice = () => {
    if (!selectedVariant || !tieredDiscount) return null;

    const applicableTier = tieredDiscount.tiers.find((tier) => {
      const meetsMin = quantity >= tier.minQuantity;
      const meetsMax = tier.maxQuantity === null || quantity <= tier.maxQuantity;
      return meetsMin && meetsMax;
    });

    if (!applicableTier) return null;

    const discountAmount =
      applicableTier.type === 'percentage'
        ? (selectedVariant.price * applicableTier.value) / 100
        : applicableTier.value;

    return {
      originalPrice: selectedVariant.price,
      discountedPrice: selectedVariant.price - discountAmount,
      savings: discountAmount,
      tier: applicableTier,
    };
  };

  const discountInfo = getDiscountedPrice();

  // Loading state
  if (productLoading || variantsLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container px-4 py-8 md:px-6 md:py-12">
            <Skeleton className="h-8 w-32 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Skeleton className="aspect-square w-full" />
              <div className="space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not found state
  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container px-4 py-8 md:px-6 md:py-12">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
              <p className="text-muted-foreground mb-6">
                El producto que buscas no existe o ha sido eliminado.
              </p>
              <Button asChild>
                <Link href="/productos">Ver todos los productos</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

          {/* Product Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.featured && (
                    <Badge className="bg-secondary">Destacado</Badge>
                  )}
                  {isOutOfStock && <Badge variant="destructive">Agotado</Badge>}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={cn(
                        'aspect-square relative overflow-hidden rounded-md border-2 transition-all',
                        selectedImageIndex === index
                          ? 'border-primary'
                          : 'border-transparent hover:border-muted-foreground/30'
                      )}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} - Imagen ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="25vw"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Brand */}
              {typeof product.brand === 'object' && product.brand && (
                <p className="text-sm text-muted-foreground">
                  {product.brand.name}
                </p>
              )}

              {/* Name */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  {product.name}
                </h1>
                {selectedVariant && product.hasVariants && (
                  <p className="text-lg text-muted-foreground mt-2">
                    {selectedVariant.displayName}
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                {discountInfo ? (
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-primary">
                        ${discountInfo.discountedPrice.toLocaleString()}
                      </span>
                      <span className="text-2xl text-muted-foreground line-through">
                        ${discountInfo.originalPrice.toLocaleString()}
                      </span>
                    </div>
                    <Badge className="bg-success text-success-foreground">
                      Ahorrás ${discountInfo.savings.toLocaleString()} (
                      {discountInfo.tier.value}%)
                    </Badge>
                  </div>
                ) : selectedVariant ? (
                  <span className="text-4xl font-bold text-primary">
                    ${selectedVariant.price.toLocaleString()}
                  </span>
                ) : null}
                <p className="text-sm text-muted-foreground mt-2">
                  Precio por unidad
                </p>
              </div>

              <Separator />

              {/* Variant Selector */}
              {product.hasVariants && product.variantAttributes.length > 0 && (
                <div className="space-y-4">
                  {product.variantAttributes.map((attr) => (
                    <div key={attr.name}>
                      <label className="text-sm font-medium mb-2 block">
                        {attr.displayName}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {attr.values.map((val) => {
                          // Find variant with this attribute value
                          const variant = variants.find(
                            (v) => v.attributes[attr.name] === val.value
                          );

                          if (!variant) return null;

                          const isSelected = selectedVariantId === variant._id;
                          const isDisabled = !variant.active || variant.stock === 0;

                          return (
                            <Button
                              key={val.value}
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedVariantId(variant._id);
                                setQuantity(1);
                                setSelectedImageIndex(0);
                              }}
                              disabled={isDisabled}
                              className={cn(
                                'min-w-[80px]',
                                isDisabled && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {val.displayValue}
                              {isDisabled && ' (Agotado)'}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stock info */}
              {selectedVariant && (
                <div>
                  {selectedVariant.isLowStock && !isOutOfStock ? (
                    <p className="text-sm text-amber-600">
                      ¡Últimas {selectedVariant.stock} unidades!
                    </p>
                  ) : !isOutOfStock ? (
                    <p className="text-sm text-success">
                      {selectedVariant.stock} unidades disponibles
                    </p>
                  ) : null}
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Cantidad</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="h-10 w-10"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-2xl font-semibold w-12 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={incrementQuantity}
                    disabled={quantity >= maxQuantity || isOutOfStock}
                    className="h-10 w-10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={isAdding || justAdded || isOutOfStock || !selectedVariant}
                className="w-full h-12 text-lg"
                size="lg"
                variant={justAdded ? 'outline' : 'default'}
              >
                {justAdded ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Agregado al carrito
                  </>
                ) : isAdding ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Agregando...
                  </>
                ) : isOutOfStock ? (
                  'Agotado'
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Agregar al carrito - $
                    {((discountInfo?.discountedPrice || selectedVariant?.price || 0) *
                      quantity).toLocaleString()}
                  </>
                )}
              </Button>

              {/* Tiered Discount Table */}
              {tieredDiscount && tieredDiscount.tiers.length > 0 && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h3 className="font-semibold mb-3">Descuentos por cantidad</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio c/u</TableHead>
                        <TableHead>Descuento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tieredDiscount.tiers.map((tier, index) => {
                        const discountAmount =
                          tier.type === 'percentage'
                            ? (selectedVariant!.price * tier.value) / 100
                            : tier.value;
                        const finalPrice = selectedVariant!.price - discountAmount;

                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {tier.minQuantity}
                              {tier.maxQuantity ? `-${tier.maxQuantity}` : '+'} un
                            </TableCell>
                            <TableCell className="text-primary font-semibold">
                              ${finalPrice.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-success">
                              -{tier.value}
                              {tier.type === 'percentage' ? '%' : ' $'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {/* Description Tabs */}
          <Tabs defaultValue="description" className="mb-16">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="description">Descripción</TabsTrigger>
              <TabsTrigger value="info">Información</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="prose max-w-none mt-6">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {product.description}
              </p>
            </TabsContent>
            <TabsContent value="info" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedVariant?.sku && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">SKU</p>
                    <p className="text-lg">{selectedVariant.sku}</p>
                  </div>
                )}
                {typeof product.brand === 'object' && product.brand && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Marca
                    </p>
                    <p className="text-lg">{product.brand.name}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">
                También te puede interesar
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct._id}
                    product={relatedProduct}
                    variants={[]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
