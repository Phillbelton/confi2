'use client';

import { motion } from 'framer-motion';
import { Package, Search, Filter, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motionVariants } from '@/lib/design-system';

interface EmptyStateProps {
  type?: 'no-results' | 'no-products' | 'error';
  onReset?: () => void;
  message?: string;
}

export function EmptyState({
  type = 'no-results',
  onReset,
  message
}: EmptyStateProps) {
  const config = {
    'no-results': {
      icon: Search,
      title: 'No se encontraron productos',
      description: message || 'Intenta ajustar los filtros o buscar con otros términos.',
      actionLabel: 'Limpiar filtros',
    },
    'no-products': {
      icon: Package,
      title: 'No hay productos disponibles',
      description: message || 'Aún no hay productos en esta categoría.',
      actionLabel: 'Ver todos los productos',
    },
    'error': {
      icon: AlertCircle,
      title: 'Algo salió mal',
      description: message || 'No pudimos cargar los productos. Intenta nuevamente.',
      actionLabel: 'Reintentar',
    },
  }[type];

  const Icon = config.icon;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={motionVariants.fadeInUp}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Icon Container */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-subtle flex items-center justify-center shadow-premium">
          <Icon className="h-10 w-10 text-primary" />
        </div>

        {/* Decorative circles */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full border-2 border-primary/20"
        />
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
          className="absolute inset-0 rounded-full border-2 border-primary/10"
        />
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold mb-2 text-foreground"
      >
        {config.title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground mb-6 max-w-sm"
      >
        {config.description}
      </motion.p>

      {/* Action Button */}
      {onReset && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={onReset}
            variant="default"
            size="lg"
            className="shadow-premium hover:shadow-premium-lg transition-shadow"
          >
            {config.actionLabel}
          </Button>
        </motion.div>
      )}

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-sm text-muted-foreground"
      >
        <p className="mb-2 font-medium">Sugerencias:</p>
        <ul className="space-y-1 text-left max-w-xs mx-auto">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Verifica la ortografía de tu búsqueda</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Usa términos más generales</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Prueba con menos filtros activos</span>
          </li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
