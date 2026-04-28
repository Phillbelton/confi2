import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  emoji?: string;
}

export function SectionHeader({ title, subtitle, href, emoji }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-2 px-4 pb-2 pt-5">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold leading-tight">
          {emoji && <span className="mr-1.5" aria-hidden>{emoji}</span>}
          {title}
        </h2>
        {subtitle && (
          <p className="line-clamp-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="tappable shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
        >
          Ver todo
          <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
