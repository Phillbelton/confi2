'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { create } from 'zustand';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Tags,
  Sparkles,
  Upload,
  ImagePlay,
  LayoutGrid,
  Users,
  FileText,
  Activity,
  Citrus,
  Ruler,
  Sun,
  Moon,
  type LucideIcon,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { adminProductService } from '@/services/admin/products';
import { adminOrdersService } from '@/services/admin/orders';
import { useAdminStore } from '@/store/useAdminStore';
import { formatCurrency } from '@/lib/utils';

interface CommandPaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

/** Estado global para que el botón del header también pueda abrirlo. */
export const useCommandPalette = create<CommandPaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((state) => ({ open: !state.open })),
}));

const SECTIONS: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: 'Panel', href: '/admin', icon: LayoutDashboard },
  { label: 'Pedidos', href: '/admin/ordenes', icon: ShoppingCart },
  { label: 'Productos', href: '/admin/productos', icon: Package },
  { label: 'Categorías', href: '/admin/categorias', icon: FolderTree },
  { label: 'Marcas', href: '/admin/marcas', icon: Tags },
  { label: 'Colecciones', href: '/admin/colecciones', icon: Sparkles },
  { label: 'Sabores', href: '/admin/sabores', icon: Citrus },
  { label: 'Formatos', href: '/admin/formatos', icon: Ruler },
  { label: 'Importar catálogo', href: '/admin/importar', icon: Upload },
  { label: 'Banners y promos', href: '/admin/banners', icon: ImagePlay },
  { label: 'Apariencia', href: '/admin/apariencia', icon: LayoutGrid },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
  { label: 'Reportes', href: '/admin/reportes', icon: FileText },
  { label: 'Auditoría', href: '/admin/auditoria', icon: Activity },
];

const MIN_QUERY = 2;

/**
 * Buscador global del panel (⌘K / Ctrl+K): salta a cualquier sección y busca
 * productos por nombre o SKU y pedidos por número o cliente.
 */
export function CommandPalette() {
  const router = useRouter();
  const { open, setOpen, toggle } = useCommandPalette();
  const { theme, toggleTheme } = useAdminStore();

  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 250);
  const searching = debouncedQuery.trim().length >= MIN_QUERY;

  // ⌘K / Ctrl+K abre y cierra desde cualquier vista del admin.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  // Cerrar siempre deja el buscador en limpio, así la próxima apertura no
  // arranca con la búsqueda anterior.
  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const { data: products } = useQuery({
    queryKey: ['admin', 'command-palette', 'products', debouncedQuery],
    queryFn: () => adminProductService.list({ search: debouncedQuery, limit: 5 }),
    enabled: open && searching,
    staleTime: 30_000,
  });

  const { data: orders } = useQuery({
    queryKey: ['admin', 'command-palette', 'orders', debouncedQuery],
    queryFn: () => adminOrdersService.getOrders({ search: debouncedQuery, limit: 5 }),
    enabled: open && searching,
    staleTime: 30_000,
  });

  const go = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      title="Buscador del panel"
      description="Salta a una sección o busca productos y pedidos"
    >
      <CommandInput
        placeholder="Buscar sección, producto o pedido…"
        value={query}
        onValueChange={setQuery}
        data-testid="command-input"
      />
      <CommandList>
        <CommandEmpty>
          {searching ? 'Sin resultados.' : 'Escribe para buscar productos y pedidos.'}
        </CommandEmpty>

        <CommandGroup heading="Ir a">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <CommandItem
                key={section.href}
                value={`ir ${section.label}`}
                onSelect={() => go(section.href)}
              >
                <Icon />
                <span>{section.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {products && products.data.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Productos">
              {products.data.map((product) => (
                <CommandItem
                  // El SKU va en el value para que buscar por código también matchee.
                  key={product._id}
                  value={`${product.name} ${product.sku ?? ''}`}
                  onSelect={() => go(`/admin/productos/${product._id}/editar`)}
                >
                  <Package />
                  <span className="truncate">{product.name}</span>
                  {product.sku && (
                    <CommandShortcut className="font-mono">{product.sku}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {orders && orders.data.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Pedidos">
              {orders.data.map((order) => (
                <CommandItem
                  key={order._id}
                  value={`${order.orderNumber} ${order.customer?.name ?? ''}`}
                  onSelect={() => go(`/admin/ordenes/${order._id}`)}
                >
                  <ShoppingCart />
                  <span className="font-mono">{order.orderNumber}</span>
                  <span className="truncate text-muted-foreground">
                    {order.customer?.name}
                  </span>
                  <CommandShortcut className="tabular-nums">
                    {formatCurrency(order.total)}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Preferencias">
          <CommandItem
            value="cambiar tema claro oscuro"
            onSelect={() => {
              toggleTheme();
              close();
            }}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
            <span>Cambiar a tema {theme === 'dark' ? 'claro' : 'oscuro'}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
