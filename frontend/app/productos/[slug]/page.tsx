'use client';

import { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProductBySlug, useProducts, useProductVariants } from '@/hooks/useProducts';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'sonner';
import type { ProductParent, ProductVariant } from '@/types';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Fetch product by slug
  const { data: productData, isLoading: productLoading, error } = useProductBySlug(slug);
  const product = productData?.data;

  // Fetch variants
  const { data: variantsData, isLoading: variantsLoading } = useProductVariants(
    product?._id || ''
  );
  const variants = variantsData?.data || [];

  // Extract category IDs for related products
  const categoryIds = product?.categories
    ? typeof product.categories[0] === 'string'
      ? product.categories
      : product.categories.map((c: any) => c._id)
    : [];

  // Fetch related products (same categories)
  const { data: relatedData } = useProducts({
    categories: categoryIds,
    limit: 4,
  });

  // FIX: Correct access to the nested data structure
  // relatedData.data is ApiPaginatedResponse which has { data, pagination }
  // So we need relatedData.data.data to get the array
  const relatedProducts = relatedData?.data?.data?.filter((p: ProductParent) => p._id !== product?._id) || [];

  // State
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  // Set first variant as selected when variants load
  useEffect(() => {
    if (variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(variants[0]._id);
    }
  }, [variants, selectedVariantId]);

  // Reset image index when variant changes (to avoid out of bounds index)
  useEffect(() => {
    setMainImageIndex(0);
  }, [selectedVariantId]);

  // Error handling
  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Producto no encontrado</h1>
            <p className="text-muted-foreground mb-4">
              El producto que buscas no existe o ha sido eliminado.
            </p>
            <Button asChild>
              <Link href="/productos">Ver todos los productos</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading state
  if (productLoading || !product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container px-4 py-8 md:px-6 md:py-12">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid lg:grid-cols-2 gap-8">
              <Skeleton className="aspect-square w-full" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedVariant = variants.find((v) => v._id === selectedVariantId) || variants[0];
  const isOutOfStock = selectedVariant && selectedVariant.stock === 0;
  const maxQuantity = selectedVariant?.allowBackorder ? 999 : (selectedVariant?.stock || 0);

  // Get images: use variant images if available, otherwise use parent images
  const allImages = (selectedVariant?.images && selectedVariant.images.length > 0
    ? selectedVariant.images
    : product.images || []
  ).filter(Boolean);

  const mainImage = allImages[mainImageIndex] || '/placeholder-product.svg';

  // Check for active discounts
  const hasFixedDiscount = selectedVariant?.fixedDiscount?.enabled &&
    (!selectedVariant.fixedDiscount.startDate || new Date(selectedVariant.fixedDiscount.startDate) <= new Date()) &&
    (!selectedVariant.fixedDiscount.endDate || new Date(selectedVariant.fixedDiscount.endDate) >= new Date());

  const hasVariantTieredDiscount = selectedVariant?.tieredDiscount?.active &&
    selectedVariant.tieredDiscount.tiers.length > 0 &&
    (!selectedVariant.tieredDiscount.startDate || new Date(selectedVariant.tieredDiscount.startDate) <= new Date()) &&
    (!selectedVariant.tieredDiscount.endDate || new Date(selectedVariant.tieredDiscount.endDate) >= new Date());

  const hasParentTieredDiscount = product.tieredDiscounts?.some(
    (d) => d.active && (!d.endDate || new Date(d.endDate) > new Date())
  );

  const getApplicableDiscount = () => {
    if (!selectedVariant) return null;

    let totalDiscount = 0;
    let currentPrice = selectedVariant.price; // Track current price as discounts are applied
    const discountDetails: string[] = [];

    // 1. Apply fixed discount
    if (hasFixedDiscount) {
      let fixedDiscountAmount = 0;
      if (selectedVariant.fixedDiscount!.type === 'percentage') {
        fixedDiscountAmount = (currentPrice * selectedVariant.fixedDiscount!.value) / 100;
        discountDetails.push(`-${selectedVariant.fixedDiscount!.value}% fijo`);
      } else {
        fixedDiscountAmount = selectedVariant.fixedDiscount!.value;
        discountDetails.push(`-$${fixedDiscountAmount.toLocaleString()} fijo`);
      }
      totalDiscount += fixedDiscountAmount;
      currentPrice -= fixedDiscountAmount; // Update price after fixed discount
    }

    // 2. Apply variant tiered discount ON THE DISCOUNTED PRICE
    if (hasVariantTieredDiscount) {
      const applicableTier = [...selectedVariant.tieredDiscount!.tiers]
        .sort((a, b) => b.minQuantity - a.minQuantity)
        .find(
          (tier) =>
            quantity >= tier.minQuantity &&
            (tier.maxQuantity === null || quantity <= tier.maxQuantity)
        );

      if (applicableTier) {
        let tierDiscountAmount = 0;
        if (applicableTier.type === 'percentage') {
          // Apply percentage on current price (after fixed discount)
          tierDiscountAmount = (currentPrice * applicableTier.value) / 100;
          discountDetails.push(`-${applicableTier.value}% por cantidad`);
        } else {
          tierDiscountAmount = applicableTier.value;
          discountDetails.push(`-$${tierDiscountAmount.toLocaleString()} por cantidad`);
        }
        totalDiscount += tierDiscountAmount;
        currentPrice -= tierDiscountAmount; // Update price after tiered discount
      }
    }

    // 3. Apply parent tiered discount (legacy, only if no other discounts)
    if (totalDiscount === 0 && hasParentTieredDiscount) {
      const discount = product.tieredDiscounts.find((d) => d.active);
      if (discount) {
        const applicableTier = [...discount.tiers]
          .sort((a, b) => b.minQuantity - a.minQuantity)
          .find(
            (tier) =>
              quantity >= tier.minQuantity &&
              (tier.maxQuantity === null || quantity <= tier.maxQuantity)
          );

        if (applicableTier) {
          const tierDiscountAmount = (selectedVariant.price * applicableTier.value) / 100;
          totalDiscount += tierDiscountAmount;
          discountDetails.push(`-${applicableTier.value}% por cantidad`);
        }
      }
    }

    if (totalDiscount === 0) return null;

    const finalPrice = selectedVariant.price - totalDiscount;

    return {
      discountAmount: totalDiscount,
      finalPrice,
      totalSavings: totalDiscount * quantity,
      details: discountDetails.join(' + '),
    };
  };

  const discount = getApplicableDiscount();

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock) return;

    setIsAdding(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      addItem(product, selectedVariant, quantity);

      setJustAdded(true);
      toast.success('Producto agregado al carrito', {
        description: `${quantity}x ${product.name} ${
          product.hasVariants ? `- ${selectedVariant.displayName}` : ''
        }`,
      });

      setTimeout(() => setJustAdded(false), 2000);
    } catch (error) {
      toast.error('Error al agregar el producto');
    } finally {
      setIsAdding(false);
    }
  };

  const incrementQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/productos">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Volver a productos
              </Link>
            </Button>
          </div>

          {/* Product Details Grid */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.featured && (
                    <Badge className="bg-secondary text-secondary-foreground">
                      Destacado
                    </Badge>
                  )}
                  {isOutOfStock && <Badge variant="destructive">Agotado</Badge>}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setMainImageIndex(index)}
                      className={`aspect-square relative overflow-hidden rounded-md border-2 transition-all ${
                        index === mainImageIndex
                          ? 'border-primary'
                          : 'border-transparent hover:border-muted-foreground'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} - imagen ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 25vw, 12.5vw"
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
                <p className="text-sm text-muted-foreground">{product.brand.name}</p>
              )}

              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {product.name}
                </h1>
                {selectedVariant?.displayName && product.hasVariants && (
                  <p className="text-lg text-muted-foreground">
                    {selectedVariant.displayName}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">{product.description}</p>
              </div>

              {/* Variant Selector */}
              {product.hasVariants && variants.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Seleccionar variante:
                  </label>
                  <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {variants.map((variant) => (
                        <SelectItem
                          key={variant._id}
                          value={variant._id}
                          disabled={variant.stock === 0}
                        >
                          {variant.displayName} - ${variant.price.toLocaleString()}
                          {variant.stock === 0 && ' (Agotado)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Price */}
              {selectedVariant && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-primary">
                      ${discount ? discount.finalPrice.toLocaleString() : selectedVariant.price.toLocaleString()}
                    </span>
                    {discount && (
                      <span className="text-lg text-muted-foreground line-through">
                        ${selectedVariant.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {discount && (
                    <div className="space-y-1">
                      <Badge className="bg-accent text-accent-foreground">
                        {discount.details}
                      </Badge>
                      <p className="text-sm text-success">
                        Ahorras ${discount.totalSavings.toLocaleString()} en total
                      </p>
                    </div>
                  )}

                  {selectedVariant.compareAtPrice && (
                    <p className="text-sm text-muted-foreground">
                      Precio de lista: ${selectedVariant.compareAtPrice.toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Fixed Discount Info */}
              {hasFixedDiscount && selectedVariant && (
                <div className="border rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm">
                    {selectedVariant.fixedDiscount?.badge || 'Descuento especial'}
                  </p>
                  <div className="text-sm text-muted-foreground">
                    {selectedVariant.fixedDiscount!.type === 'percentage'
                      ? `-${selectedVariant.fixedDiscount!.value}% de descuento`
                      : `-$${selectedVariant.fixedDiscount!.value.toLocaleString()} de descuento`}
                  </div>
                </div>
              )}

              {/* Variant Tiered Discounts Info */}
              {hasVariantTieredDiscount && selectedVariant && (
                <div className="border rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm">
                    {selectedVariant.tieredDiscount?.badge || 'Descuentos por cantidad:'}
                  </p>
                  <div className="space-y-1">
                    {selectedVariant.tieredDiscount!.tiers.map((tier, index) => {
                      // Calculate base price after fixed discount (if any)
                      let basePrice = selectedVariant.price;
                      if (hasFixedDiscount) {
                        if (selectedVariant.fixedDiscount!.type === 'percentage') {
                          basePrice -= (basePrice * selectedVariant.fixedDiscount!.value) / 100;
                        } else {
                          basePrice -= selectedVariant.fixedDiscount!.value;
                        }
                      }

                      // Apply tiered discount on the base price (after fixed discount)
                      let discountAmount = 0;
                      if (tier.type === 'percentage') {
                        discountAmount = (basePrice * tier.value) / 100;
                      } else {
                        discountAmount = tier.value;
                      }
                      const finalPrice = basePrice - discountAmount;

                      return (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {tier.maxQuantity
                              ? `${tier.minQuantity}-${tier.maxQuantity} un`
                              : `${tier.minQuantity}+ un`}
                          </span>
                          <span className="font-semibold">
                            ${finalPrice.toLocaleString()} c/u
                          </span>
                          <span className="text-success">
                            -{tier.type === 'percentage' ? `${tier.value}%` : `$${tier.value}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Parent Tiered Discounts Info (legacy) */}
              {!hasFixedDiscount && !hasVariantTieredDiscount && hasParentTieredDiscount && selectedVariant && (
                <div className="border rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm">Descuentos por cantidad:</p>
                  <div className="space-y-1">
                    {product.tieredDiscounts
                      .find((d) => d.active)
                      ?.tiers.map((tier, index) => {
                        const discountAmount = (selectedVariant.price * tier.value) / 100;
                        const finalPrice = selectedVariant.price - discountAmount;

                        return (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {tier.maxQuantity
                                ? `${tier.minQuantity}-${tier.maxQuantity} un`
                                : `${tier.minQuantity}+ un`}
                            </span>
                            <span className="font-semibold">
                              ${finalPrice.toLocaleString()} c/u
                            </span>
                            <span className="text-success">-{tier.value}%</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Stock info */}
              {selectedVariant && selectedVariant.isLowStock && !isOutOfStock && (
                <p className="text-sm text-amber-600">
                  ¡Últimas {selectedVariant.stock} unidades disponibles!
                </p>
              )}

              {/* Quantity Selector */}
              {selectedVariant && !isOutOfStock && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Cantidad:</label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={incrementQuantity}
                        disabled={quantity >= maxQuantity}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {maxQuantity} disponibles
                    </span>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={isAdding || justAdded || isOutOfStock || !selectedVariant}
                className="w-full h-12 text-lg"
                size="lg"
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
                    Agregar al carrito
                  </>
                )}
              </Button>

              {/* Additional Info */}
              {selectedVariant && (
                <div className="border-t pt-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-medium">{selectedVariant.sku}</span>
                  </div>
                  {selectedVariant.weight && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso:</span>
                      <span className="font-medium">{selectedVariant.weight}g</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Productos relacionados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct: ProductParent) => (
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
