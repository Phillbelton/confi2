import { useState, useCallback } from 'react';
import type { FlyingParticle } from '@/components/cart/FlyingCartParticle';

/**
 * Hook to trigger flying cart particle animation
 *
 * @example
 * ```tsx
 * const { triggerFly, particles, removeParticle } = useFlyToCart();
 *
 * // On button click:
 * const buttonRect = buttonRef.current.getBoundingClientRect();
 * const cartRect = cartIconRef.current.getBoundingClientRect();
 * triggerFly(buttonRect, cartRect);
 * ```
 */
export function useFlyToCart() {
  const [particles, setParticles] = useState<FlyingParticle[]>([]);

  const triggerFly = useCallback((
    startElement: DOMRect | Element,
    endElement: DOMRect | Element
  ) => {
    const startRect = startElement instanceof Element
      ? startElement.getBoundingClientRect()
      : startElement;

    const endRect = endElement instanceof Element
      ? endElement.getBoundingClientRect()
      : endElement;

    const newParticle: FlyingParticle = {
      id: `particle-${Date.now()}-${Math.random()}`,
      startX: startRect.left + startRect.width / 2 - 16, // Center - half icon size
      startY: startRect.top + startRect.height / 2 - 16,
      endX: endRect.left + endRect.width / 2 - 16,
      endY: endRect.top + endRect.height / 2 - 16,
    };

    setParticles((prev) => [...prev, newParticle]);
  }, []);

  const removeParticle = useCallback((id: string) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    triggerFly,
    particles,
    removeParticle,
  };
}
