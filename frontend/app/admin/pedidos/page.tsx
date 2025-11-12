'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  CheckCircle,
  Package,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { orderService } from '@/services/orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Order } from '@/types';

const statusConfig = {
  pending: {
    label: 'Pendiente',
    variant: 'secondary' as const,
    icon: Clock,
    color: 'text-yellow-600',
  },
  confirmed: {
    label: 'Confirmado',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-blue-600',
  },
  in_preparation: {
    label: 'En preparación',
    variant: 'default' as const,
    icon: Package,
    color: 'text-purple-600',
  },
  ready_for_pickup: {
    label: 'Listo para retiro',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-600',
  },
  in_delivery: {
    label: 'En camino',
    variant: 'default' as const,
    icon: Package,
    color: 'text-indigo-600',
  },
  completed: {
    label: 'Completado',
    variant: 'outline' as const,
    icon: CheckCircle,
    color: 'text-green-700',
  },
  cancelled: {
    label: 'Cancelado',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600',
  },
};

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Build query params
  const queryParams: any = { page, limit };
  if (search) queryParams.search = search;
  if (status !== 'all') queryParams.status = status;

  // Fetch orders
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', page, search, status],
    queryFn: () => orderService.getOrders(queryParams),
  });

  const orders = data?.data?.orders || [];
  const pagination = data?.data?.pagination;

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page
  };

  // Handle status filter
  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1); // Reset to first page
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
          <p className="text-muted-foreground">
            Gestiona todos los pedidos de tu confitería
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, cliente, teléfono..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="in_preparation">En preparación</SelectItem>
                <SelectItem value="ready_for_pickup">Listo para retiro</SelectItem>
                <SelectItem value="in_delivery">En camino</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No se encontraron pedidos</p>
              <p className="text-sm mt-2">
                {search || status !== 'all'
                  ? 'Intenta ajustar los filtros'
                  : 'Los pedidos aparecerán aquí'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: Order) => {
                      const config = statusConfig[order.status];
                      const StatusIcon = config?.icon || AlertCircle;

                      return (
                        <TableRow key={order._id}>
                          <TableCell className="font-mono font-semibold">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{order.customer.name}</div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {order.customer.phone}
                          </TableCell>
                          <TableCell>
                            <Badge variant={config?.variant || 'default'} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {config?.label || order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {order.deliveryMethod === 'pickup' ? 'Retiro' : 'Delivery'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ${order.total.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/admin/pedidos/${order._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(page - 1) * limit + 1} -{' '}
                    {Math.min(page * limit, pagination.total)} de {pagination.total} pedidos
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === pagination.pages}
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
