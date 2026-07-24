'use client';

import { ProductsAdmin } from '@/components/admin/products/ProductsAdmin';

/**
 * Gestión de productos. Muestra las `presentaciones[]` de cada producto
 * (U×1 · D×6 · E×24) y su precio "desde", con KPIs que filtran la tabla.
 */
export default function ProductosPage() {
  return <ProductsAdmin />;
}
