import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Línea de aceptación de términos para el checkout y el registro.
 *
 * Es microcopy, no un checkbox: la aceptación queda por la acción (confirmar el
 * pedido / crear la cuenta), que es práctica estándar en venta a distancia
 * siempre que el texto se vea **antes** del botón y no esté escondido. Un
 * checkbox obligatorio agrega un paso más y es causa clásica de abandono en
 * móvil.
 */
export function LegalNotice({
  action = 'confirmar tu pedido',
  className,
}: {
  /** Acción que implica la aceptación, en infinitivo. */
  action?: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'text-center text-xs leading-relaxed text-muted-foreground',
        className
      )}
    >
      Al {action} aceptas nuestros{' '}
      <Link
        href="/ayuda/terminos"
        className="underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground"
      >
        Términos y condiciones
      </Link>{' '}
      y la{' '}
      <Link
        href="/ayuda/privacidad"
        className="underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground"
      >
        Política de privacidad
      </Link>
      .
    </p>
  );
}
