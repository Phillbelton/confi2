'use client';

import { Loader2, Check } from 'lucide-react';
import {
  useAdminSiteSettings,
  useSiteSettingsOperations,
} from '@/hooks/admin/useAdminSiteSettings';
import type { CatalogPresentationVariant } from '@/services/siteSettings';
import { cn } from '@/lib/utils';

const OPTIONS: Array<{
  value: CatalogPresentationVariant;
  label: string;
  desc: string;
}> = [
  {
    value: 'B',
    label: 'Inline simple',
    desc: 'Selector de presentación dentro de la tarjeta y el mejor descuento por cantidad en una sola línea. Compacto, sin nada desplegable.',
  },
  {
    value: 'C',
    label: 'Inline con escalera',
    desc: 'Igual que el simple, pero con la escalera completa de tramos (descuentos por cantidad) desplegable. Más información a la vista.',
  },
  {
    value: 'D',
    label: 'Vista rápida (panel inferior)',
    desc: 'La tarjeta queda compacta con un botón "Ver presentaciones" que abre un panel inferior. Más limpio y denso en la grilla.',
  },
];

export default function AparienciaPage() {
  const { data, isLoading } = useAdminSiteSettings();
  const { save, isSaving } = useSiteSettingsOperations();
  const current = data?.catalogPresentationVariant;

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-2xl font-semibold">Apariencia del catálogo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Elige cómo se muestran las presentaciones (unidad / display / embalaje)
          en las tarjetas del catálogo. El cambio se aplica al instante, sin
          volver a publicar. Solo afecta a productos con más de una presentación.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {OPTIONS.map((opt) => {
            const active = current === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isSaving || active}
                onClick={() => save(opt.value)}
                className={cn(
                  'text-left rounded-xl border p-4 transition-colors disabled:cursor-default',
                  active
                    ? 'border-primary ring-1 ring-primary bg-primary/5'
                    : 'hover:bg-muted/40'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{opt.label}</span>
                  {active && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <Check className="h-3.5 w-3.5" /> Activa
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Para previsualizar, abre el catálogo filtrando por una presentación con
        varias opciones, por ejemplo{' '}
        <code className="rounded bg-muted px-1 py-0.5">/productos?presentacion=embalaje</code>.
      </p>
    </div>
  );
}
