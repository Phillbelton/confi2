'use client';

import Image from 'next/image';
import { Check, ShoppingCart, X } from 'lucide-react';
import { toast } from 'sonner';
import { getSafeImageUrl } from '@/lib/image-utils';
import { useUIStore } from '@/store/useUIStore';
import { useCartStore } from '@/store/useCartStore';
import type { ProductParent, ProductVariant } from '@/types';

interface CartToastContentProps {
  toastId: string | number;
  productName: string;
  variantLabel: string | null;
  imageSrc: string | null;
  quantity: number;
  pricePerUnit: number;
}

function CartToastContent({
  toastId,
  productName,
  variantLabel,
  imageSrc,
  quantity,
  pricePerUnit,
}: CartToastContentProps) {
  const openCartSheet = useUIStore((s) => s.openCartSheet);
  const totalItems = useCartStore((s) => s.itemCount);
  const totalLine = quantity * pricePerUnit;

  const handleViewCart = () => {
    openCartSheet();
    toast.dismiss(toastId);
  };

  return (
    <div
      className="
        relative flex w-[340px] max-w-[calc(100vw-2rem)] gap-3
        rounded-2xl border border-border bg-card p-3 pr-8 shadow-premium
        border-l-4 border-l-primary
      "
    >
      {/* Cerrar */}
      <button
        type="button"
        onClick={() => toast.dismiss(toastId)}
        aria-label="Cerrar"
        className="
          absolute top-2 right-2 h-6 w-6 flex items-center justify-center
          rounded-full text-muted-foreground hover:bg-muted hover:text-card-foreground
          transition-colors
        "
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Thumbnail con check overlay */}
      <div className="relative flex-shrink-0">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={productName}
              width={64}
              height={64}
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div
          className="
            absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full
            bg-primary text-primary-foreground flex items-center justify-center
            shadow-md ring-2 ring-card
          "
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-card-foreground leading-tight">
            ¡Agregado al carrito!
          </p>
          <p className="text-xs text-muted-foreground leading-snug line-clamp-1 mt-0.5">
            {quantity} × {productName}
            {variantLabel ? ` · ${variantLabel}` : ''}
          </p>
          <p className="font-sans text-sm font-bold text-primary mt-0.5">
            ${totalLine.toLocaleString('es-CL')}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={handleViewCart}
            className="
              flex-1 h-8 px-3 rounded-lg bg-primary text-primary-foreground
              text-xs font-semibold inline-flex items-center justify-center gap-1.5
              hover:bg-primary/90 active:scale-[0.98] transition-all
            "
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Ver carrito
            {totalItems > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/25 text-[10px] font-bold">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Muestra un toast de "agregado al carrito" con miniatura del producto
 * y botón directo para abrir el drawer del carrito.
 */
export function showCartToast({
  product,
  variant,
  quantity = 1,
  pricePerUnit,
  variantLabel,
}: {
  product: ProductParent;
  variant: ProductVariant;
  quantity?: number;
  /** Si se omite, usa variant.price */
  pricePerUnit?: number;
  /** Si se omite, se calcula desde variant.displayName / attributes */
  variantLabel?: string | null;
}) {
  const rawImage = variant.images?.[0] || product.images?.[0];
  const imageSrc = rawImage
    ? getSafeImageUrl(rawImage, { width: 128, height: 128, quality: 'auto' })
    : null;

  const resolvedLabel = (() => {
    if (variantLabel !== undefined) return variantLabel;
    if (!product.hasVariants) return null;
    if (variant.displayName) return variant.displayName;
    const attrs = Object.entries(variant.attributes || {})
      .map(([, v]) => v)
      .join(' - ');
    return attrs || variant.sku || null;
  })();

  toast.custom(
    (t) => (
      <CartToastContent
        toastId={t}
        productName={product.name}
        variantLabel={resolvedLabel}
        imageSrc={imageSrc}
        quantity={quantity}
        pricePerUnit={pricePerUnit ?? variant.price}
      />
    ),
    {
      duration: 4500,
      // sonner aplicará sus propios estilos de contenedor; el contenido controla el look
      unstyled: true,
    }
  );
}
