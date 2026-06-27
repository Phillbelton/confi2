import Link from 'next/link';
import { Store, Truck, MapPin, ArrowRight } from 'lucide-react';
import { AyudaPage } from '@/components/ayuda/AyudaPage';

export const metadata = {
  title: 'Envíos y retiros · Confitería Quelita',
  description: 'Retira gratis en nuestras tiendas de Macul y Peñalolén, o recibe tu pedido a domicilio coordinando el despacho por WhatsApp.',
};

const TIENDAS = [
  { name: 'Quelita Macul', address: 'San Luis de Macúl 5304, Macul' },
  { name: 'Quelita Peñalolén', address: 'Av. Grecia 6740, Peñalolén' },
];

export default function EnviosYRetirosPage() {
  return (
    <AyudaPage
      title="Envíos y retiros"
      intro="Puedes retirar tu pedido en tienda o recibirlo en tu domicilio."
    >
      {/* Retiro en tienda */}
      <section className="rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
            <Store className="h-5 w-5" />
          </span>
          <h2 className="font-semibold">Retiro en tienda · gratis</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Retiras sin costo en cualquiera de nuestros locales, de lunes a sábado de 08:30 a 20:30.
        </p>
        <ul className="mt-3 space-y-2">
          {TIENDAS.map((s) => (
            <li key={s.name} className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                <span className="font-medium text-foreground">{s.name}</span>
                <span className="text-muted-foreground"> — {s.address}</span>
              </span>
            </li>
          ))}
        </ul>
        <Link
          href="/"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Ver ubicaciones y mapas
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* Envío a domicilio */}
      <section className="rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
            <Truck className="h-5 w-5" />
          </span>
          <h2 className="font-semibold">Envío a domicilio</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Despachamos a tu dirección en Santiago. El costo del despacho depende de la comuna y lo
          coordinamos por WhatsApp al confirmar tu pedido.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        Los tiempos de entrega y la cobertura se confirman por WhatsApp según tu zona.
      </p>
    </AyudaPage>
  );
}
