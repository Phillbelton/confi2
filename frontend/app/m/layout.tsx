import { MobileShell } from '@/components/m/shell/MobileShell';

export const metadata = {
  title: 'Quelita · App',
  description: 'Confitería Quelita — experiencia móvil',
};

export default function MLayout({ children }: { children: React.ReactNode }) {
  return <MobileShell>{children}</MobileShell>;
}
