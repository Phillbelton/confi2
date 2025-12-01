"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

/**
 * GradientCard - Componente premium con gradientes personalizados
 *
 * @example
 * ```tsx
 * <GradientCard variant="primary" hover="lift">
 *   <h3>Título</h3>
 *   <p>Contenido de la tarjeta</p>
 * </GradientCard>
 * ```
 */

export type GradientVariant =
  | "primary"
  | "golden"
  | "sunset"
  | "candy"
  | "subtle"
  | "none";

export type HoverEffect =
  | "none"
  | "lift"
  | "glow"
  | "tilt"
  | "scale";

interface GradientCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  /**
   * Variante de gradiente a aplicar
   * @default "primary"
   */
  variant?: GradientVariant;

  /**
   * Efecto de hover
   * @default "lift"
   */
  hover?: HoverEffect;

  /**
   * Activar animación de entrada
   * @default false
   */
  animated?: boolean;

  /**
   * Mostrar borde con gradiente
   * @default false
   */
  gradientBorder?: boolean;

  /**
   * Padding interno
   * @default "default"
   */
  padding?: "none" | "sm" | "default" | "lg";

  /**
   * Border radius
   * @default "default"
   */
  rounded?: "none" | "sm" | "default" | "lg" | "xl" | "full";

  children?: React.ReactNode;
  className?: string;
}

const paddingVariants = {
  none: "",
  sm: "p-3",
  default: "p-6",
  lg: "p-8",
};

const roundedVariants = {
  none: "",
  sm: "rounded-sm",
  default: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  full: "rounded-full",
};

const gradientVariants = {
  primary: "gradient-primary",
  golden: "gradient-golden",
  sunset: "gradient-sunset",
  candy: "gradient-candy",
  subtle: "gradient-subtle",
  none: "",
};

const hoverEffects = {
  none: {},
  lift: {
    y: -8,
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
  glow: {
    boxShadow: "0 0 40px 10px rgba(249, 115, 22, 0.3)",
  },
  tilt: {
    rotateY: 5,
    rotateX: 5,
  },
  scale: {
    scale: 1.03,
  },
};

const animationVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
    },
  },
};

export const GradientCard = React.forwardRef<HTMLDivElement, GradientCardProps>(
  (
    {
      variant = "primary",
      hover = "lift",
      animated = false,
      gradientBorder = false,
      padding = "default",
      rounded = "default",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false);

    const baseClasses = cn(
      "relative overflow-hidden",
      "transition-all duration-300 ease-out",
      paddingVariants[padding],
      roundedVariants[rounded],
      !gradientBorder && variant !== "none" && gradientVariants[variant],
      gradientBorder && "gradient-border",
      className
    );

    const cardContent = (
      <motion.div
        ref={ref}
        className={baseClasses}
        initial={animated ? "hidden" : false}
        animate={animated ? "visible" : false}
        variants={animationVariants}
        whileHover={hover !== "none" ? hoverEffects[hover] : undefined}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        {...props}
      >
        {/* Shimmer effect on hover */}
        {hover !== "none" && isHovered && (
          <motion.div
            className="absolute inset-0 shimmer pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );

    return cardContent;
  }
);

GradientCard.displayName = "GradientCard";

/**
 * Componente de texto con gradiente
 */
interface GradientTextProps {
  variant?: GradientVariant;
  className?: string;
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
}

export function GradientText({
  variant = "primary",
  className,
  children,
  as: Component = "span",
}: GradientTextProps) {
  return (
    <Component
      className={cn(
        "gradient-text font-bold",
        variant !== "none" && gradientVariants[variant],
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Componente de ícono con gradiente
 */
interface GradientIconProps {
  variant?: GradientVariant;
  className?: string;
  children: React.ReactNode;
}

export function GradientIcon({
  variant = "primary",
  className,
  children,
}: GradientIconProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg p-2",
        variant !== "none" && gradientVariants[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
