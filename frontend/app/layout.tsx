import type { Metadata } from 'next';
import { Quicksand, Baloo_2, Caveat } from 'next/font/google';
import { Providers } from '@/lib/providers';
import './globals.css';

/**
 * Tipografías de marca vía next/font (self-hosted en build, sin FOUT de CDN).
 * globals.css ya mapeaba estas variables en @theme; hasta ahora nunca se
 * cargaban las fuentes reales y todo caía al system font.
 *  - Quicksand → --font-sans (texto general, redondeada suave)
 *  - Baloo 2   → --font-display (títulos; personalidad candy)
 *  - Caveat    → --font-handwriting (acentos manuscritos)
 */
const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});
const baloo = Baloo_2({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});
const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-handwriting',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Confitería Quelita',
  description: 'Caramelos, chocolates, bebidas y snacks. Mayorista y detalle en Chile.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${quicksand.variable} ${baloo.variable} ${caveat.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
