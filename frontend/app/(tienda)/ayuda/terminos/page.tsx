import Link from 'next/link';
import { AyudaPage } from '@/components/ayuda/AyudaPage';
import { AvisoPendientes, Dato } from '@/components/legal/Pendientes';
import { LegalSection } from '@/components/legal/LegalSection';
import { legalUpdatedAt, legalValue } from '@/lib/legal';
import { formatBusinessWhatsapp } from '@/lib/whatsapp';

export const metadata = {
  title: 'Términos y condiciones · Confitería Quelita',
  description:
    'Condiciones de venta de Confitería Quelita: cómo se confirma un pedido, precios por presentación, formas de pago, entregas, cambios y devoluciones.',
};

export default function TerminosPage() {
  const emailDatos = legalValue('emailDatos');

  return (
    <AyudaPage
      title="Términos y condiciones"
      intro={`Condiciones de compra en este sitio. Última actualización: ${legalUpdatedAt}.`}
    >
      <AvisoPendientes />

      <LegalSection n={1} title="Quién te vende">
        <p>
          Este sitio es operado por <Dato k="razonSocial" />, RUT{' '}
          <Dato k="rut" />, con domicilio comercial en{' '}
          <Dato k="direccionComercial" />, que opera bajo el nombre de fantasía
          «Confitería Quelita».
        </p>
        <p>
          Vendemos golosinas y productos de confitería al detalle y por mayor,
          dentro de Chile. Puedes escribirnos por WhatsApp al{' '}
          {formatBusinessWhatsapp()}.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Cómo funciona un pedido">
        <p>
          Cuando confirmas un pedido en el sitio, nos estás enviando una{' '}
          <strong className="text-foreground">solicitud de compra</strong>: te
          mostramos el detalle y queda registrada, pero la venta se cierra
          cuando la confirmamos contigo por WhatsApp.
        </p>
        <p>
          Lo hacemos así porque revisamos disponibilidad real antes de
          comprometer el pedido. Si falta algún producto o cambió el precio, te
          lo avisamos antes de preparar nada y decides si sigues, lo cambias o lo
          anulas sin costo.
        </p>
        <p>
          Puedes pedir sin crear cuenta. En ese caso necesitamos tu nombre y
          teléfono para poder contactarte y coordinar la entrega.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Precios y presentaciones">
        <p>
          Todos los precios están en pesos chilenos (CLP) con IVA incluido, y
          son los que se muestran en el sitio al momento de hacer el pedido.
        </p>
        <p>
          Un mismo producto puede venderse en distintas{' '}
          <strong className="text-foreground">presentaciones</strong> (unidad,
          display, caja), cada una con su propio precio. El precio que ves
          corresponde a la presentación seleccionada, no siempre a una unidad
          suelta. Algunos productos tienen precios por tramo: al llevar más
          cantidad, baja el precio por presentación.
        </p>
        <p>
          Podemos actualizar precios y ofertas en cualquier momento, pero eso
          nunca afecta a un pedido ya confirmado: vale el precio que acordamos
          contigo.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Formas de pago">
        <p>
          Aceptamos efectivo al recibir o retirar el pedido, y transferencia
          bancaria (te enviamos los datos de la cuenta por WhatsApp al confirmar).
          No procesamos pagos con tarjeta en el sitio.
        </p>
        <p>
          Más detalle en{' '}
          <Link
            href="/ayuda/formas-de-pago"
            className="font-medium text-primary hover:underline"
          >
            Formas de pago
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection n={5} title="Entregas y retiros">
        <p>
          Puedes retirar sin costo en nuestras tiendas de Macul y Peñalolén, o
          pedir despacho a domicilio dentro de Santiago. El costo del despacho
          depende de la comuna y lo coordinamos por WhatsApp antes de preparar el
          pedido.
        </p>
        <p>
          Los plazos de entrega son estimados y se confirman según tu zona y la
          disponibilidad de los productos. Direcciones, horarios y cobertura en{' '}
          <Link
            href="/ayuda/envios-y-retiros"
            className="font-medium text-primary hover:underline"
          >
            Envíos y retiros
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection n={6} title="Cambios, devoluciones y productos en mal estado">
        <p>
          <Dato k="devoluciones" />
        </p>
      </LegalSection>

      <LegalSection n={7} title="Tu cuenta">
        <p>
          Para crear una cuenta necesitas entregar datos reales y mantener tu
          contraseña en secreto: los pedidos hechos desde tu cuenta se consideran
          hechos por ti. Si crees que alguien más entró a tu cuenta, avísanos por
          WhatsApp y la bloqueamos.
        </p>
        <p>
          Puedes pedir que eliminemos tu cuenta cuando quieras
          {emailDatos ? (
            <>
              {' '}
              escribiendo a{' '}
              <a
                href={`mailto:${emailDatos}`}
                className="font-medium text-primary hover:underline"
              >
                {emailDatos}
              </a>
            </>
          ) : (
            <>
              {' '}
              escribiendo a <Dato k="emailDatos" />
            </>
          )}
          . Podemos suspender cuentas que usen el sitio para fines fraudulentos o
          que dañen la operación.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Uso del sitio y contenidos">
        <p>
          El nombre «Confitería Quelita», el logo, los textos y las fotografías
          del sitio son de nuestra propiedad o los usamos con autorización. Las
          marcas de los productos que vendemos pertenecen a sus respectivos
          fabricantes.
        </p>
        <p>
          Puedes usar el sitio para comprar y para informarte. No está permitido
          copiar el catálogo de forma automatizada, ni usar el sitio de una
          manera que afecte su funcionamiento o el de otros clientes.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Cambios a estos términos">
        <p>
          Podemos actualizar estas condiciones. La versión vigente es siempre la
          publicada en esta página, con su fecha de actualización arriba. A cada
          pedido se le aplican las condiciones que estaban publicadas cuando lo
          hiciste.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Ley aplicable y reclamos">
        <p>
          Estas condiciones se rigen por la ley chilena, en particular la Ley
          19.496 sobre protección de los derechos de los consumidores. Nada de lo
          que dice acá limita los derechos que esa ley te da.
        </p>
        <p>
          Si tienes un problema con un pedido, escríbenos primero por WhatsApp:
          la mayoría se resuelve el mismo día. También puedes reclamar ante el
          SERNAC.
        </p>
        <p>
          Cómo tratamos tus datos personales está en nuestra{' '}
          <Link
            href="/ayuda/privacidad"
            className="font-medium text-primary hover:underline"
          >
            Política de privacidad
          </Link>
          .
        </p>
      </LegalSection>
    </AyudaPage>
  );
}
