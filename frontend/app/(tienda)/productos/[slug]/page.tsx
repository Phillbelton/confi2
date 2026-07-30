'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Minus, Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProductBySlug } from '@/hooks/useProducts';
import { useCartStoreM, cartLineId } from '@/store/m/useCartStoreM';
import { showCartToast } from '@/components/m/shell/cart-toast-m';
import { SaleUnitBadge } from '@/components/m/catalog/SaleUnitBadge';
import { Breadcrumbs } from '@/components/m/detail/Breadcrumbs';
import { ProductGalleryM } from '@/components/m/detail/ProductGalleryM';
import { RelatedProducts } from '@/components/m/detail/RelatedProducts';
import { useProductBreadcrumbs } from '@/hooks/useCatalogBreadcrumbs';
import {
  effectiveUnitPrice,
  discountedUnitPrice,
  getDisplayTiers,
  getPrincipal,
  isPackagedSale,
  minQuantity,
  orderedPresentations,
  presLabel,
  presentationPriceSuffix,
  pricePerSaleUnitSuffix,
  quantityStep,
  saleUnitNoun,
  getFixedDiscountBadge,
  hasActiveFixedDiscount,
} from '@/lib/discountCalculator';
import { businessWhatsappHref } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';
import type { Brand, Category, Format, Flavor, Product } from '@/types';

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
  const [selPresId, setSelPresId] = useState<string>(''); // '' = presentación principal
  // Feedback transitorio del botón tras agregar ("¡Agregado!").
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    []
  );

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-xl font-bold">Producto no encontrado</h1>
        <Button asChild className="mt-4 rounded-full">
          <Link href="/productos">
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

  // Presentación elegida (selPresId '' = principal). El `viewProduct` es el
  // producto con los campos de precio/presentación de la elegida → todas las
  // funciones de precio existentes lo usan sin cambios.
  // Mismo orden canónico que la card del catálogo (unidad → display → embalaje):
  // el chip preseleccionado lo sigue definiendo `getPrincipal`, no la posición.
  const presentations = orderedPresentations(product);
  const selPres = presentations.find((p) => p._id === selPresId) ?? getPrincipal(product);
  const viewProduct: Product = selPres
    ? {
        ...product,
        saleUnit: { type: selPres.type, quantity: selPres.quantity },
        unitPrice: selPres.unitPrice,
        tiers: selPres.tiers,
        fixedDiscount: selPres.fixedDiscount,
      }
    : product;

  const minQ = minQuantity(viewProduct);
  const step = quantityStep(viewProduct);
  const realQty = Math.max(quantity, minQ);
  // ppu = precio efectivo por PRESENTACIÓN (ya no por unidad atómica).
  const ppu = effectiveUnitPrice(viewProduct, realQty);
  const total = ppu * realQty;
  const tiers = getDisplayTiers(viewProduct);
  // Precio base por presentación (con la oferta fija ya aplicada).
  const basePrice = discountedUnitPrice(viewProduct);
  const showFixedBadge = hasActiveFixedDiscount(viewProduct);
  const fixedBadgeText = showFixedBadge ? getFixedDiscountBadge(viewProduct) : '';
  const isPackaged = isPackagedSale(viewProduct);
  // Sufijo y sustantivo de la unidad de venta ("c/display", "3 displays"):
  // los montos son por presentación, no por unidad atómica.
  const perUnitSuffix = pricePerSaleUnitSuffix(viewProduct);
  // Fila base de la tabla de tramos. Con el primer tramo en 2 no corresponde
  // "1 a 1": queda en singular.
  const baseRangeCount = tiers.length > 0 ? tiers[0].minQuantity - 1 : 1;
  const baseRangeLabel =
    baseRangeCount <= 1
      ? `1 ${saleUnitNoun(viewProduct, 1)}`
      : `1 a ${baseRangeCount} ${saleUnitNoun(viewProduct, baseRangeCount)}`;
  // Precio principal: ya está en precio de presentación, no se multiplica.
  const headlinePrice = ppu;
  const headlineCompareAt = viewProduct.unitPrice;
  // Precio por unidad atómica (informativo, solo display/embalaje).
  const ppuAtomic = isPackaged && viewProduct.saleUnit.quantity > 0
    ? ppu / viewProduct.saleUnit.quantity
    : ppu;

  // Initialize quantity to minQ
  if (quantity < minQ) setQuantity(minQ);

  // Cantidad de ESTA línea (producto + presentación elegida) ya en el carrito.
  // El selector de cantidad expresa "cuánto AGREGAR"; esto muestra lo que ya hay
  // para que no se lea como "cuánto tendré" (agregar 5 y luego 8 daba 13, no 8).
  const inCart = items.find((i) => i.lineId === cartLineId(product._id, selPres?._id ?? ''))?.quantity || 0;

  const handleAdd = () => {
    addItem(product, realQty, selPres?._id);
    showCartToast({
      productName: product.name,
      variantName: presentations.length > 1 && selPres ? presLabel(selPres) : undefined,
      image: product.images?.[0] ?? '',
      quantity: realQty,
      inCartQty: inCart + realQty,
    });
    // El selector vuelve al mínimo: siempre significa "cuánto agregar ahora".
    setQuantity(minQ);
    setJustAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAdded(false), 1500);
  };

  // Contenido compartido entre el botón principal y la CTA sticky móvil.
  const addBtnContent = justAdded ? (
    <span className="stepper-bump inline-flex items-center gap-1.5">
      <Check className="h-4 w-4" strokeWidth={3} />
      ¡Agregado!
    </span>
  ) : inCart > 0 ? (
    // Ya hay unidades en el carrito → explicitar que se SUMAN.
    `Agregar ${realQty} más`
  ) : (
    'Agregar al carrito'
  );

  // Mensaje pre-cargado del botón de WhatsApp. La URL se arma con la env
  // (horneada en el build) y no con `window.location`, para que el href sea
  // idéntico en el HTML del servidor y en la hidratación.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const waMessage = [
    `¡Hola! Quiero consultar por ${product.name}`,
    product.sku ? `Código: ${product.sku}` : '',
    presentations.length > 1 && selPres ? `Presentación: ${presLabel(selPres)}` : '',
    siteUrl ? `${siteUrl}/productos/${product.slug}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const brandName = typeof product.brand === 'object' ? (product.brand as Brand)?.name : '';
  const formatLabel = typeof product.format === 'object' ? (product.format as Format)?.label : '';
  const flavorName = (() => {
    const list = (product.flavors ?? [])
      .map((f) => (typeof f === 'object' ? (f as Flavor)?.name : ''))
      .filter(Boolean);
    if (list.length > 0) return list.join(', ');
    return typeof product.flavor === 'object' ? (product.flavor as Flavor)?.name ?? '' : '';
  })();
  const primaryCat = (product.categories as Category[] | undefined)?.[0];

  return (
    <>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} className="border-b border-border/60 bg-muted/30 lg:px-4" />
      )}

      {/* Galería acotada a 480px: antes la columna era 55% del ancho y con
          `aspect-square` daba una imagen de 699×699 en 1440×900 (78% del alto
          de pantalla), que empujaba precio y CTA fuera de la primera vista. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:px-8 lg:pt-6">
        {/* Galería */}
        <div className="lg:sticky lg:top-32">
          <ProductGalleryM images={product.images ?? []} alt={product.name}>
            {showFixedBadge && (
              <span className="absolute left-3 top-3 rounded-md bg-orange-500 px-2.5 py-1 text-sm font-bold uppercase text-white shadow">
                {fixedBadgeText}
              </span>
            )}
            <SaleUnitBadge saleUnit={viewProduct.saleUnit} className="bottom-3" />
          </ProductGalleryM>
        </div>

        {/* Info */}
        <div className="px-4 pb-8 pt-4 lg:px-0 lg:pb-12 lg:pt-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {brandName && (
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary lg:text-sm">
                {brandName}
              </p>
            )}
            {/* El SKU es la identidad que usa el cliente mayorista al pedir. */}
            {product.sku && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground lg:text-[11px]">
                {product.sku}
              </span>
            )}
          </div>
          <h1 className="mt-1 font-display text-xl font-bold leading-tight lg:text-3xl">
            {product.name}
          </h1>

          {(formatLabel || flavorName || primaryCat?.name) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {[primaryCat?.name, formatLabel, flavorName].filter(Boolean).join(' · ')}
            </p>
          )}

          {presentations.length > 1 && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                Elige presentación
              </p>
              <div className="flex gap-2 lg:flex-wrap" data-testid="pdp-presentations">
                {presentations.map((p) => {
                  const active = (selPres?._id ?? '') === p._id;
                  return (
                    <button
                      key={p._id}
                      type="button"
                      aria-pressed={active}
                      // Ancla del orden canónico para e2e: el label visible es
                      // libre ("Caja de 72 un."), el tipo no.
                      data-pres-type={p.type}
                      onClick={() => {
                        setSelPresId(p._id);
                        // La cantidad es POR presentación: cambiar de chip la
                        // reinicia a su mínimo (igual que el quick-sheet).
                        setQuantity(1);
                      }}
                      className={cn(
                        'flex-1 min-w-0 lg:flex-none rounded-xl border px-2.5 py-2 text-left transition-all',
                        active
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      <span className="block text-sm font-semibold leading-tight">{presLabel(p)}</span>
                      <span className="block text-xs tabular-nums text-muted-foreground">
                        ${Math.round(p.unitPrice).toLocaleString('es-CL')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold tabular-nums lg:text-4xl">
              ${Math.round(headlinePrice).toLocaleString('es-CL')}
            </span>
            <span className="text-xs text-muted-foreground">
              {presentationPriceSuffix(viewProduct)}
            </span>
            {headlinePrice < headlineCompareAt && (
              <span className="text-sm text-muted-foreground line-through tabular-nums">
                ${Math.round(headlineCompareAt).toLocaleString('es-CL')}
              </span>
            )}
          </div>
          {isPackaged && (
            <p className="mt-1 text-xs text-muted-foreground">
              Equivale a ${Math.round(ppuAtomic).toLocaleString('es-CL')} por unidad
            </p>
          )}

          {/* Tabla de tramos. ⚠️ Las cantidades y los precios son POR
              PRESENTACIÓN: en un display de 12, "3" son 3 displays y el precio
              es por display. Decía "unidades" y "/u" fijo, o sea mostraba el
              precio del display como si fuera el de la unidad suelta. */}
          {tiers.length > 0 && (
            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Mejor precio por mayor 🎉
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                <li className="flex justify-between gap-2">
                  <span>{baseRangeLabel}</span>
                  <span className="shrink-0 font-bold tabular-nums">
                    ${Math.round(basePrice).toLocaleString('es-CL')} {perUnitSuffix}
                  </span>
                </li>
                {tiers.map((t, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>
                      Desde {t.minQuantity} {saleUnitNoun(viewProduct, t.minQuantity)}
                      {t.label ? ` (${t.label})` : ''}
                    </span>
                    <span className="shrink-0 font-bold text-primary tabular-nums">
                      ${Math.round(t.pricePerUnit).toLocaleString('es-CL')} {perUnitSuffix}
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
              {/* Solo cuando dice algo: con mín. 1 y paso 1 (el caso normal) el
                  paréntesis era ruido en todas las fichas. */}
              {(minQ > 1 || step > 1) && (
                <span className="text-xs text-muted-foreground">
                  (mín. {minQ}
                  {step > 1 ? `, de ${step} en ${step}` : ''})
                </span>
              )}
              {inCart > 0 && (
                <span
                  key={inCart}
                  className="stepper-bump ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary tabular-nums"
                >
                  En el carrito: {inCart}
                </span>
              )}
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
            <Button size="lg" className="mt-4 w-full rounded-full" onClick={handleAdd}>
              {addBtnContent}
            </Button>

            {/* WhatsApp es el canal real del negocio: dudas de stock, precios
                por volumen mayores al último tramo, despacho. El mensaje lleva
                producto, SKU y presentación elegida para no empezar de cero. */}
            <a
              href={businessWhatsappHref(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <MessageCircle className="h-4 w-4" />
              Consultar por WhatsApp
            </a>
          </div>

          {/* Descripción */}
          {product.description?.trim() && (
            <div className="mt-6">
              <h2 className="mb-1 text-sm font-semibold">Descripción</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <RelatedProducts product={product} />

      {/* CTA sticky móvil: total de la selección + agregar sin scrollear de
          vuelta. Solo <lg (en desktop la columna de info queda a la vista).
          El colchón de cierre lo pone el footer vía `stickyBarClearance`. */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 px-4 pt-2.5 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-card/85 pb-[max(0.625rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex w-full max-w-screen-md items-center gap-3">
          <div className="min-w-0 shrink-0">
            <p className="text-[11px] leading-tight text-muted-foreground">
              {/* selPres puede faltar en productos legacy sin presentaciones[]
                  → cae al sufijo derivado del saleUnit ("por unidad", …). */}
              Total · {realQty} ×{' '}
              {selPres ? presLabel(selPres).toLowerCase() : presentationPriceSuffix(viewProduct)}
            </p>
            <p className="text-lg font-bold leading-tight tabular-nums">
              ${Math.round(total).toLocaleString('es-CL')}
            </p>
          </div>
          <Button size="lg" className="min-w-0 flex-1 rounded-full" onClick={handleAdd}>
            {addBtnContent}
          </Button>
        </div>
      </div>
    </>
  );
}
