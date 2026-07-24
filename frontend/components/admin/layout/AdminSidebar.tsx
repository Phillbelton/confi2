'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Tags,
  Users,
  FileText,
  Activity,
  ChevronLeft,
  Sparkles,
  Upload,
  ImagePlay,
  LayoutGrid,
  Citrus,
  Ruler,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminStore } from '@/store/useAdminStore';

type UserRole = 'admin' | 'funcionario' | 'cliente';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  /** Coincidencia exacta: para rutas raíz que si no matchean a todo. */
  exact?: boolean;
}

interface NavGroup {
  /** Sin label = grupo suelto arriba de todo (el Panel). */
  label?: string;
  items: NavItem[];
}

const ADMIN_ONLY: UserRole[] = ['admin'];

/**
 * Navegación agrupada por tarea, no por entidad: primero lo que se toca todos
 * los días (pedidos), después el catálogo, la vitrina y por último el sistema.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { title: 'Panel', href: '/admin', icon: LayoutDashboard, roles: ADMIN_ONLY, exact: true },
      { title: 'Pedidos', href: '/admin/ordenes', icon: ShoppingCart, roles: ADMIN_ONLY },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { title: 'Productos', href: '/admin/productos', icon: Package, roles: ADMIN_ONLY },
      { title: 'Categorías', href: '/admin/categorias', icon: FolderTree, roles: ADMIN_ONLY },
      { title: 'Marcas', href: '/admin/marcas', icon: Tags, roles: ADMIN_ONLY },
      { title: 'Colecciones', href: '/admin/colecciones', icon: Sparkles, roles: ADMIN_ONLY },
      { title: 'Sabores', href: '/admin/sabores', icon: Citrus, roles: ADMIN_ONLY },
      { title: 'Formatos', href: '/admin/formatos', icon: Ruler, roles: ADMIN_ONLY },
      { title: 'Importar', href: '/admin/importar', icon: Upload, roles: ADMIN_ONLY },
    ],
  },
  {
    label: 'Tienda',
    items: [
      { title: 'Banners y promos', href: '/admin/banners', icon: ImagePlay, roles: ADMIN_ONLY },
      { title: 'Apariencia', href: '/admin/apariencia', icon: LayoutGrid, roles: ADMIN_ONLY },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { title: 'Usuarios', href: '/admin/usuarios', icon: Users, roles: ADMIN_ONLY },
      { title: 'Reportes', href: '/admin/reportes', icon: FileText, roles: ADMIN_ONLY },
      { title: 'Auditoría', href: '/admin/auditoria', icon: Activity, roles: ADMIN_ONLY },
    ],
  },
];

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + '/');
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, mobileNavOpen, setMobileNavOpen, user } =
    useAdminStore();

  // El cajón móvil siempre va expandido; en escritorio manda `sidebarOpen`.
  const expanded = sidebarOpen || mobileNavOpen;

  const role = user?.role as UserRole | undefined;
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => (role ? item.roles.includes(role) : false)),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <aside
        data-testid="admin-sidebar"
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border',
          'transition-[transform,width] duration-200',
          // Móvil: cajón que entra desde la izquierda. Escritorio: siempre
          // visible, y `sidebarOpen` solo decide si va expandido o en rail.
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
          sidebarOpen ? 'md:w-64' : 'md:w-16'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Marca */}
          <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-3">
            {expanded && (
              <Link
                href="/admin"
                onClick={() => setMobileNavOpen(false)}
                className="flex min-w-0 items-center gap-2.5 rounded-md px-1 py-1"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm font-bold">
                  Q
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate font-semibold">Quelita</span>
                  <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                    Admin
                  </span>
                </span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
              title={`${sidebarOpen ? 'Colapsar' : 'Expandir'} menú  [`}
              className={cn('hidden md:flex', !sidebarOpen && 'mx-auto')}
            >
              <ChevronLeft
                className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')}
              />
            </Button>
          </div>

          {/* Navegación */}
          <ScrollArea className="flex-1 px-2 py-3">
            <nav className="flex flex-col gap-4">
              {groups.map((group, groupIndex) => (
                <div key={group.label ?? `grupo-${groupIndex}`} className="flex flex-col gap-0.5">
                  {group.label && expanded && (
                    <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                  )}
                  {group.label && !expanded && (
                    <div className="mx-auto my-1 h-px w-6 bg-sidebar-border" aria-hidden />
                  )}

                  {group.items.map((item) => {
                    const active = isItemActive(pathname, item);
                    const Icon = item.icon;

                    const link = (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        data-testid={`nav-${item.href.split('/').pop() || 'panel'}`}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent',
                          !expanded && 'justify-center px-0'
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                        {expanded && <span className="truncate">{item.title}</span>}
                      </Link>
                    );

                    // Colapsado el texto no se ve: el tooltip es la única pista.
                    return expanded ? (
                      link
                    ) : (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </nav>
          </ScrollArea>
        </div>
      </aside>

      {/* Capa para cerrar el cajón en móvil */}
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
    </>
  );
}
