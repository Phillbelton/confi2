import type { Metadata } from 'next';
import { API_URL } from '@/lib/apiConfig';

// La ficha de producto es client component; el título SEO se resuelve
// acá server-side. Si el backend no responde se cae al título genérico
// sin romper el render.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_URL}/products/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const product = json?.data?.product;
    if (!product?.name) throw new Error('sin producto');
    return {
      title: `${product.name} · Quelita`,
      description:
        product.description?.slice(0, 160) ||
        `Compra ${product.name} con descuentos por mayor en Confitería Quelita.`,
    };
  } catch {
    return { title: 'Producto · Quelita' };
  }
}

export default function ProductoDetalleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
