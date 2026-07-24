/**
 * Kit compartido del panel admin.
 *
 * Todas las vistas de `app/admin` consumen estos componentes para que el
 * panel se vea y se comporte igual en todos lados, en vez de resolver cada
 * pantalla por su cuenta.
 */
export { PageHeader, type Crumb } from './PageHeader';
export { StatCard, type StatTone } from './StatCard';
export { EmptyState } from './EmptyState';
export { ConfirmProvider, useConfirm, type ConfirmOptions } from './ConfirmDialog';
