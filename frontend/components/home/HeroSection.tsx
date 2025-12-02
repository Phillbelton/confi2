'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fadeInUp, fadeInDown, scaleIn, staggerContainer, staggerItem } from '@/lib/motion-variants';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

      {/* Decorative Elements - Animated */}
      <motion.div
        className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-10 left-10 w-24 h-24 bg-secondary/10 rounded-full blur-2xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      <div className="relative container px-4 py-12 sm:py-16 lg:py-24">
        <motion.div
          className="max-w-2xl mx-auto text-center lg:text-left lg:mx-0"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={scaleIn}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 pulse-badge">
              <Sparkles className="h-4 w-4" />
              <span>Descuentos por cantidad</span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
            variants={staggerItem}
          >
            Confitería{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-display">
              Quelita
            </span>
          </motion.h1>

          <motion.p
            className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0"
            variants={staggerItem}
          >
            Los mejores productos de confitería al mejor precio.
            Compra por mayor y ahorra más.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            variants={staggerItem}
          >
            <Link href="/productos">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Button size="lg" className="w-full sm:w-auto">
                  Ver catálogo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
            <Link href="/productos?onSale=true">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Ver ofertas
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
