import { Banknote, ArrowLeftRight } from 'lucide-react';
import { AyudaPage } from '@/components/ayuda/AyudaPage';

export const metadata = {
  title: 'Formas de pago · Confitería Quelita',
  description: 'Pagá en efectivo al recibir tu pedido o por transferencia bancaria (te enviamos los datos por WhatsApp).',
};

const METODOS = [
  {
    Icon: Banknote,
    t: 'Efectivo',
    d: 'Pagás al recibir el pedido o al retirarlo en tienda. Sin recargo.',
  },
  {
    Icon: ArrowLeftRight,
    t: 'Transferencia bancaria',
    d: 'Al confirmar tu pedido te enviamos los datos de la cuenta por WhatsApp. Nos mandás el comprobante y preparamos tu pedido.',
  },
];

export default function FormasDePagoPage() {
  return (
    <AyudaPage
      title="Formas de pago"
      intro="Aceptamos dos formas de pago. Elegís la que prefieras al confirmar tu pedido."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {METODOS.map(({ Icon, t, d }) => (
          <div key={t} className="rounded-2xl border border-border p-5">
            <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="font-semibold">{t}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Para compras por mayor coordinamos el medio que más te convenga directamente por WhatsApp.
      </p>
    </AyudaPage>
  );
}
