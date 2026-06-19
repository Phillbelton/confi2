/**
 * Fuente única del WhatsApp del negocio en el front.
 *
 * El número sale de `NEXT_PUBLIC_WHATSAPP_NUMBER` (se hornea en el build de
 * Next; ver `frontend/Dockerfile` y `docker-compose.yml`). El fallback es solo
 * una red de seguridad para que los footers nunca queden con un link roto si la
 * env faltara — la fuente real es la variable de entorno, no este valor.
 *
 * Lo usan los puntos "cliente → negocio" (footers, confirmación de pedido). Los
 * flujos "negocio → cliente" (funcionario/admin) usan el teléfono del cliente,
 * no este número.
 */
const FALLBACK_NUMBER = '56920178216';

/** Número del negocio, solo dígitos (ej: "56920178216"). */
export const businessWhatsappNumber = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || FALLBACK_NUMBER
).replace(/\D/g, '');

/** Link `wa.me` al WhatsApp del negocio, con texto opcional pre-cargado. */
export function businessWhatsappHref(text?: string): string {
  const base = `https://wa.me/${businessWhatsappNumber}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * Número formateado para mostrar. Móvil chileno (56 9 XXXX XXXX) →
 * "+56 9 2017 8216"; cualquier otro formato cae a "+<dígitos>".
 */
export function formatBusinessWhatsapp(): string {
  const d = businessWhatsappNumber;
  if (d.length === 11 && d.startsWith('569')) {
    return `+56 9 ${d.slice(3, 7)} ${d.slice(7)}`;
  }
  return `+${d}`;
}

/**
 * Horario de atención (texto libre). Fuente única en el front; coincide con el
 * footer de los mensajes del backend. Overridable por `NEXT_PUBLIC_BUSINESS_HOURS`
 * (se hornea en el build, igual que el número).
 */
export const businessHours =
  process.env.NEXT_PUBLIC_BUSINESS_HOURS || 'Lun-Sáb 9am-9pm | Dom 9am-2pm';

/**
 * Dirección de retiro en tienda (texto libre). Como puede haber varios locales,
 * no existe un valor "canónico": se setea por `NEXT_PUBLIC_PICKUP_ADDRESS` solo
 * si el negocio quiere una dirección fija en los mensajes. Vacío por defecto —
 * los mensajes coordinan el retiro por el chat en vez de inventar una dirección.
 */
export const businessPickupAddress = (
  process.env.NEXT_PUBLIC_PICKUP_ADDRESS || ''
).trim();
