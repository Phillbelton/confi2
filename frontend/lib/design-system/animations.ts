/**
 * DESIGN SYSTEM - ANIMATIONS
 * Configuración de animaciones y transiciones
 */

export const durations = {
  fast: '150ms',
  base: '250ms',
  slow: '350ms',
  slower: '500ms',
} as const;

export const easings = {
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'ease-spring': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export const transitions = {
  colors: `color ${durations.base} ${easings['ease-out']},
           background-color ${durations.base} ${easings['ease-out']},
           border-color ${durations.base} ${easings['ease-out']}`,
  transform: `transform ${durations.base} ${easings['ease-out']}`,
  all: `all ${durations.base} ${easings['ease-out']}`,
} as const;

/**
 * Framer Motion Variants
 */
export const motionVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  slideInLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  slideInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
} as const;

export const motionTransitions = {
  spring: {
    type: 'spring' as const,
    stiffness: 260,
    damping: 20,
  },
  smooth: {
    type: 'tween' as const,
    ease: 'easeOut',
    duration: 0.3,
  },
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 10,
  },
} as const;
