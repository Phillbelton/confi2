import { MobileShell } from '@/components/m/shell/MobileShell';

/**
 * Layout del checkout — envuelve con el shell del storefront para que el
 * cliente conserve acceso al navbar (logo, búsqueda, categorías, carrito,
 * perfil) y pueda seguir agregando productos sin abandonar la cocina.
 *
 * Banderas:
 *  - hideTabBar: la BottomTabBar mobile chocaría con la sticky CTA "Confirmar
 *    Pedido" del checkout. Sin ella, la navegación mobile se hace desde el
 *    StickyHeader (logo + cart + login).
 *  - hideFab:    el CartFab no aporta acá — el carrito ya es parte del flow.
 *  - hideFooter: el checkout tiene su propio <Footer /> (variante completa
 *    del storefront) renderizado dentro de la página.
 */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileShell hideTabBar hideFab hideFooter>
      {children}
    </MobileShell>
  );
}
