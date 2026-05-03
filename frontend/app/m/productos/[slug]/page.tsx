'use client';

import { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProductBySlug } from '@/hooks/useProducts';
import { useCartStoreM } from '@/store/m/useCartStoreM';
import { SaleUnitBadge } from '@/components/m/catalog/SaleUnitBadge';
import { Breadcrumbs } from '@/components/m/detail/Breadcrumbs';
import { useProductBreadcrumbs } from '@/hooks/useCatalogBreadcrumbs';
import {
  effectiveUnitPrice,
  getDisplayTiers,
  minQuantity,
  quantityStep,
  hasAnyDiscount,
  getBestDiscountPercent,
} from '@/lib/discountCalculator';
import { getSafeImageUrl } from '@/lib/image-utils';
import { cn } from '@/lib/utils';
import type { Brand, Category, Format, Flavor } from '@/types';

export default function ProductDetailPage() {
  const params = useParams();
  const sp = useSearchParams();
  const slug = params.slug as string;
  const { data, isLoading, error } = useProductBySlug(slug);
  const product = data?.product;

  // Contexto de navegación: ?from=querystring del catálogo origen
  const fromCtx = useMemo(() => {
    const raw = sp.get('from');
    if (!raw) return undefined;
    try {
      const params = new URLSearchParams(raw);
      return {
        categorySlug: params.get('categoria') || undefined,
        subcategorySlug: params.get('subcategoria') || undefined,
        collectionSlug: params.get('coleccion') || undefined,
      };
    } catch {
      return undefined;
    }
  }, [sp]);

  const breadcrumbs = useProductBreadcrumbs(product, fromCtx);

  const addItem = useCartStoreM((s) => s.addItem);
  const items = useCartStoreM((s) => s.items);

  const [quantity, setQuantity] = useState<number>(1);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-xl font-bold">Producto no encontrado</h1>
        <Button asChild className="mt-4 rounded-full">
          <Link href="/m/productos">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver al catálogo
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !product) {
    return (
      <div className="space-y-4 px-4 pt-4">
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const minQ = minQuantity(product);
  const step = quantityStep(product);
  const realQty = Math.max(quantity, minQ);
  const ppu = effectiveUnitPrice(product, realQty);
  const total = ppu * realQty;
  const tiers = getDisplayTiers(product);
  const discount = getBestDiscountPercent(product);

  // Initialize quantity to minQ
  if (quantity < minQ) setQuantity(minQ);

  const brandName = typeof product.brand === 'object' ? (product.brand as Brand)?.name : '';
  const formatLabel = typeof product.format === 'object' ? (product.format as Format)?.label : '';
  const flavorName = typeof product.flavor === 'object' ? (product.flavor as Flavor)?.name : '';
  const primaryCat = (product.categories as Category[] | undefined)?.[0];

  return (
    <>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} className="border-b border-border/60 bg-muted/30 lg:px-4" />
      )}

      <div className="lg:grid lg:grid-cols-[55%_1fr] lg:gap-8 lg:px-8 lg:pt-6">
        {/* Galería */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="relative aspect-square overflow-hidden bg-muted lg:rounded-2xl">
            {product.images?.[0] ? (
              <Image
                src={getSafeImageUrl(product.images[0], { width: 800, height: 800 })}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="grid h-full place-items-center text-6xl">🍭</div>
            )}
            {hasAnyDiscount(product) && discount > 0 && (
              <span className="absolute left-3 top-3 rounded-md bg-orange-500 px-2.5 py-1 text-sm font-bold uppercase text-white shadow">
                {discount}% dcto
              </span>
            )}
            <SaleUnitBadge saleUnit={product.saleUnit} className="bottom-3" />
          </div>
        </div>

        {/* Info */}
        <div className="px-4 pb-32 pt-4 lg:px-0 lg:pb-12 lg:pt-0">
          {brandName && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary lg:text-sm">
              {brandName}
            </p>
          )}
          <h1 className="mt-1 font-display text-xl font-bold leading-tight lg:text-3xl">
            {product.name}
          </h1>

          {(formatLabel || flavorName || primaryCat?.name) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {[primaryCat?.name, formatLabel, flavorName].filter(Boolean).join(' · ')}
            </p>
          )}

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums lg:text-4xl">
              ${Math.round(ppu).toLocaleString('es-CL')}
            </span>
            <span className="text-xs text-muted-foreground">por unidad</span>
            {ppu < product.unitPrice && (
              <span className="text-sm text-muted-foreground line-through tabular-nums">
                ${Math.round(product.unitPrice).toLocaleString('es-CL')}
              </span>
            )}
          </div>

          {/* Tabla de tramos */}
          {tiers.length > 0 && (
            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Mejor precio por mayor 🎉
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                <li className="flex justify-between">
                  <span>1 a {tiers[0].minQuantity - 1} unidades</span>
                  <span className="font-bold tabular-nums">
                    ${Math.round(product.unitPrice).toLocaleString('es-CL')}/u
                  </span>
                </li>
                {tiers.map((t, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      Desde {t.minQuantity} u{t.label ? ` (${t.label})` : ''}
                    </span>
                    <span className="font-bold text-primary tabular-nums">
                      ${Math.round(t.pricePerUnit).toLocaleString('es-CL')}/u
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Selector de cantidad */}
          <div className="mt-5">
            <p className="text-sm font-semibold mb-2">
              Cantidad{' '}
              <span className="text-xs text-muted-foreground">
                (mín. {minQ}{step > 1 ? `, de ${step} en ${step}` : ''})
              </span>
            </p>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-full bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(minQ, q - step))}
                  className="grid h-10 w-10 place-items-center rounded-full bg-background text-foreground shadow-sm hover:bg-muted disabled:opacity-40"
                  disabled={quantity <= minQ}
                  aria-label="Quitar"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 text-base font-bold tabular-nums">{realQty}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + step)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  aria-label="Agregar"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold tabular-nums">
                  ${Math.round(total).toLocaleString('es-CL')}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="mt-4 w-full rounded-full"
              onClick={() => addItem(product, realQty)}
            >
              Agregar al carrito
            </Button>
          </div>

          {/* Descripción */}
          <div className="mt-6 prose-sm">
            <h2 className="text-sm font-semibold mb-1">Descripción</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
