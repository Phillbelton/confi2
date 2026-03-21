'use client';

import { Package, Percent, Truck, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/motion-variants';

const features = [
  {
    icon: Package,
    title: 'Amplio catálogo',
    description: 'Miles de productos disponibles',
  },
  {
    icon: Percent,
    title: 'Descuentos',
    description: 'Mejores precios por cantidad',
  },
  {
    icon: Truck,
    title: 'Retiro o despacho',
    description: 'Tú eliges cómo recibir',
  },
  {
    icon: MessageCircle,
    title: 'Pedidos WhatsApp',
    description: 'Compra fácil y rápido',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-8 sm:py-12 bg-muted/30">
      <div className="container px-4">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              whileHover={{
                y: -8,
                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(
                'flex flex-col items-center text-center p-4 rounded-lg',
                'bg-background/50 backdrop-blur-sm',
                'border border-border/50',
                'cursor-default'
              )}
            >
              <motion.div
                className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3"
                whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.div>
              <h3 className="text-sm sm:text-base font-semibold">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
