"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface FlyingParticle {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface FlyingCartParticleProps {
  particle: FlyingParticle;
  onComplete: (id: string) => void;
}

function FlyingCartParticleContent({ particle, onComplete }: FlyingCartParticleProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(particle.id);
    }, 800);

    return () => clearTimeout(timer);
  }, [particle.id, onComplete]);

  return (
    <motion.div
      initial={{
        position: 'fixed',
        left: particle.startX,
        top: particle.startY,
        opacity: 1,
        scale: 1,
        zIndex: 9999,
      }}
      animate={{
        left: particle.endX,
        top: particle.endY,
        opacity: [1, 1, 0.5, 0],
        scale: [1, 0.8, 0.4, 0],
      }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="pointer-events-none"
    >
      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-lg">
        <ShoppingCart className="w-4 h-4 text-white" />
      </div>
    </motion.div>
  );
}

export function FlyingCartParticle({ particle, onComplete }: FlyingCartParticleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <FlyingCartParticleContent particle={particle} onComplete={onComplete} />,
    document.body
  );
}

/**
 * Container component that manages multiple flying particles
 */
interface FlyingCartParticlesProps {
  particles: FlyingParticle[];
  onParticleComplete: (id: string) => void;
}

export function FlyingCartParticles({ particles, onParticleComplete }: FlyingCartParticlesProps) {
  return (
    <AnimatePresence>
      {particles.map((particle) => (
        <FlyingCartParticle
          key={particle.id}
          particle={particle}
          onComplete={onParticleComplete}
        />
      ))}
    </AnimatePresence>
  );
}
