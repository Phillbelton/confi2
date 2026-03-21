import Link from 'next/link';
import { Facebook, Instagram, Mail, MapPin, Phone, Clock, CreditCard, Truck } from 'lucide-react';

const footerLinks = {
  shop: [
    { name: 'Todos los productos', href: '/productos' },
    { name: 'Ofertas', href: '/ofertas' },
    { name: 'Novedades', href: '/productos?featured=true' },
    { name: 'Categorías', href: '/productos' },
  ],
  customer: [
    { name: 'Mi cuenta', href: '/perfil' },
    { name: 'Mis pedidos', href: '/mis-ordenes' },
    { name: 'Direcciones', href: '/direcciones' },
  ],
  info: [
    { name: 'Contacto', href: '/contacto' },
    { name: 'Sobre nosotros', href: '/nosotros' },
    { name: 'Términos y condiciones', href: '/terminos' },
    { name: 'Política de privacidad', href: '/privacidad' },
  ],
  help: [
    { name: 'Cómo comprar', href: '/ayuda/como-comprar' },
    { name: 'Formas de pago', href: '/ayuda/formas-de-pago' },
    { name: 'Envíos', href: '/ayuda/envios' },
    { name: 'Preguntas frecuentes', href: '/ayuda/faq' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#111827] text-white">
      {/* Benefits Bar */}
      <div className="border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Envío rápido</p>
                <p className="text-xs text-gray-400">A todo Chile</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Pago seguro</p>
                <p className="text-xs text-gray-400">Múltiples opciones</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Atención al cliente</p>
                <p className="text-xs text-gray-400">600 6600 777</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Horario extendido</p>
                <p className="text-xs text-gray-400">Lun - Sáb 9:00 - 21:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">confitería</span>
              <span className="text-2xl font-light">quelita</span>
            </div>
            <p className="text-sm text-gray-400">
              Tu confitería mayorista de confianza. Los mejores productos al mejor precio.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Comprar</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Mi Cuenta</h3>
            <ul className="space-y-3">
              {footerLinks.customer.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Ayuda</h3>
            <ul className="space-y-3">
              {footerLinks.help.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Contacto</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <span>Av. Principal 123, Santiago, Chile</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                <a
                  href="tel:6006600777"
                  className="hover:text-primary transition-colors"
                >
                  600 6600 777
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                <a
                  href="mailto:contacto@quelita.cl"
                  className="hover:text-primary transition-colors"
                >
                  contacto@quelita.cl
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>
              © {new Date().getFullYear()} Confitería Quelita. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <Link href="/terminos" className="hover:text-primary transition-colors">
                Términos
              </Link>
              <Link href="/privacidad" className="hover:text-primary transition-colors">
                Privacidad
              </Link>
              <Link href="/cookies" className="hover:text-primary transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
