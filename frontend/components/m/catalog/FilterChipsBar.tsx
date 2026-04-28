'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsBarProps {
  chips: FilterChip[];
  onClearAll?: () => void;
  className?: string;
}

export function FilterChipsBar({ chips, onClearAll, className }: FilterChipsBarProps) {
  if (chips.length === 0) return null;

  return (
    <div
      className={cn(
        'sticky top-[var(--m-header-h,9.5rem)] z-20 border-b border-border/60 bg-background/95 backdrop-blur',
        className
      )}
    >
      <div className="snap-x-mandatory flex items-center gap-2 overflow-x-auto px-4 py-2 scroll-pl-safe scroll-pr-safe scrollbar-none">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onRemove}
            className="snap-start tappable inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
          >
            {chip.label}
            <X className="h-3 w-3" />
          </button>
        ))}
        {chips.length > 1 && onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="tappable shrink-0 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
