'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { OrderFilters } from '@/components/funcionario/orders/OrderFilters';
import { OrdersTable } from '@/components/funcionario/orders/OrdersTable';
import { useFuncionarioOrders } from '@/hooks/funcionario/useFuncionarioOrders';
import { RefreshCw } from 'lucide-react';
import type { OrderStatus } from '@/types/order';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function OrdenesPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filters, setFilters] = useState<{
    status?: OrderStatus | '';
    deliveryMethod?: 'pickup' | 'delivery' | '';
    paymentMethod?: 'cash' | 'transfer' | '';
    search?: string;
  }>({});

  // Build params based on active tab and filters
  const getParams = () => {
    const params: any = {
      page,
      limit: 10,
    };

    // Apply tab filter
    if (activeTab === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      params.startDate = today.toISOString();
    } else if (activeTab === 'pending') {
      params.status = 'pending_whatsapp';
    } else if (activeTab === 'in_progress') {
      // confirmed, preparing, shipped
      params.status = 'confirmed,preparing,shipped';
    } else if (activeTab === 'completed') {
      params.status = 'completed';
    }

    // Apply manual filters (override tab filters)
    if (filters.status) params.status = filters.status;
    if (filters.deliveryMethod) params.deliveryMethod = filters.deliveryMethod;
    if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
    if (filters.search) params.search = filters.search;

    return params;
  };

  const { orders, pagination, isLoading, markWhatsAppSent, isMarkingWhatsApp, refetch } =
    useFuncionarioOrders(getParams());

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setFilters({}); // Clear manual filters when changing tabs
    setPage(1);
  };

  const handleMarkWhatsApp = (orderId: string) => {
    markWhatsAppSent({ id: orderId });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Órdenes</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gestión completa de órdenes
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Tabs for quick filters */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="in_progress">En Proceso</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Órdenes
                  {pagination && (
                    <span className="text-sm font-normal text-slate-500 ml-2">
                      ({pagination.total} total)
                    </span>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <OrdersTable
                orders={orders}
                isLoading={isLoading}
                onMarkWhatsApp={handleMarkWhatsApp}
              />

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={
                            page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          // Show first, last, current, and adjacent pages
                          return (
                            p === 1 ||
                            p === pagination.totalPages ||
                            Math.abs(p - page) <= 1
                          );
                        })
                        .map((p, i, arr) => {
                          // Add ellipsis if there's a gap
                          const prevPage = arr[i - 1];
                          const showEllipsis = prevPage && p - prevPage > 1;

                          return (
                            <div key={p} className="flex items-center">
                              {showEllipsis && (
                                <PaginationItem>
                                  <span className="px-4">...</span>
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  onClick={() => setPage(p)}
                                  isActive={page === p}
                                  className="cursor-pointer"
                                >
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            </div>
                          );
                        })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((p) => Math.min(pagination.totalPages, p + 1))
                          }
                          className={
                            page === pagination.totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
