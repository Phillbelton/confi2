'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getSafeImageUrl } from '@/lib/image-utils';
import { cn } from '@/lib/utils';

interface ProductGalleryMProps {
  images: string[];
  alt: string;
}

export function ProductGalleryM({ images, alt }: ProductGalleryMProps) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const safeImages = images.length > 0 ? images : ['/placeholder-product.svg'];

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  return (
    <section className="relative">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Volver"
        className="tappable absolute left-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="snap-x-mandatory flex aspect-square w-full overflow-x-auto scrollbar-none bg-muted"
      >
        {safeImages.map((src, i) => (
          <div key={`${src}-${i}`} className="relative aspect-square w-full shrink-0 snap-center">
            <Image
              src={getSafeImageUrl(src, { width: 800, height: 800, quality: 'auto' })}
              alt={`${alt} ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-contain p-4"
            />
          </div>
        ))}
      </div>

      {safeImages.length > 1 && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {safeImages.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === activeIndex ? 'w-6 bg-primary' : 'w-1.5 bg-foreground/30'
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
