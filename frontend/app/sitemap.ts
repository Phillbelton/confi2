import { MetadataRoute } from 'next'
import { API_URL } from '@/lib/apiConfig'

/** Productos por request al catálogo público. */
const PAGE_SIZE = 500
/** Tope de páginas — red de seguridad, no un límite esperado del catálogo. */
const MAX_PAGES = 20

type SitemapProduct = { slug: string; updatedAt?: string }

/**
 * Slugs de todas las fichas activas, paginando el catálogo público. Si la API
 * no responde devuelve lo que alcanzó a juntar: el sitemap sale con las rutas
 * estáticas en vez de fallar el request completo.
 */
async function fetchProductRoutes(): Promise<SitemapProduct[]> {
  const out: SitemapProduct[] = []
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(
        `${API_URL}/products?limit=${PAGE_SIZE}&page=${page}&active=true`,
        { next: { revalidate: 3600 } }
      )
      if (!res.ok) break
      const json = await res.json()
      const batch: SitemapProduct[] = json?.data?.data ?? []
      out.push(...batch.filter((p) => p?.slug))
      const pagination = json?.data?.pagination
      const hasNext = pagination?.hasNext ?? batch.length === PAGE_SIZE
      if (!hasNext || batch.length === 0) break
    }
  } catch {
    // Sin catálogo el sitemap igual es válido con las rutas estáticas.
  }
  return out
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Rutas estáticas públicas
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/productos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/registro`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Fichas de producto — el catálogo son ~1.400 URLs y ninguna estaba indexada.
  const products = await fetchProductRoutes()
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/productos/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...productRoutes]
}
