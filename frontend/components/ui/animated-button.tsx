'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Button, buttonVariants } from '@/components/ui/button';
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
 *
 * @example
 * ```tsx
 * <AnimatedButton shimmer>
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

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!noAnimation && !disabled) {
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
      if (props.onClick) {
        props.onClick(e);
      }
    };

    if (noAnimation || disabled) {
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
          disabled={disabled}
          {...props}
          onClick={handleClick}
        >
          {/* Shimmer effect */}
          {shimmer && (
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
          {glow && (
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

          {/* Button content */}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {children}
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
