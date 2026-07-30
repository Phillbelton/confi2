import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * ¿La ruta es la ficha de un producto? La ficha monta una CTA fija al borde
 * inferior en móvil, así que el FAB del carrito (se esconde) y el cierre del
 * footer (gana colchón) necesitan reconocerla para no quedar tapados.
 */
export function isProductDetailPath(pathname: string | null | undefined): boolean {
  return /^\/productos\/[^/]+$/.test(pathname ?? '');
}

export function formatCurrency(value: number): string {
  return '$' + new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
