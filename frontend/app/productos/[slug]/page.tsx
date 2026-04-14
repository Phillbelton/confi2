'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ShoppingCart, Check, Minus, Plus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCardUnified } from '@/components/products/ProductCardUnified';
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
import type { ProductParent, ProductVariant, Brand } from '@/types';

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

  // Reset image index when variant changes
  useEffect(() => {
    setMainImageIndex(0);
  }, [selectedVariantId]);

  // Extract brand name
  const brandName =
    product?.brand && typeof product.brand === 'object'
      ? (product.brand as Brand).name
      : null;

  // Error handling
  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 theme-catalog bg-background flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="font-display text-2xl font-bold mb-2">Producto no encontrado</h1>
            <p className="text-muted-foreground mb-4">
              El producto que buscas no existe o ha sido eliminado.
            </p>
            <Button asChild className="h-12">
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
        <main className="flex-1 theme-catalog bg-background">
          <div className="container px-4 py-8 md:px-6 md:py-12">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid lg:grid-cols-2 gap-8">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-3/4" />
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

  // Get images
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

  const getApplicableDiscount = () => {
    if (!selectedVariant) return null;

    let totalDiscount = 0;
    let currentPrice = selectedVariant.price;
    const discountDetails: string[] = [];

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
      currentPrice -= fixedDiscountAmount;
    }

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
          tierDiscountAmount = (currentPrice * applicableTier.value) / 100;
          discountDetails.push(`-${applicableTier.value}% por cantidad`);
        } else {
          tierDiscountAmount = applicableTier.value;
          discountDetails.push(`-$${tierDiscountAmount.toLocaleString()} por cantidad`);
        }
        totalDiscount += tierDiscountAmount;
        currentPrice -= tierDiscountAmount;
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
  const displayPrice = discount ? discount.finalPrice : selectedVariant?.price || 0;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

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
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 theme-catalog bg-background">
        {/* Add bottom padding on mobile to account for sticky CTA bar */}
        <div className="container px-4 py-6 md:py-12 pb-28 lg:pb-12">
          {/* Breadcrumb */}
          <div className="mb-4 md:mb-6">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground h-10">
              <Link href="/productos">
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                Volver a productos
              </Link>
            </Button>
          </div>

          {/* Product Details Grid */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 mb-12 lg:mb-16">
            {/* Images */}
            <div className="space-y-3">
              {/* Main Image */}
              <div className="aspect-square relative overflow-hidden rounded-lg bg-white border border-border shadow-sm">
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                {/* Fixed Discount Badge — top left */}
                {hasFixedDiscount && selectedVariant && (
                  <div className="absolute top-3 left-3 z-10">
                    <div className="text-white font-bold text-xs brush-badge">
                      {selectedVariant.fixedDiscount?.badge ||
                        (selectedVariant.fixedDiscount!.type === 'percentage'
                          ? `-${selectedVariant.fixedDiscount!.value}%`
                          : `-$${selectedVariant.fixedDiscount!.value.toLocaleString()}`)}
                    </div>
                  </div>
                )}

                {/* Featured Badge */}
                {product.featured && (
                  <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground z-10">
                    Destacado
                  </Badge>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setMainImageIndex(index)}
                      className={`aspect-square relative overflow-hidden rounded-md border-2 transition-all min-h-[48px] ${
                        index === mainImageIndex
                          ? 'border-primary shadow-sm'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} - imagen ${index + 1}`}
                        fill
                        className="object-contain bg-white p-1"
                        sizes="(max-width: 1024px) 25vw, 12.5vw"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4 md:space-y-5">
              {/* Brand */}
              {brandName && (
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {brandName}
                </span>
              )}

              {/* Title */}
              <div>
                <h1 className="font-display text-xl md:text-3xl font-bold tracking-tight text-foreground">
                  {product.name}
                </h1>
                {selectedVariant?.displayName && product.hasVariants && (
                  <p className="font-display text-sm md:text-lg text-muted-foreground mt-1">
                    {selectedVariant.displayName}
                  </p>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Variant Selector */}
              {product.hasVariants && variants.length > 0 && (
                <div>
                  <label className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Variante
                  </label>
                  <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                    <SelectTrigger className="h-12 bg-card border-border text-foreground text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {variants.map((variant) => (
                        <SelectItem
                          key={variant._id}
                          value={variant._id}
                          className="text-popover-foreground h-11"
                        >
                          {variant.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Price Block */}
              {selectedVariant && (
                <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-sans text-2xl md:text-3xl font-bold text-primary" suppressHydrationWarning>
                      ${discount ? discount.finalPrice.toLocaleString('es-CL') : selectedVariant.price.toLocaleString('es-CL')}
                    </span>
                    {discount && (
                      <span className="text-handwriting text-lg md:text-xl text-muted-foreground line-through" suppressHydrationWarning>
                        ${selectedVariant.price.toLocaleString('es-CL')}
                      </span>
                    )}
                  </div>

                  {discount && (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="bg-accent/10 text-accent border border-accent/20 text-xs font-bold px-2 py-1 rounded-md">
                        {discount.details}
                      </div>
                      <span className="text-sm text-emerald-600 font-medium" suppressHydrationWarning>
                        Ahorras ${discount.totalSavings.toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}

                  {selectedVariant.compareAtPrice && (
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      Precio de lista: ${selectedVariant.compareAtPrice.toLocaleString('es-CL')}
                    </p>
                  )}
                </div>
              )}

              {/* Tiered Discounts Table */}
              {hasVariantTieredDiscount && selectedVariant && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2.5 border-b border-border">
                    <p className="font-sans text-xs font-semibold uppercase tracking-wider text-foreground">
                      {selectedVariant.tieredDiscount?.badge || 'Descuentos por cantidad'}
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {selectedVariant.tieredDiscount!.tiers.map((tier, index) => {
                      let basePrice = selectedVariant.price;
                      if (hasFixedDiscount) {
                        if (selectedVariant.fixedDiscount!.type === 'percentage') {
                          basePrice -= (basePrice * selectedVariant.fixedDiscount!.value) / 100;
                        } else {
                          basePrice -= selectedVariant.fixedDiscount!.value;
                        }
                      }

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
                          className="flex items-center justify-between px-4 py-3 text-sm"
                        >
                          <span className="text-muted-foreground">
                            {tier.maxQuantity
                              ? `${tier.minQuantity}–${tier.maxQuantity} un`
                              : `${tier.minQuantity}+ un`}
                          </span>
                          <span className="font-sans font-bold text-foreground" suppressHydrationWarning>
                            ${finalPrice.toLocaleString('es-CL')} c/u
                          </span>
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            -{tier.type === 'percentage' ? `${tier.value}%` : `$${tier.value}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity + Add to Cart — DESKTOP ONLY (hidden on mobile, shown in sticky bar) */}
              {selectedVariant && (
                <div className="hidden lg:flex items-center gap-3">
                  {/* Quantity Selector */}
                  <div className="flex items-center border border-border rounded-lg h-12">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="flex items-center justify-center w-12 h-full text-foreground hover:bg-muted transition-colors disabled:opacity-40 rounded-l-lg"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-sans w-10 text-center font-bold text-foreground">{quantity}</span>
                    <button
                      onClick={incrementQuantity}
                      className="flex items-center justify-center w-12 h-full text-foreground hover:bg-muted transition-colors rounded-r-lg"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={isAdding || justAdded || !selectedVariant}
                    className="flex-1 h-12 font-display font-bold text-base rounded-lg bg-primary hover:bg-primary/90 text-white transition-all active:scale-[0.98]"
                    size="lg"
                  >
                    {justAdded ? (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Agregado
                      </>
                    ) : isAdding ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Agregar al carrito
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Additional Info */}
              {selectedVariant && (
                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU</span>
                    <span className="font-sans font-medium text-foreground">{selectedVariant.sku}</span>
                  </div>
                  {selectedVariant.weight && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso</span>
                      <span className="font-sans font-medium text-foreground">{selectedVariant.weight}g</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-border pt-8 lg:pt-10">
              <h2 className="font-display text-lg md:text-2xl font-bold text-foreground mb-4 md:mb-6">
                Productos relacionados
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {relatedProducts.map((relatedProduct: ProductParent) => (
                  <ProductCardUnified
                    key={relatedProduct._id}
                    product={relatedProduct}
                    autoFetchVariants
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Sticky CTA Bar — only visible on mobile/tablet */}
      {selectedVariant && (
        <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-card border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.08)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            {/* Price */}
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-lg font-bold text-primary leading-tight" suppressHydrationWarning>
                ${displayPrice.toLocaleString('es-CL')}
              </span>
              {discount && (
                <span className="text-handwriting text-sm text-muted-foreground line-through leading-tight" suppressHydrationWarning>
                  ${selectedVariant.price.toLocaleString('es-CL')}
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center border border-border rounded-lg h-12">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="flex items-center justify-center w-10 h-full text-foreground hover:bg-muted transition-colors disabled:opacity-40 rounded-l-lg"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-sans w-8 text-center font-bold text-foreground text-sm">{quantity}</span>
              <button
                onClick={incrementQuantity}
                className="flex items-center justify-center w-10 h-full text-foreground hover:bg-muted transition-colors rounded-r-lg"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleAddToCart}
              disabled={isAdding || justAdded || !selectedVariant}
              className="flex-1 h-12 font-display font-bold text-sm rounded-lg bg-primary hover:bg-primary/90 text-white transition-all active:scale-[0.98]"
            >
              {justAdded ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" />
                  Agregado
                </>
              ) : isAdding ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <ShoppingCart className="mr-1.5 h-4 w-4" />
                  Agregar
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
