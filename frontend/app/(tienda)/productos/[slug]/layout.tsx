import type { Metadata } from 'next';
import { API_URL } from '@/lib/apiConfig';
import { getImageUrl } from '@/lib/images';
import type { Product } from '@/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_NAME = 'Confitería Quelita';

/**
 * Producto para metadata + JSON-LD. `generateMetadata` y el layout piden lo
 * mismo con las mismas opciones, así que el cache de `fetch` de Next lo
 * resuelve en una sola request por render.
 */
async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json?.data?.product as Product) ?? null;
  } catch {
    return null;
  }
}

/** Precios de todas las presentaciones (o el legacy `unitPrice` a secas). */
function priceRange(product: Product): { low: number; high: number; count: number } {
  const prices = (product.presentaciones ?? [])
    .map((p) => p.unitPrice)
    .filter((n) => typeof n === 'number' && n > 0);
  if (prices.length === 0) {
    return { low: product.unitPrice, high: product.unitPrice, count: 1 };
  }
  return { low: Math.min(...prices), high: Math.max(...prices), count: prices.length };
}

// La ficha de producto es client component; el título SEO se resuelve
// acá server-side. Si el backend no responde se cae al título genérico
// sin romper el render.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  // Canónica sin querystring: el catálogo linkea con `?from=…` para los
  // breadcrumbs y sin esto Google ve una URL distinta por cada origen.
  const canonical = `/productos/${slug}`;

  if (!product?.name) {
    return { metadataBase: new URL(SITE_URL), title: 'Producto · Quelita', alternates: { canonical } };
  }

  const title = `${product.name} · Quelita`;
  const description =
    product.description?.slice(0, 160) ||
    `Compra ${product.name} con descuentos por mayor en Confitería Quelita.`;
  // Caddy sirve /uploads en el mismo origen del sitio, así que la URL absoluta
  // del backend es válida como og:image (y en local apunta al :5000 real).
  const images = (product.images ?? [])
    .slice(0, 4)
    .map((img) => getImageUrl(img))
    .filter(Boolean);

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'es_CL',
      url: canonical,
      title,
      description,
      images: images.length > 0 ? images : undefined,
    },
    twitter: {
      card: images.length > 0 ? 'summary_large_image' : 'summary',
      title,
      description,
      images: images.length > 0 ? images : undefined,
    },
  };
}

export default async function ProductoDetalleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  // JSON-LD del producto. Va server-side (no en la página, que es client) para
  // que el crawler lo vea en el HTML inicial sin ejecutar JS.
  let jsonLd: Record<string, unknown> | null = null;
  if (product?.name) {
    const { low, high, count } = priceRange(product);
    const url = `${SITE_URL}/productos/${slug}`;
    const brandName = typeof product.brand === 'object' ? product.brand?.name : undefined;
    // `getProductBySlug` solo devuelve productos activos, así que llegar acá
    // ya implica disponible (el modelo no lleva stock).
    const offerBase = {
      priceCurrency: 'CLP',
      availability: 'https://schema.org/InStock',
      url,
    };
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description || undefined,
      sku: product.sku || undefined,
      image: (product.images ?? []).map((img) => getImageUrl(img)).filter(Boolean),
      brand: brandName ? { '@type': 'Brand', name: brandName } : undefined,
      offers:
        count > 1 && low !== high
          ? {
              '@type': 'AggregateOffer',
              ...offerBase,
              lowPrice: Math.round(low),
              highPrice: Math.round(high),
              offerCount: count,
            }
          : { '@type': 'Offer', ...offerBase, price: Math.round(low) },
    };
  }

  return (
    <>
      {jsonLd && (
        // El <script> va dentro de un wrapper por `dangerouslySetInnerHTML` y no
        // como elemento React: esta ficha se renderiza bajo `MobileShell`, que
        // es client component, y ahí React reconcilia el tag en el cliente y
        // avisa por consola ("scripts are never executed…") en cada render. Así
        // el JSON-LD queda igual en el HTML del servidor —lo que lee el
        // crawler— sin ensuciar la consola. El `<` escapado impide que un
        // nombre de producto cierre el script.
        <div
          hidden
          dangerouslySetInnerHTML={{
            __html: `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(
              /</g,
              '\\u003c'
            )}</script>`,
          }}
        />
      )}
      {children}
    </>
  );
}
