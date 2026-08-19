import Link from 'next/link';
import { AyudaPage } from '@/components/ayuda/AyudaPage';
import { AvisoPendientes, Dato } from '@/components/legal/Pendientes';
import { LegalSection } from '@/components/legal/LegalSection';
import { legalUpdatedAt, legalValue } from '@/lib/legal';

export const metadata = {
  title: 'Política de privacidad · Confitería Quelita',
  description:
    'Qué datos personales guarda Confitería Quelita, para qué los usa, con quién los comparte y cómo puedes pedir acceso, corrección o eliminación.',
};

export default function PrivacidadPage() {
  const emailDatos = legalValue('emailDatos');

  return (
    <AyudaPage
      title="Política de privacidad"
      intro={`Qué datos tuyos guardamos, para qué y cómo puedes pedirlos o eliminarlos. Última actualización: ${legalUpdatedAt}.`}
    >
      <AvisoPendientes />

      <LegalSection n={1} title="Quién es responsable de tus datos">
        <p>
          El responsable del tratamiento de tus datos personales es{' '}
          <Dato k="razonSocial" />, RUT <Dato k="rut" />, con domicilio en{' '}
          <Dato k="direccionComercial" />, que opera como «Confitería Quelita».
        </p>
        <p>
          Para cualquier tema relacionado con tus datos, escríbenos a{' '}
          {emailDatos ? (
            <a
              href={`mailto:${emailDatos}`}
              className="font-medium text-primary hover:underline"
            >
              {emailDatos}
            </a>
          ) : (
            <Dato k="emailDatos" />
          )}
          .
        </p>
      </LegalSection>

      <LegalSection n={2} title="Qué datos guardamos">
        <p>Cuando compras o creas una cuenta, guardamos:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Tu nombre y tu teléfono, para poder contactarte por el pedido.</li>
          <li>
            Tu correo electrónico, si nos lo das (es obligatorio solo si creas
            una cuenta).
          </li>
          <li>
            La dirección de despacho que ingreses, cuando pides envío a
            domicilio.
          </li>
          <li>
            Las notas que escribas en el pedido y el historial de tus compras.
          </li>
          <li>
            Tu contraseña, guardada siempre cifrada: no la almacenamos en texto
            legible y nadie del equipo puede verla.
          </li>
        </ul>
        <p>
          <strong className="text-foreground">
            No pedimos ni guardamos datos de tarjetas de crédito o débito.
          </strong>{' '}
          No procesamos pagos en línea: se paga en efectivo al recibir o por
          transferencia, coordinada directamente contigo.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Para qué los usamos">
        <p>
          Usamos tus datos únicamente para operar tu compra: preparar y entregar
          el pedido, contactarte por WhatsApp o correo para confirmarlo y avisarte
          de su estado, emitir la boleta y responder tus consultas o reclamos.
        </p>
        <p>
          La base para tratarlos es la ejecución del pedido que nos encargaste.
          Si en algún momento quisiéramos usarlos para otra cosa —por ejemplo,
          mandarte promociones— te lo pediríamos antes y podrías negarte sin que
          eso afecte tus compras.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Con quién los compartimos">
        <p>
          <strong className="text-foreground">
            No vendemos, arrendamos ni cedemos tus datos a terceros con fines
            publicitarios.
          </strong>{' '}
          Los comparten solo los servicios que necesitamos para funcionar:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            WhatsApp (Meta), cuando la conversación por el pedido pasa por ese
            canal.
          </li>
          <li>
            El servicio de correo con el que enviamos los avisos de tu pedido.
          </li>
          <li>El proveedor donde está alojado el sitio y la base de datos.</li>
        </ul>
        <p>
          También podemos entregarlos si una autoridad competente nos lo exige por
          ley.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Cookies y datos guardados en tu navegador">
        <p>
          Para mantener tu sesión abierta guardamos en tu navegador un
          identificador temporal, mediante cookies técnicas y almacenamiento
          local. Es{' '}
          <strong className="text-foreground">estrictamente necesario</strong>{' '}
          para que no tengas que iniciar sesión en cada página, y también
          guardamos ahí el contenido de tu carrito para que no se pierda. Se
          elimina cuando cierras sesión y, si no lo haces, expira por su cuenta.
        </p>
        <p>
          No usamos cookies de publicidad, ni de redes sociales, ni de rastreo
          entre sitios, y no hay servicios de terceros siguiendo tu navegación.
          Por eso no te mostramos un cartel de cookies: no hay nada que
          consentir. Si eso cambiara, lo avisaríamos acá y te pediríamos permiso
          antes.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Cuánto tiempo los guardamos">
        <p>
          Los datos de tu cuenta se mantienen mientras la cuenta exista. Los datos
          de los pedidos los conservamos el tiempo que nos exigen las
          obligaciones tributarias y contables, incluso si cierras tu cuenta,
          porque respaldan una venta ya realizada.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Tus derechos">
        <p>Sobre tus datos personales puedes pedirnos en cualquier momento:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong className="text-foreground">Acceso:</strong> saber qué datos
            tuyos tenemos.
          </li>
          <li>
            <strong className="text-foreground">Rectificación:</strong> corregir
            los que estén mal o desactualizados.
          </li>
          <li>
            <strong className="text-foreground">Eliminación:</strong> borrarlos,
            salvo los que debamos conservar por ley.
          </li>
          <li>
            <strong className="text-foreground">Oposición:</strong> pedirnos que
            dejemos de usarlos para un fin determinado.
          </li>
        </ul>
        <p>
          Escríbenos a{' '}
          {emailDatos ? (
            <a
              href={`mailto:${emailDatos}`}
              className="font-medium text-primary hover:underline"
            >
              {emailDatos}
            </a>
          ) : (
            <Dato k="emailDatos" />
          )}{' '}
          indicando qué necesitas. Te respondemos dentro de los plazos que fija
          la ley y sin costo. Parte de esto también lo puedes hacer solo desde{' '}
          <Link
            href="/perfil"
            className="font-medium text-primary hover:underline"
          >
            tu perfil
          </Link>
          . Si no quedas conforme con nuestra respuesta, puedes reclamar ante la
          autoridad de protección de datos personales.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Cómo los protegemos">
        <p>
          Las contraseñas se guardan cifradas con un algoritmo de hash, la
          conexión con el sitio va cifrada, y el acceso al panel de
          administración está restringido al personal autorizado y queda
          registrado: sabemos quién modificó cada pedido y cuándo.
        </p>
        <p>
          Ningún sistema es infalible, pero si detectáramos un incidente que
          afecte tus datos, te lo informaríamos.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Menores de edad">
        <p>
          Nuestros productos se venden a cualquier persona, pero las cuentas y los
          pedidos están pensados para mayores de 18 años. Si eres menor, pídele a
          quien te cuida que haga la compra.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Cambios a esta política">
        <p>
          Si actualizamos esta política, publicamos la nueva versión en esta
          página con su fecha. Si el cambio es importante para ti, te avisaremos
          por los canales que uses con nosotros.
        </p>
        <p>
          Las condiciones de la compra están en los{' '}
          <Link
            href="/ayuda/terminos"
            className="font-medium text-primary hover:underline"
          >
            Términos y condiciones
          </Link>
          .
        </p>
      </LegalSection>
    </AyudaPage>
  );
}
