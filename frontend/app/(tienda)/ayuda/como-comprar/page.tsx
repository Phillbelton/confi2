import { AyudaPage } from '@/components/ayuda/AyudaPage';

export const metadata = {
  title: 'Cómo comprar · Confitería Quelita',
  description: 'Comprar en Quelita es rápido y sin cuenta: explora el catálogo, elige presentación y cantidad, y confirmamos por WhatsApp.',
};

const PASOS = [
  {
    t: 'Explora el catálogo',
    d: 'Navega por categorías o usa el buscador. Muchos productos se venden en distintas presentaciones (por unidad, display o caja), cada una con su propio precio.',
  },
  {
    t: 'Elige presentación y cantidad',
    d: 'En cada producto eliges cómo lo quieres llevar (por unidad, display o caja) y la cantidad. Al alcanzar un tramo por volumen, el precio por unidad baja automáticamente: verás los tramos de descuento en cada producto.',
  },
  {
    t: 'Agrega al carrito',
    d: 'El carrito calcula el total aplicando de forma automática los descuentos por cantidad de cada presentación.',
  },
  {
    t: 'Completa tus datos',
    d: 'En el checkout ingresas tus datos de contacto, eliges retiro en tienda o envío a domicilio, y la forma de pago (efectivo o transferencia). No necesitas crear una cuenta.',
  },
  {
    t: 'Confirma por WhatsApp',
    d: 'Al finalizar te conectamos por WhatsApp para coordinar los últimos detalles y confirmar tu pedido. Ahí resolvemos cualquier duda de stock, despacho o pago.',
  },
  {
    t: 'Paga y recibe',
    d: 'Pagas al recibir o retirar (efectivo), o por transferencia con los datos que te enviamos. Luego retiras en tienda o te lo despachamos a domicilio.',
  },
];

export default function ComoComprarPage() {
  return (
    <AyudaPage
      title="Cómo comprar"
      intro="Comprar en Quelita es rápido y no necesitas cuenta. Estos son los pasos:"
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
