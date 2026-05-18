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
    <div className="flex items-end justify-between gap-2 px-4 pb-2 pt-5 lg:px-8 lg:pt-10 lg:pb-4">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold leading-tight lg:text-3xl">
          {emoji && <span className="mr-1.5" aria-hidden>{emoji}</span>}
          {title}
        </h2>
        {subtitle && (
          <p className="line-clamp-1 text-xs text-muted-foreground lg:text-sm">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="tappable shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 lg:px-4 lg:py-2 lg:text-sm"
        >
          Ver todo
          <ChevronRight className="ml-0.5 inline h-3.5 w-3.5 lg:h-4 lg:w-4" />
        </Link>
      )}
    </div>
  );
}
