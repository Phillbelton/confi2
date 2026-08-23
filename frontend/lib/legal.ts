/**
 * Datos legales del negocio y estado de lo que falta completar.
 *
 * Las páginas `/ayuda/terminos` y `/ayuda/privacidad` están redactadas sobre la
 * operación real (formas de pago, envíos, horarios y qué datos guarda de verdad
 * el sistema), pero hay cinco datos que solo puede aportar el negocio.
 *
 * Mientras un valor esté vacío, la página lo muestra resaltado como
 * `[PENDIENTE: …]` y arriba aparece un aviso con la lista de lo que falta. Al
 * completar los cinco, el aviso desaparece solo. **No hay que tocar el JSX de
 * las páginas: se completa acá y listo.**
 */

/** Fecha de última actualización que muestran las dos páginas legales. */
export const legalUpdatedAt = '30 de julio de 2026';

export type LegalKey =
  | 'razonSocial'
  | 'rut'
  | 'direccionComercial'
  | 'emailDatos'
  | 'devoluciones';

type LegalField = {
  /** Etiqueta para el aviso de pendientes y para el placeholder resaltado. */
  label: string;
  /** Valor real. Vacío = pendiente. */
  value: string;
  /** Qué hay que poner acá, para quien lo complete. */
  hint: string;
  /** Párrafo largo (se renderiza respetando los saltos de línea). */
  multiline?: boolean;
};

export const legalData: Record<LegalKey, LegalField> = {
  razonSocial: {
    label: 'Razón social',
    value: '',
    hint: 'Nombre legal de la empresa o persona que emite la boleta (no el nombre de fantasía "Confitería Quelita").',
  },
  rut: {
    label: 'RUT',
    value: '',
    hint: 'RUT de la razón social, con guion y dígito verificador.',
  },
  direccionComercial: {
    label: 'Dirección comercial',
    value: '',
    hint: 'Domicilio legal de la empresa. Puede ser el de una de las tiendas (Macul o Peñalolén) si ahí está el domicilio comercial.',
  },
  emailDatos: {
    label: 'Correo de contacto para datos personales',
    value: '',
    hint: 'Casilla donde los clientes piden acceso, rectificación o eliminación de sus datos. Conviene un correo propio (ej. contacto@…) y no solo el WhatsApp, porque tiene que quedar registro escrito.',
  },
  devoluciones: {
    label: 'Política de devoluciones y cambios',
    value: '',
    multiline: true,
    hint: 'Decidir en cuántos días se aceptan cambios, en qué estado tiene que venir el producto y qué pasa con alimentos abiertos. Ojo: en venta a distancia la ley del consumidor da derecho a retracto de 10 días con excepciones, y en alimentos hay matices — conviene revisarlo con un abogado antes de publicar. Hay un borrador sugerido en el comentario de abajo.',
  },
};

/*
 * Borrador sugerido para `devoluciones` (revisar antes de usar, no es asesoría
 * legal). Para usarlo, pegar el texto como `value` del campo:
 *
 *   "Si un producto llega en mal estado, vencido o no corresponde a lo que
 *    pediste, escríbenos por WhatsApp dentro de las 48 horas siguientes a
 *    recibirlo y lo reemplazamos o te devolvemos el dinero, sin costo para ti.
 *
 *    Para cambios por otro motivo, aceptamos devoluciones dentro de 10 días
 *    corridos desde la entrega, siempre que el producto esté sin abrir, en su
 *    envase original y en condiciones de reventa. Por seguridad alimentaria no
 *    podemos aceptar la devolución de productos abiertos o con el envase
 *    dañado, salvo que el problema sea justamente el estado del producto.
 *
 *    Las devoluciones de dinero se hacen por el mismo medio de pago que usaste,
 *    dentro de los 10 días hábiles siguientes a que recibamos el producto."
 */

/** Valor limpio de un campo, o cadena vacía si está pendiente. */
export function legalValue(key: LegalKey): string {
  return legalData[key].value.trim();
}

/** Campos que todavía no tienen dato, en el orden en que se declararon. */
export function legalPendientes(): Array<LegalField & { key: LegalKey }> {
  return (Object.keys(legalData) as LegalKey[])
    .map((key) => ({ key, ...legalData[key] }))
    .filter((f) => !f.value.trim());
}
