import { cn } from '@/lib/utils';

interface DiscountStickerProps {
  /**
   * Texto del badge. Puede ser:
   *   - "-5%" o "5%"         → se muestra en dos líneas con "dcto."
   *   - "-$500" o "$500"     → se muestra en dos líneas con "dcto."
   *   - texto personalizado  → se muestra tal cual en una línea
   */
  badge: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * DiscountSticker — estilo sticker cuadrado rojo (inspirado en dimakonline).
 * Fondo rojo intenso, texto blanco bold, esquinas ligeramente redondeadas.
 */
export function DiscountSticker({
  badge,
  size = 'md',
  className,
}: DiscountStickerProps) {
  // Detectar formato corto ("-5%", "-$500", "5%", "$500")
  const percentMatch = badge.match(/^-?\s*(\d+)\s*%$/);
  const amountMatch = badge.match(/^-?\s*(\$[\d.,]+)$/);

  const shortValue = percentMatch
    ? `${percentMatch[1]}%`
    : amountMatch
      ? amountMatch[1]
      : null;

  const sizeClasses = {
    sm: 'w-9 h-9 text-[10px]',
    md: 'w-11 h-11 text-[12px]',
    lg: 'w-14 h-14 text-[14px]',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[5px] font-bold text-white leading-none shadow-md select-none',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: '#E72419' }}
    >
      {shortValue ? (
        <>
          <span className="font-bold">{shortValue}</span>
          <span className="font-bold mt-0.5">dcto.</span>
        </>
      ) : (
        <span className="text-center leading-tight px-1">{badge}</span>
      )}
    </div>
  );
}
