import Link from 'next/link';
import type { ReactNode } from 'react';
import { Facebook, Instagram } from 'lucide-react';
import { TikTokIcon, GoogleIcon } from '@/components/icons/BrandIcons';
import { cn } from '@/lib/utils';

/**
 * Redes sociales de Confitería Quelita, compartidas entre Footer (desktop) y
 * MobileFooter. El estilo del botón se pasa con `itemClassName` para que cada
 * footer mantenga su forma (círculo / rounded-2xl, tamaños, etc.).
 */
const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/confiteria.quelita/',
    Icon: Facebook,
    hover: 'hover:bg-primary',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/confiteria_quelita/',
    Icon: Instagram,
    hover: 'hover:bg-accent',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@confiteria.quelit',
    Icon: TikTokIcon,
    hover: 'hover:bg-primary',
  },
  {
    label: 'Google',
    href: 'https://www.google.com/search?sa=X&sca_esv=65099a26cb01af4e&kgmid=/g/1tz775fp&q=CONFITERIA+QUELITA',
    Icon: GoogleIcon,
    hover: 'hover:bg-white',
  },
] as const;

interface SocialLinksProps {
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
  /** Contenido extra dentro del mismo contenedor flex (ej. botón de email). */
  extra?: ReactNode;
}

export function SocialLinks({ className, itemClassName, iconClassName, extra }: SocialLinksProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
      {SOCIALS.map(({ label, href, Icon, hover }) => (
        <Link
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={cn('flex items-center justify-center transition-all', hover, itemClassName)}
        >
          <Icon className={iconClassName} aria-hidden />
        </Link>
      ))}
      {extra}
    </div>
  );
}
