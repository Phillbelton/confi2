'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Package, Search, Filter, ChevronRight, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useMyOrders, getOrderStatusConfig } from '@/hooks/client/useClientOrders';
import type { Order, OrderStatus } from '@/types/order';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending_whatsapp', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'preparing', label: 'En preparación' },
  { value: 'shipped', label: 'Enviados' },
  { value: 'completed', label: 'Completados' },
  { value: 'cancelled', label: 'Cancelados' },
];

export default function MyOrdersPage() {
  const { data: ordersData, isLoading, error, refetch } = useMyOrders();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const orders: Order[] = ordersData?.data || [];

  // Filtrar órdenes
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  if (isLoading) {
    return <OrdersListSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Error al cargar pedidos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          No pudimos cargar tus pedidos. Por favor, intenta de nuevo.
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">Mis pedidos</h1>
        <p className="text-muted-foreground">
          Historial y seguimiento de tus compras
        </p>
      </motion.div>

      {/* Filtros */}
      <motion.div variants={itemVariants} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por número..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 relative">
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Filtrar pedidos</SheetTitle>
            </SheetHeader>

            <div className="py-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Estado</Label>
                <RadioGroup
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
                  className="space-y-2"
                >
                  {statusFilters.map(({ value, label }) => (
                    <div key={value} className="flex items-center space-x-3">
                      <RadioGroupItem value={value} id={`status-${value}`} />
                      <Label htmlFor={`status-${value}`} className="font-normal">
                        {label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div className="flex gap-3 mt-auto">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                Limpiar
              </Button>
              <Button
                className="flex-1"
                onClick={() => setFilterSheetOpen(false)}
              >
                Aplicar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>

      {/* Lista de órdenes */}
      {filteredOrders.length === 0 ? (
        <motion.div variants={itemVariants}>
          <EmptyState hasFilters={statusFilter !== 'all' || searchQuery !== ''} />
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} className="space-y-3">
          {filteredOrders.map((order) => (
            <motion.div key={order._id} variants={itemVariants}>
              <OrderCard order={order} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const statusConfig = getOrderStatusConfig(order.status);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Link href={`/mis-ordenes/${order.orderNumber}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-sm">#{order.orderNumber}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(order.createdAt)} • {order.items.length} producto
                {order.items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={cn('text-xs', statusConfig.bgColor, statusConfig.textColor)}
            >
              {statusConfig.label}
            </Badge>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 mb-3">
            {order.items.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0"
              >
                {item.variantSnapshot?.image ? (
                  <Image
                    src={item.variantSnapshot.image}
                    alt={item.variantSnapshot.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-muted-foreground">
                  +{order.items.length - 3}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="font-bold">${order.total.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-sm text-primary">
              Ver detalle
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {hasFilters ? 'Sin resultados' : 'Aún no tienes pedidos'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        {hasFilters
          ? 'No encontramos pedidos con esos filtros. Intenta con otros criterios.'
          : 'Cuando realices tu primera compra, podrás verla y seguirla aquí.'}
      </p>
      {!hasFilters && (
        <Button asChild>
          <Link href="/productos">Explorar productos</Link>
        </Button>
      )}
    </div>
  );
}

function OrdersListSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-8 w-36 mb-1" />
        <Skeleton className="h-5 w-56" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex gap-2 mb-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
