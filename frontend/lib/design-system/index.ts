/**
 * DESIGN SYSTEM - INDEX
 * Export central de todo el sistema de diseño
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './animations';

// Re-export todo para fácil acceso
export { colors, gradients, withOpacity } from './colors';
export { fontSizes, fontWeights, lineHeights, letterSpacings, fontFamilies, typographyVariants } from './typography';
export { spacing, containerSizes, borderRadius } from './spacing';
export { durations, easings, transitions, motionVariants, motionTransitions } from './animations';
