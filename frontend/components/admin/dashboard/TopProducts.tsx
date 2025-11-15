'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TopProduct } from '@/types/admin';

interface TopProductsProps {
  products: TopProduct[];
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Productos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay datos de productos
            </p>
          ) : (
            products.map((product: TopProduct, index: number) => (
              <div
                key={product._id || `product-${index}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                {/* Ranking */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                </div>

                {/* Product Image */}
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-10 h-10 rounded-md object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-muted" />
                )}

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.totalSold} vendidos
                  </p>
                </div>

                {/* Revenue */}
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    ${product.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
