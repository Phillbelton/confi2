"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  /**
   * Mostrar versión completa o solo icono
   * @default "full"
   */
  variant?: "full" | "icon";

  /**
   * Tamaño del logo
   * @default "default"
   */
  size?: "sm" | "default" | "lg";

  /**
   * Clase adicional
   */
  className?: string;
}

const sizeVariants = {
  sm: {
    icon: "h-8 w-8 text-base",
    text: "text-base",
  },
  default: {
    icon: "h-10 w-10 text-xl",
    text: "text-xl",
  },
  lg: {
    icon: "h-14 w-14 text-3xl",
    text: "text-3xl",
  },
};

export function Logo({ variant = "full", size = "default", className }: LogoProps) {
  const iconAnimation = {
    rest: {
      scale: 1,
      rotate: 0,
    },
    hover: {
      scale: 1.1,
      rotate: [0, -5, 5, -5, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  };

  const textAnimation = {
    rest: {},
    hover: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const letterAnimation = {
    rest: {
      y: 0,
    },
    hover: {
      y: -3,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  };

  const glowAnimation = {
    rest: {
      opacity: 0,
      scale: 0.8,
    },
    hover: {
      opacity: [0, 0.5, 0],
      scale: [0.8, 1.2, 1.4],
      transition: {
        duration: 1.5,
        ease: "easeOut",
        repeat: Infinity,
      },
    },
  };

  return (
    <Link href="/" className={cn("flex items-center space-x-2", className)}>
      <motion.div
        className="relative"
        initial="rest"
        whileHover="hover"
        animate="rest"
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-lg gradient-primary blur-xl"
          variants={glowAnimation}
          aria-hidden="true"
        />

        {/* Logo Icon */}
        <motion.div
          className={cn(
            "relative flex items-center justify-center rounded-lg gradient-primary text-white font-bold shadow-lg",
            sizeVariants[size].icon
          )}
          variants={iconAnimation}
        >
          Q
        </motion.div>
      </motion.div>

      {/* Logo Text */}
      {variant === "full" && (
        <motion.span
          className={cn(
            "hidden font-bold sm:inline-flex gap-1",
            sizeVariants[size].text
          )}
          variants={textAnimation}
        >
          {/* "Confitería" - sin animación de letras individuales */}
          <span className="font-sans">Confitería</span>

          {/* "Quelita" - con gradiente y animación */}
          <motion.span
            className="inline-flex"
            style={{
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "var(--font-display)",
            }}
          >
            {"Quelita".split("").map((letter, index) => (
              <motion.span key={index} variants={letterAnimation}>
                {letter}
              </motion.span>
            ))}
          </motion.span>
        </motion.span>
      )}
    </Link>
  );
}
