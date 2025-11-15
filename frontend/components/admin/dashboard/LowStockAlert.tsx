'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package } from 'lucide-react';
import type { LowStockVariant } from '@/types/admin';

interface LowStockAlertProps {
  variants: LowStockVariant[];
}

export function LowStockAlert({ variants }: LowStockAlertProps) {
  return (
    <Card className="border-orange-200 dark:border-orange-900">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-orange-700 dark:text-orange-400">
            Stock Bajo
          </CardTitle>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
          {variants.length} productos
        </Badge>
      </CardHeader>
      <CardContent>
        {variants.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Package className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Todos los productos tienen stock suficiente
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
              {variants.slice(0, 5).map((variant) => (
                <div
                  key={variant._id}
                  className="flex items-center justify-between p-2 rounded-lg border border-orange-100 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {variant.parent.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      SKU: {variant.sku}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <Badge
                      variant="outline"
                      className="border-orange-500 text-orange-700"
                    >
                      {variant.stock} unidades
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/admin/inventario/bajo-stock">
                Ver todos los productos con stock bajo
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
