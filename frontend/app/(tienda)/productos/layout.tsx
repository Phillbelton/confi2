import type { Metadata } from 'next';

// La página del catálogo es client component, así que el título vive
// acá. Las fichas de producto lo sobreescriben en su propio layout.
export const metadata: Metadata = {
  title: 'Catálogo · Quelita',
  description:
    'Catálogo completo de Confitería Quelita: caramelos, chocolates, snacks y bebidas con descuentos por mayor. Envíos a todo Chile.',
};

export default function ProductosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
