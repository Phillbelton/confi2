'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Check, MessageCircle, TrendingDown } from 'lucide-react';
import { api } from '@/lib/axios';
import { businessWhatsappHref } from '@/lib/whatsapp';
import { formatCurrency, cn } from '@/lib/utils';
import type { ApiResponse, HomeSectionConfig, Product, Presentation } from '@/types';

/**
 * "Tu precio baja solo" — la escalera de precios por volumen, con datos REALES
 * de un producto del catálogo. Es la prueba del diferencial del negocio
 * (descuentos automáticos por mayor), que antes vivía como un texto genérico.
 *
 * El producto se fija por SKU desde /admin/banners; si no hay uno configurado
 * o el configurado ya no tiene tramos, cae al primer producto activo con
 * tramos — la sección nunca queda vacía ni muestra precios inventados.
 */

interface Step {
  label: string;
  price: number;
  /** Ahorro total al comprar exactamente esa cantidad, contra el precio base. */
  saving: number;
  qty: number;
}

function useLadderProduct(sku?: string) {
  return useQuery({
    queryKey: ['home', 'wholesale-ladder', sku ?? 'auto'],
    queryFn: async (): Promise<Product | null> => {
      // 1) Producto fijado por el admin
      if (sku) {
        const { data } = await api.get<ApiResponse<{ data: Product[] }>>('/products', {
          params: { search: sku, limit: 5 },
        });
        const exact = (data.data?.data ?? []).find((p) => p.sku === sku);
        if (exact && hasTiers(exact)) return exact;
      }
      // 2) Fallback: primer producto popular con tramos
      const { data } = await api.get<ApiResponse<{ data: Product[] }>>('/products', {
        params: { sort: 'popular', limit: 20 },
      });
      return (data.data?.data ?? []).find(hasTiers) ?? null;
    },
    staleTime: 5 * 60_000,
  });
}

function principalOf(p: Product): Presentation | undefined {
  return (p.presentaciones ?? []).find((x) => x.principal) ?? p.presentaciones?.[0];
}

function hasTiers(p: Product): boolean {
  return (principalOf(p)?.tiers?.length ?? 0) > 0;
}

/** Arma la escalera: precio base + un escalón por tramo, con el ahorro real. */
function buildSteps(p: Product): Step[] {
  const pres = principalOf(p);
  if (!pres) return [];
  const base = pres.unitPrice;
  const tiers = [...(pres.tiers ?? [])].sort((a, b) => a.minQuantity - b.minQuantity);
  if (tiers.length === 0) return [];

  const steps: Step[] = [
    {
      label: `1 a ${tiers[0].minQuantity - 1} unidades`,
      price: base,
      saving: 0,
      qty: 1,
    },
  ];
  for (const t of tiers) {
    steps.push({
      label: t.label?.trim() || `Desde ${t.minQuantity} un.`,
      price: t.pricePerUnit,
      saving: (base - t.pricePerUnit) * t.minQuantity,
      qty: t.minQuantity,
    });
  }
  return steps;
}

export function WholesaleLadder({ config }: { config?: HomeSectionConfig }) {
  const { data: product, isLoading } = useLadderProduct(config?.productSku);

  if (isLoading) {
    return (
      <section className="px-4 pt-6 lg:px-8">
        <div className="h-56 animate-pulse rounded-3xl bg-muted lg:h-64" />
      </section>
    );
  }
  if (!product) return null;

  const steps = buildSteps(product);
  if (steps.length < 2) return null;

  // El escalón "recomendado": el de mayor ahorro absoluto.
  const bestIdx = steps.reduce((best, s, i) => (s.saving > steps[best].saving ? i : best), 0);

  const title = config?.title || 'Tu precio baja solo';
  const wa = businessWhatsappHref(
    'Hola! Quiero cotizar una compra por mayor. ¿Me ayudan con los precios por volumen?'
  );

  return (
    <section className="px-4 pt-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary via-[#14556F] to-secondary p-5 text-white shadow-lg lg:p-8">
        {/* Halo de marca */}
        <div
          className="pointer-events-none absolute -right-24 -top-40 h-[420px] w-[420px] rounded-full bg-primary/25 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-3 lg:mb-5">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold lg:text-2xl">{title}</h2>
            <p className="mt-1 text-xs opacity-85 lg:text-sm">
              {config?.subtitle || (
                <>
                  Ejemplo real · <span className="font-semibold">{product.name}</span> — el
                  tramo se aplica automático en el carrito
                </>
              )}
            </p>
          </div>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="tappable inline-flex shrink-0 items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-xs font-bold text-[#0A2E1A] shadow-md transition-transform hover:scale-105 lg:text-sm"
          >
            <MessageCircle className="h-4 w-4" />
            Cotizar por WhatsApp
          </a>
        </div>

        {/* Escalera — las columnas se ajustan a los tramos REALES del producto
            (muchos tienen uno solo): con 4 fijas quedaban huecos vacíos. */}
        <div
          className={cn(
            'relative z-10 mt-4 grid gap-2.5 lg:mt-0 lg:gap-3',
            steps.length <= 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : steps.length === 3
                ? 'grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-2 lg:grid-cols-4'
          )}
        >
          {steps.map((s, i) => {
            const best = i === bestIdx;
            return (
              <div
                key={i}
                className={cn(
                  'rounded-2xl border p-3 lg:p-4',
                  best
                    ? 'border-primary/60 bg-primary/20'
                    : 'border-white/15 bg-white/[.07]'
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-75 lg:text-[11px]">
                  {s.label}
                </p>
                <p className="mt-1 font-display text-xl font-bold leading-none lg:text-2xl">
                  {formatCurrency(s.price)}
                  <span className="ml-1 text-[11px] font-semibold opacity-70">c/u</span>
                </p>
                {s.saving > 0 && (
                  <span
                    className={cn(
                      'mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold',
                      best ? 'bg-primary text-[#043336]' : 'bg-accent text-white'
                    )}
                  >
                    Ahorras {formatCurrency(s.saving)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium opacity-80 lg:text-xs">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> Se calcula solo al agregar al carrito
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> Sin registro previo
          </span>
          <Link
            href={`/productos/${product.slug}`}
            className="inline-flex items-center gap-1.5 font-bold underline-offset-2 hover:underline"
          >
            <TrendingDown className="h-3.5 w-3.5" /> Ver este producto
          </Link>
        </div>
      </div>
    </section>
  );
}
