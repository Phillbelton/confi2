'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  Download,
  Calendar,
} from 'lucide-react';
import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function EstadisticasPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Mock data - En producción vendría de la API
  const statsCards = [
    {
      title: 'Órdenes Procesadas',
      value: '127',
      change: '+12%',
      trend: 'up' as const,
      icon: Package,
      description: 'vs. mes anterior',
    },
    {
      title: 'Ventas Totales',
      value: '₲ 45.5M',
      change: '+8%',
      trend: 'up' as const,
      icon: DollarSign,
      description: 'vs. mes anterior',
    },
    {
      title: 'Tiempo Promedio',
      value: '2.4h',
      change: '-15%',
      trend: 'down' as const,
      icon: Clock,
      description: 'confirmación órdenes',
    },
    {
      title: 'Tasa de Éxito',
      value: '94.2%',
      change: '+2%',
      trend: 'up' as const,
      icon: CheckCircle,
      description: 'órdenes completadas',
    },
  ];

  // Datos para gráfico de órdenes por día
  const ordersPerDayData = [
    { day: 'Lun', ordenes: 18, completadas: 16, canceladas: 2 },
    { day: 'Mar', ordenes: 22, completadas: 20, canceladas: 2 },
    { day: 'Mié', ordenes: 15, completadas: 14, canceladas: 1 },
    { day: 'Jue', ordenes: 28, completadas: 25, canceladas: 3 },
    { day: 'Vie', ordenes: 32, completadas: 30, canceladas: 2 },
    { day: 'Sáb', ordenes: 25, completadas: 23, canceladas: 2 },
    { day: 'Dom', ordenes: 12, completadas: 11, canceladas: 1 },
  ];

  // Datos para gráfico de ventas
  const salesData = [
    { mes: 'Ene', ventas: 32000000, ordenes: 98 },
    { mes: 'Feb', ventas: 35000000, ordenes: 105 },
    { mes: 'Mar', ventas: 38000000, ordenes: 115 },
    { mes: 'Abr', ventas: 42000000, ordenes: 127 },
    { mes: 'May', ventas: 45500000, ordenes: 142 },
  ];

  // Datos para distribución de estados
  const statusDistribution = [
    { name: 'Completadas', value: 120, color: '#10b981' },
    { name: 'En Proceso', value: 15, color: '#3b82f6' },
    { name: 'Pendientes', value: 8, color: '#eab308' },
    { name: 'Canceladas', value: 7, color: '#ef4444' },
  ];

  // Datos de métodos de pago
  const paymentMethods = [
    { name: 'Efectivo', value: 85, color: '#10b981' },
    { name: 'Transferencia', value: 65, color: '#3b82f6' },
  ];

  // Top productos
  const topProducts = [
    { name: 'Producto Premium XL', sold: 45, revenue: 12500000 },
    { name: 'Kit Esencial Plus', sold: 38, revenue: 9500000 },
    { name: 'Bundle Familiar', sold: 32, revenue: 8000000 },
    { name: 'Producto Básico', sold: 28, revenue: 4200000 },
    { name: 'Edición Especial', sold: 22, revenue: 7700000 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Análisis de tu desempeño y métricas clave
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Selecciona período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={`gap-1 ${
                      stat.trend === 'up'
                        ? 'text-green-600 border-green-600'
                        : 'text-green-600 border-green-600'
                    }`}
                  >
                    {stat.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {stat.change}
                  </Badge>
                  <p className="text-xs text-slate-500">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Órdenes</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="distribution">Distribución</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>

        {/* Órdenes Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Órdenes por Día</CardTitle>
              <CardDescription>
                Comparación de órdenes totales, completadas y canceladas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={ordersPerDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ordenes" name="Total Órdenes" fill="#3b82f6" />
                  <Bar dataKey="completadas" name="Completadas" fill="#10b981" />
                  <Bar dataKey="canceladas" name="Canceladas" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ventas Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ventas</CardTitle>
                <CardDescription>Evolución mensual de ventas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) =>
                        `₲ ${(value / 1000000).toFixed(1)}M`
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="ventas"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorVentas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Órdenes vs Ventas</CardTitle>
                <CardDescription>Correlación mensual</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="ordenes"
                      name="Órdenes"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="ventas"
                      name="Ventas (₲)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribución Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
                <CardDescription>Órdenes en cada estado</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pago</CardTitle>
                <CardDescription>Distribución de pagos</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Productos Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Productos</CardTitle>
              <CardDescription>Productos más vendidos este mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between pb-4 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-slate-500">{product.sold} unidades vendidas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ₲ {(product.revenue / 1000000).toFixed(1)}M
                      </p>
                      <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{
                            width: `${(product.sold / topProducts[0].sold) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights de Desempeño</CardTitle>
          <CardDescription>Análisis automático de tus métricas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Excelente tiempo de respuesta
              </p>
              <p className="text-sm text-green-800 dark:text-green-200">
                Tu tiempo promedio de confirmación ha mejorado un 15% este mes. ¡Sigue así!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Alta tasa de finalización
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                El 94.2% de tus órdenes se completan exitosamente. Esto está por encima del promedio.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                Pico de actividad: Viernes
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Los viernes tienen el mayor volumen de órdenes. Considera planificar recursos adicionales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
