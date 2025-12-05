'use client';

import { motion } from 'framer-motion';
import { Search, Sparkles, TrendingUp, Gift, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motionVariants, motionTransitions } from '@/lib/design-system';

interface HeroSectionProps {
  onExploreClick?: () => void;
}

export function HeroSection({ onExploreClick }: HeroSectionProps) {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-subtle rounded-2xl mb-8 shadow-premium">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-secondary/20 blur-3xl"
        />

        {/* Floating Icons */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-12 right-32 text-primary/20"
        >
          <Sparkles className="w-16 h-16" />
        </motion.div>
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute bottom-16 left-40 text-accent/20"
        >
          <Gift className="w-12 h-12" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={motionTransitions.smooth}
            className="inline-flex items-center gap-2 mb-6"
          >
            <div className="px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Nuevos productos cada semana</span>
              </div>
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...motionTransitions.smooth, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-display"
          >
            <span className="gradient-text-sunset">
              Dulces Premium
            </span>
            <br />
            <span className="text-foreground">
              Para Cada Momento
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...motionTransitions.smooth, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed"
          >
            Descubre nuestra selección curada de confitería artesanal.
            <br className="hidden md:block" />
            Calidad excepcional, sabores únicos.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...motionTransitions.smooth, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="gradient-primary text-white shadow-premium hover:shadow-premium-lg transition-all hover:scale-105 w-full sm:w-auto"
              onClick={onExploreClick}
            >
              <Search className="mr-2 h-5 w-5" />
              Explorar Catálogo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/30 hover:bg-primary/5 w-full sm:w-auto"
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              Más Vendidos
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...motionTransitions.smooth, delay: 0.4 }}
            className="mt-12 grid grid-cols-3 gap-6 md:gap-8"
          >
            {[
              { icon: Heart, label: 'Productos', value: '500+' },
              { icon: Sparkles, label: 'Marcas Premium', value: '50+' },
              { icon: Gift, label: 'Clientes Felices', value: '10K+' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  ...motionTransitions.spring,
                  delay: 0.5 + index * 0.1,
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-8 md:h-12 fill-background"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,0 C150,80 350,80 600,40 C850,0 1050,0 1200,40 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
}
