/**
 * DESIGN SYSTEM - COLORS
 * Paleta de colores y utilities para el sistema de diseño
 */

export const colors = {
  // Brand Colors - Pastel Pink Palette
  primary: {
    50: 'oklch(0.98 0.02 345)',
    100: 'oklch(0.95 0.04 345)',
    200: 'oklch(0.92 0.06 345)',
    300: 'oklch(0.89 0.08 345)',
    400: 'oklch(0.87 0.09 345)',
    500: 'oklch(0.85 0.10 345)', // Base
    600: 'oklch(0.75 0.12 345)',
    700: 'oklch(0.65 0.14 345)',
    800: 'oklch(0.55 0.12 345)',
    900: 'oklch(0.45 0.10 345)',
    DEFAULT: 'oklch(0.85 0.10 345)',
  },

  secondary: {
    50: 'oklch(0.98 0.02 340)',
    100: 'oklch(0.95 0.04 340)',
    200: 'oklch(0.92 0.06 340)',
    300: 'oklch(0.90 0.07 340)',
    400: 'oklch(0.88 0.08 340)',
    500: 'oklch(0.90 0.08 340)', // Base
    600: 'oklch(0.80 0.10 340)',
    700: 'oklch(0.70 0.11 340)',
    800: 'oklch(0.60 0.10 340)',
    900: 'oklch(0.50 0.09 340)',
    DEFAULT: 'oklch(0.90 0.08 340)',
  },

  accent: {
    50: 'oklch(0.98 0.02 350)',
    100: 'oklch(0.95 0.03 350)',
    200: 'oklch(0.92 0.05 350)',
    300: 'oklch(0.90 0.06 350)',
    400: 'oklch(0.89 0.07 350)',
    500: 'oklch(0.88 0.07 350)', // Base
    600: 'oklch(0.78 0.08 350)',
    700: 'oklch(0.68 0.09 350)',
    800: 'oklch(0.58 0.08 350)',
    900: 'oklch(0.48 0.07 350)',
    DEFAULT: 'oklch(0.88 0.07 350)',
  },
} as const;

export const gradients = {
  primary: 'linear-gradient(135deg, oklch(0.88 0.08 345) 0%, oklch(0.90 0.06 350) 100%)',
  golden: 'linear-gradient(135deg, oklch(0.92 0.05 355) 0%, oklch(0.88 0.07 340) 100%)',
  sunset: 'linear-gradient(135deg, oklch(0.85 0.10 345) 0%, oklch(0.88 0.08 350) 50%, oklch(0.92 0.05 355) 100%)',
  candy: 'linear-gradient(135deg, oklch(0.87 0.08 320) 0%, oklch(0.90 0.06 340) 100%)',
  subtle: 'linear-gradient(135deg, oklch(0.97 0.02 345) 0%, oklch(0.99 0.01 345) 100%)',
  overlay: 'linear-gradient(135deg, oklch(1 0 0 / 95%) 0%, oklch(0.98 0.01 345 / 90%) 100%)',
} as const;

/**
 * Get color with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  return color.replace(')', ` / ${opacity})`);
}

/**
 * Generate color scale programmatically
 */
export function generateColorScale(baseHue: number, baseSaturation: number) {
  return {
    50: `oklch(0.98 ${baseSaturation * 0.2} ${baseHue})`,
    100: `oklch(0.95 ${baseSaturation * 0.4} ${baseHue})`,
    200: `oklch(0.92 ${baseSaturation * 0.6} ${baseHue})`,
    300: `oklch(0.89 ${baseSaturation * 0.8} ${baseHue})`,
    400: `oklch(0.87 ${baseSaturation * 0.9} ${baseHue})`,
    500: `oklch(0.85 ${baseSaturation} ${baseHue})`,
    600: `oklch(0.75 ${baseSaturation * 1.2} ${baseHue})`,
    700: `oklch(0.65 ${baseSaturation * 1.4} ${baseHue})`,
    800: `oklch(0.55 ${baseSaturation * 1.2} ${baseHue})`,
    900: `oklch(0.45 ${baseSaturation} ${baseHue})`,
  };
}
