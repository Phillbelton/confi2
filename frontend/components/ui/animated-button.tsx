'use client';

import * as React from 'react';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * AnimatedButton - Button component with premium micro-interactions
 *
 * Includes:
 * - Spring physics on tap/hover
 * - Ripple effect on click
 * - Shimmer effect (optional)
 * - Glow effect (optional)
 * - Loading states with pulse animation
 * - Shine animation on hover
 *
 * @example
 * ```tsx
 * <AnimatedButton shimmer loading>
 *   Click me
 * </AnimatedButton>
 * ```
 */

interface AnimatedButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Enable shimmer effect
   * @default false
   */
  shimmer?: boolean;

  /**
   * Enable glow effect on hover
   * @default false
   */
  glow?: boolean;

  /**
   * Animation intensity
   * @default "medium"
   */
  intensity?: 'subtle' | 'medium' | 'strong';

  /**
   * Disable animations
   * @default false
   */
  noAnimation?: boolean;

  /**
   * Loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Loading text to display
   * @default "Cargando..."
   */
  loadingText?: string;

  /**
   * Enable shine effect on hover
   * @default true
   */
  showShine?: boolean;
}

const intensityConfig = {
  subtle: {
    scale: { hover: 1.02, tap: 0.98 },
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
  },
  medium: {
    scale: { hover: 1.05, tap: 0.95 },
    transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
  },
  strong: {
    scale: { hover: 1.08, tap: 0.92 },
    transition: { type: 'spring' as const, stiffness: 500, damping: 15 },
  },
};

export const AnimatedButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(
  (
    {
      children,
      className,
      shimmer = false,
      glow = false,
      intensity = 'medium',
      noAnimation = false,
      loading = false,
      loadingText = 'Cargando...',
      showShine = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = React.useState(false);
    const [ripples, setRipples] = React.useState<
      Array<{ id: number; x: number; y: number }>
    >([]);

    const config = intensityConfig[intensity];
    const isDisabled = disabled || loading;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!noAnimation && !isDisabled) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rippleId = Date.now();
        setRipples((prev) => [...prev, { id: rippleId, x, y }]);

        // Remove ripple after animation
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== rippleId));
        }, 600);
      }

      // Call original onClick if provided
      if (props.onClick && !loading) {
        props.onClick(e);
      }
    };

    if (noAnimation || (disabled && !loading)) {
      return (
        <Button ref={ref} className={className} disabled={disabled} {...props}>
          {children}
        </Button>
      );
    }

    return (
      <motion.div
        className="relative inline-block"
        whileHover={{ scale: config.scale.hover }}
        whileTap={{ scale: config.scale.tap }}
        transition={config.transition}
        onTapStart={() => setIsPressed(true)}
        onTap={() => setIsPressed(false)}
        onTapCancel={() => setIsPressed(false)}
      >
        <Button
          ref={ref}
          className={cn('relative overflow-hidden', className)}
          disabled={isDisabled}
          {...props}
          onClick={handleClick}
        >
          {/* Shimmer effect */}
          {shimmer && !loading && (
            <motion.div
              className="absolute inset-0 shimmer pointer-events-none"
              animate={{
                backgroundPosition: ['200% 0', '-200% 0'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}

          {/* Glow effect */}
          {glow && !loading && (
            <motion.div
              className="absolute inset-0 rounded-[inherit] pointer-events-none"
              initial={{ opacity: 0 }}
              whileHover={{
                opacity: 1,
                boxShadow: '0 0 20px 2px rgba(249, 115, 22, 0.5)',
              }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Shine effect on hover */}
          {showShine && !loading && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
              initial={{ x: '-100%' }}
              whileHover={{
                x: '100%',
                transition: { duration: 0.6, ease: 'easeInOut' },
              }}
            />
          )}

          {/* Ripple effects */}
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              className="absolute rounded-full bg-white/30 pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: 0,
                height: 0,
              }}
              initial={{
                width: 0,
                height: 0,
                opacity: 1,
              }}
              animate={{
                width: 200,
                height: 200,
                opacity: 0,
                x: -100,
                y: -100,
              }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Pulse effect during loading */}
          {loading && (
            <motion.div
              className="absolute inset-0 rounded-md bg-primary/10 pointer-events-none"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Button content with loading state */}
          <span className="relative z-10 flex items-center justify-center gap-2">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.span
                  key="loading"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Loader2 className="h-4 w-4" />
                  </motion.div>
                  {loadingText}
                </motion.span>
              ) : (
                <motion.span
                  key="content"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  {children}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

/**
 * Predefined button variants with animations
 */

interface AnimatedButtonVariantProps
  extends Omit<AnimatedButtonProps, 'shimmer' | 'glow' | 'intensity'> {}

/**
 * Primary action button with shimmer effect
 */
export const PrimaryButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonVariantProps
>((props, ref) => (
  <AnimatedButton ref={ref} shimmer intensity="medium" {...props} />
));
PrimaryButton.displayName = 'PrimaryButton';

/**
 * Hero CTA button with glow effect
 */
export const HeroButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonVariantProps
>((props, ref) => (
  <AnimatedButton ref={ref} glow intensity="strong" {...props} />
));
HeroButton.displayName = 'HeroButton';

/**
 * Subtle button for secondary actions
 */
export const SubtleButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonVariantProps
>((props, ref) => (
  <AnimatedButton ref={ref} intensity="subtle" {...props} />
));
SubtleButton.displayName = 'SubtleButton';

/**
 * Icon button with rotation animation
 */
interface IconButtonProps extends AnimatedButtonVariantProps {
  icon: React.ReactNode;
}

export const AnimatedIconButton = React.forwardRef<
  HTMLButtonElement,
  IconButtonProps
>(({ icon, children, ...props }, ref) => {
  return (
    <AnimatedButton ref={ref} intensity="medium" {...props}>
      <motion.span
        animate={{ rotate: [0, 0, 0] }}
        whileHover={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.span>
      {children}
    </AnimatedButton>
  );
});
AnimatedIconButton.displayName = 'AnimatedIconButton';
