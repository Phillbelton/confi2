import { cn } from '@/lib/utils';
import type { Banner } from '@/types';

/**
 * Estado efectivo de publicación de un banner, para mostrarle al admin por
 * qué un banner no se está viendo en la tienda. `null` = publicado y visible.
 *
 * Prioridad: sin imagen (el público lo filtra) > inactivo > vencido > programado.
 */
export type BannerStatusInfo = {
  label: 'Sin imagen' | 'Inactivo' | 'Vencido' | 'Programado';
  tone: 'red' | 'muted' | 'amber';
};

export function bannerStatus(banner: Banner): BannerStatusInfo | null {
  if (!banner.image || banner.image.includes('placeholder')) {
    return { label: 'Sin imagen', tone: 'red' };
  }
  if (!banner.active) {
    return { label: 'Inactivo', tone: 'muted' };
  }
  const now = Date.now();
  if (banner.endDate && new Date(banner.endDate).getTime() < now) {
    return { label: 'Vencido', tone: 'red' };
  }
  if (banner.startDate && new Date(banner.startDate).getTime() > now) {
    return { label: 'Programado', tone: 'amber' };
  }
  return null;
}

const TONE_CLASSES: Record<BannerStatusInfo['tone'], string> = {
  red: 'bg-red-600 text-white',
  amber: 'bg-amber-500 text-white',
  muted: 'bg-gray-700/90 text-white',
};

/**
 * Badge de estado para las miniaturas del wireframe/franjas. No renderiza
 * nada si el banner está publicado (la UI queda limpia para el caso normal).
 */
export function BannerStatusBadge({ banner }: { banner: Banner }) {
  const status = bannerStatus(banner);
  if (!status) return null;
  return (
    <span
      className={cn(
        'pointer-events-none absolute left-1/2 top-1.5 z-10 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm',
        TONE_CLASSES[status.tone]
      )}
    >
      {status.label}
    </span>
  );
}
