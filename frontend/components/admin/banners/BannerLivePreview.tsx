'use client';

import { ArrowRight, ImageOff, Monitor, Smartphone } from 'lucide-react';
import {
  specForPlacement,
  mobileSpecForPlacement,
} from '@/components/admin/banners/DimensionHint';
import type { BannerPlacement } from '@/types';

interface BannerLivePreviewProps {
  placement: BannerPlacement;
  cols?: number;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  /** Data-URL o URL de la imagen principal (preview local o ya subida). */
  imageUrl?: string | null;
  /** Override mobile — si no hay, el celular usa la imagen principal. */
  imageMobileUrl?: string | null;
}

/**
 * Vista previa en vivo del banner tal como lo ve el cliente: la imagen
 * recortada a la proporción REAL del placement (desktop y celular) con el
 * mismo overlay de degradado + título + subtítulo + CTA del render público
 * (BannerTile en PromoGrid). Sirve para detectar al toque texto que tapa lo
 * importante de la foto o recortes que dejan el contenido afuera.
 */
export function BannerLivePreview({
  placement,
  cols,
  title,
  subtitle,
  ctaText,
  imageUrl,
  imageMobileUrl,
}: BannerLivePreviewProps) {
  const desktopSpec = specForPlacement(placement, cols);
  const mobileSpec = mobileSpecForPlacement(placement, cols);

  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-semibold">
        Vista previa{' '}
        <span className="font-normal text-muted-foreground">
          — así lo ve el cliente, con el recorte real
        </span>
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <PreviewBox
          icon={<Monitor className="h-3.5 w-3.5" />}
          label="Escritorio"
          aspect={`${desktopSpec.w}/${desktopSpec.h}`}
          imageUrl={imageUrl}
          title={title}
          subtitle={subtitle}
          ctaText={ctaText}
        />
        <PreviewBox
          icon={<Smartphone className="h-3.5 w-3.5" />}
          label="Celular"
          aspect={`${mobileSpec.w}/${mobileSpec.h}`}
          imageUrl={imageMobileUrl || imageUrl}
          title={title}
          subtitle={subtitle}
          ctaText={ctaText}
        />
      </div>
    </div>
  );
}

function PreviewBox({
  icon,
  label,
  aspect,
  imageUrl,
  title,
  subtitle,
  ctaText,
}: {
  icon: React.ReactNode;
  label: string;
  aspect: string;
  imageUrl?: string | null;
  title?: string;
  subtitle?: string;
  ctaText?: string;
}) {
  const hasText = !!(title || subtitle);
  return (
    <div className="min-w-0 space-y-1.5">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {icon}
        {label}
      </span>
      <div
        className="relative w-full overflow-hidden rounded-lg border bg-muted shadow-sm"
        style={{ aspectRatio: aspect }}
      >
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground/50">
            <ImageOff className="h-5 w-5" />
          </div>
        )}

        {hasText && (
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent"
            aria-hidden
          />
        )}

        {(hasText || ctaText) && (
          <div className="absolute inset-x-0 bottom-0 p-2 text-white">
            {subtitle && (
              <p className="truncate text-[7px] font-bold uppercase tracking-widest text-white/80">
                {subtitle}
              </p>
            )}
            {title && (
              <h4 className="truncate font-display text-[11px] font-bold leading-tight drop-shadow-md">
                {title}
              </h4>
            )}
            {ctaText && (
              <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[7px] font-bold text-gray-900">
                <span className="truncate">{ctaText}</span>
                <ArrowRight className="h-2 w-2 shrink-0" />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BannerLivePreview;
