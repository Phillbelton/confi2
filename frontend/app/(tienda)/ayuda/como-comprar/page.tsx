import { AyudaPage } from '@/components/ayuda/AyudaPage';

export const metadata = {
  title: 'Cómo comprar · Confitería Quelita',
  description: 'Comprar en Quelita es rápido y sin cuenta: explorá el catálogo, agregá al carrito y confirmamos por WhatsApp.',
};

const PASOS = [
  {
    t: 'Explorá el catálogo',
    d: 'Navegá por categorías o usá el buscador. Si comprás por mayor, los precios bajan solos por volumen: vas a ver los tramos de descuento por cantidad en cada producto.',
  },
  {
    t: 'Agregá al carrito',
    d: 'Elegí las cantidades que necesitás. El carrito calcula el total aplicando automáticamente los descuentos por cantidad.',
  },
  {
    t: 'Completá tus datos',
    d: 'En el checkout cargás tus datos de contacto, elegís retiro en tienda o envío a domicilio, y la forma de pago (efectivo o transferencia). No hace falta crear una cuenta.',
  },
  {
    t: 'Confirmá por WhatsApp',
    d: 'Al finalizar te conectamos por WhatsApp para coordinar los últimos detalles y confirmar tu pedido. Ahí resolvemos cualquier duda de stock, despacho o pago.',
  },
  {
    t: 'Pagá y recibí',
    d: 'Pagás al recibir o retirar (efectivo), o por transferencia con los datos que te enviamos. Luego retirás en tienda o te lo despachamos a domicilio.',
  },
];

export default function ComoComprarPage() {
  return (
    <AyudaPage
      title="Cómo comprar"
      intro="Comprar en Quelita es rápido y no necesitás cuenta. Estos son los pasos:"
    >
      <ol className="space-y-4">
        {PASOS.map((p, i) => (
          <li key={p.t} className="flex gap-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-base font-bold text-primary">
              {i + 1}
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold leading-tight">{p.t}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{p.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </AyudaPage>
  );
}
