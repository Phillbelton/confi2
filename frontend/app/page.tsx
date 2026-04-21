'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Phone, Truck, CreditCard, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="theme-landing flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* ═══════════════════════════════════════════
            CTA SECTION - Identidad Quelita
            ═══════════════════════════════════════════ */}
        <section className="relative bg-primary candy-bg overflow-hidden py-20 md:py-28">
          {/* Blobs */}
          <div className="absolute top-0 left-1/4 w-60 h-60 bg-secondary/30 rounded-full blur-3xl blob pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-3xl blob-delayed pointer-events-none" />

          <div className="container mx-auto px-4 text-center relative z-[3]">
            {/* Logo as centerpiece with glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' as const }}
              className="mb-8 relative inline-block"
            >
              <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl scale-150" />
              <Image
                src="/brand/logo.png"
                alt="Confitería Quelita"
                width={300}
                height={180}
                priority
                className="mx-auto w-[220px] md:w-[300px] drop-shadow-2xl relative"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-white/80 max-w-lg mx-auto mb-8 text-lg"
            >
              Mayorista y detalle — descubre nuestro catálogo completo con los mejores productos y precios.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Button
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-bold shadow-xl shadow-black/15 rounded-full px-8 text-base"
              >
                <Link href="/productos">
                  Ver catálogo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-white/15 text-white hover:bg-white/25 font-bold border border-white/30 backdrop-blur-sm rounded-full px-8 text-base"
              >
                <Link href="https://wa.me/56964269246" target="_blank" rel="noopener noreferrer">
                  <Phone className="mr-2 h-5 w-5" />
                  Contáctanos
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Benefits Bar */}
        <section className="bg-secondary candy-bg border-b border-white/10">
          <div className="container mx-auto px-4 py-6 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { icon: Truck, title: 'Envío en 24hrs', desc: 'Peñalolén, La Florida, Macul, La Reina', color: 'text-cyan-300' },
                { icon: CreditCard, title: 'Pago seguro', desc: 'Múltiples opciones', color: 'text-cyan-300' },
                { icon: Phone, title: 'WhatsApp', desc: '+56 9 6426 9246', color: 'text-green-300' },
                { icon: Clock, title: 'Horario', desc: 'L-S 08:30-20:30 · Dom 10:00-16:00', color: 'text-cyan-300' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-white">{item.title}</p>
                    <p className="text-xs text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
