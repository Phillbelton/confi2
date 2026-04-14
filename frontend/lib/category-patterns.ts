import type { CSSProperties } from 'react';

/**
 * Deterministic hash: sum of charCodes → mod 6 to pick a pattern type.
 * Same color always produces the same pattern.
 */
function hashColor(color: string): number {
  let sum = 0;
  for (let i = 0; i < color.length; i++) {
    sum += color.charCodeAt(i);
  }
  return sum % 6;
}

/** Strip '#' and return clean hex for SVG fill */
function hexForSvg(color: string): string {
  return color.replace('#', '%23');
}

// --- 6 SVG pattern generators ---

function polkaDots(color: string): string {
  const hex = hexForSvg(color);
  return `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='2' fill='${hex}'/%3E%3C/svg%3E")`;
}

function diagonalLines(color: string): string {
  const hex = hexForSvg(color);
  return `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 16L16 0' stroke='${hex}' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`;
}

function waves(color: string): string {
  const hex = hexForSvg(color);
  return `url("data:image/svg+xml,%3Csvg width='40' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q10 0 20 10 T40 10' stroke='${hex}' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`;
}

function diamonds(color: string): string {
  const hex = hexForSvg(color);
  return `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2L22 12L12 22L2 12Z' stroke='${hex}' stroke-width='1' fill='none'/%3E%3C/svg%3E")`;
}

function crossHatch(color: string): string {
  const hex = hexForSvg(color);
  return `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0L16 16M16 0L0 16' stroke='${hex}' stroke-width='1' fill='none'/%3E%3C/svg%3E")`;
}

function zigzag(color: string): string {
  const hex = hexForSvg(color);
  return `url("data:image/svg+xml,%3Csvg width='32' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 8L8 0L16 8L24 0L32 8' stroke='${hex}' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`;
}

const generators = [polkaDots, diagonalLines, waves, diamonds, crossHatch, zigzag];

/**
 * Returns a CSSProperties object with `--pattern-bg` set to an inline SVG
 * data URI based on the category color. The pattern type is deterministically
 * chosen by hashing the color string.
 *
 * Used with the `.category-pattern-overlay` CSS class which reads `--pattern-bg`
 * via a `::after` pseudo-element.
 */
export function getCategoryPattern(color: string): CSSProperties {
  const index = hashColor(color);
  const patternUrl = generators[index](color);

  return {
    '--pattern-bg': patternUrl,
  } as CSSProperties;
}
