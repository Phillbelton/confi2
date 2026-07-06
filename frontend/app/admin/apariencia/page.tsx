'use client';

import { Loader2, Check } from 'lucide-react';
import {
  useAdminSiteSettings,
  useSiteSettingsOperations,
} from '@/hooks/admin/useAdminSiteSettings';
import type {
  CatalogPresentationVariant,
  CatalogNavStyle,
} from '@/services/siteSettings';
import { cn } from '@/lib/utils';

const PRESENTATION_OPTIONS: Array<{
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

const NAV_OPTIONS: Array<{
  value: CatalogNavStyle;
  label: string;
  desc: string;
}> = [
  {
    value: 'bar',
    label: 'Barra de categorías',
    desc: 'Fila bajo el encabezado con las categorías raíz siempre visibles. Cada una abre su panel de subcategorías al pasar el cursor, y hacer clic lleva directo a su catálogo. Estilo Jumbo/Líder.',
  },
  {
    value: 'dropdown',
    label: 'Menú desplegable (clásico)',
    desc: 'Botón "Categorías" junto al logo que despliega el panel completo con los 3 niveles. El encabezado queda más compacto, sin fila extra.',
  },
];

/** Grilla de tarjetas de opción con estado activo + guardado al clic. */
function OptionCards<V extends string>({
  options,
  current,
  disabled,
  onSelect,
  columnsClass = 'sm:grid-cols-3',
}: {
  options: Array<{ value: V; label: string; desc: string }>;
  current: V | undefined;
  disabled: boolean;
  onSelect: (value: V) => void;
  columnsClass?: string;
}) {
  return (
    <div className={cn('grid gap-3', columnsClass)}>
      {options.map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled || active}
            onClick={() => onSelect(opt.value)}
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
  );
}

export default function AparienciaPage() {
  const { data, isLoading } = useAdminSiteSettings();
  const { save, isSaving } = useSiteSettingsOperations();

  return (
    <div className="space-y-10 max-w-2xl">
      <header>
        <h1 className="text-2xl font-semibold">Apariencia de la tienda</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Los cambios se aplican al instante, sin volver a publicar.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : (
        <>
          {/* ── Navegación de categorías del encabezado ── */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Navegación de categorías</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Cómo se recorre el árbol de categorías desde el encabezado de la
                tienda (solo escritorio; en celular siempre se usa el menú lateral).
              </p>
            </div>
            <OptionCards
              options={NAV_OPTIONS}
              current={data?.catalogNavStyle}
              disabled={isSaving}
              onSelect={(v) => save({ catalogNavStyle: v })}
              columnsClass="sm:grid-cols-2"
            />
          </section>

          {/* ── Presentaciones en la tarjeta del catálogo ── */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Presentaciones en la tarjeta</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Cómo se muestran las presentaciones (unidad / display / embalaje)
                en las tarjetas del catálogo. Solo afecta a productos con más de
                una presentación.
              </p>
            </div>
            <OptionCards
              options={PRESENTATION_OPTIONS}
              current={data?.catalogPresentationVariant}
              disabled={isSaving}
              onSelect={(v) => save({ catalogPresentationVariant: v })}
            />
            <p className="text-xs text-muted-foreground">
              Para previsualizar, abre el catálogo filtrando por una presentación
              con varias opciones, por ejemplo{' '}
              <code className="rounded bg-muted px-1 py-0.5">
                /productos?presentacion=embalaje
              </code>
              .
            </p>
          </section>
        </>
      )}
    </div>
  );
}
