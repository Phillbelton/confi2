import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Mail, MapPin, Phone, Clock } from 'lucide-react';

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
  help: [
    { name: 'Cómo comprar', href: '/ayuda/como-comprar' },
    { name: 'Formas de pago', href: '/ayuda/formas-de-pago' },
    { name: 'Envíos', href: '/ayuda/envios' },
    { name: 'Preguntas frecuentes', href: '/ayuda/faq' },
  ],
};

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Main Footer */}
      <div className="bg-gradient-to-b from-secondary to-secondary/95 candy-bg">
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="lg:col-span-1 space-y-4">
              <Image
                src="/brand/logo.png"
                alt="Confitería Quelita"
                width={1024}
                height={667}
                className="h-14 w-auto drop-shadow-lg"
              />
              <p className="text-sm text-white/50">
                Confitería mayorista y detalle. 31 años endulzando con cariño.
              </p>
              <div className="flex gap-3">
                <Link
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-primary hover:text-white transition-all"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-accent hover:text-white transition-all"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Shop */}
            <div>
              <h3 className="font-display font-bold mb-4 text-white">Comprar</h3>
              <ul className="space-y-2.5">
                {footerLinks.shop.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-white/50 hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer */}
            <div>
              <h3 className="font-display font-bold mb-4 text-white">Mi Cuenta</h3>
              <ul className="space-y-2.5">
                {footerLinks.customer.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-white/50 hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help */}
            <div>
              <h3 className="font-display font-bold mb-4 text-white">Ayuda</h3>
              <ul className="space-y-2.5">
                {footerLinks.help.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-white/50 hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-display font-bold mb-4 text-white">Contacto</h3>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0 text-green-400" />
                  <a
                    href="https://wa.me/56964269246"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    +56 9 6426 9246
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                  <span>L-S 08:30-20:30</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                  <span>Online: L-S 11:00-18:00</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 relative z-10">
          <div className="container mx-auto px-4 py-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
              <p>© {new Date().getFullYear()} Confitería Quelita. Todos los derechos reservados.</p>
              <div className="flex gap-6">
                <Link href="/terminos" className="hover:text-primary transition-colors">Términos</Link>
                <Link href="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
