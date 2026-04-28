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
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
          {/*
            Mobile: 2 cols (Brand spans 2, luego 4 secciones en 2×2).
            md: 2 cols igual, pero más espaciado.
            lg: 5 cols, todo en una fila.
          */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:gap-y-8 md:gap-8 lg:grid-cols-5">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1 space-y-3 md:space-y-4">
              <Image
                src="/brand/logo.png"
                alt="Confitería Quelita"
                width={1024}
                height={667}
                className="h-12 md:h-14 w-auto drop-shadow-lg"
              />
              <p className="text-sm text-white/50 max-w-xs">
                Confitería mayorista y detalle. 31 años endulzando con cariño.
              </p>
              <div className="flex gap-2.5">
                <Link
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-primary hover:text-white transition-all"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4 md:h-5 md:w-5" />
                </Link>
                <Link
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-accent hover:text-white transition-all"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4 md:h-5 md:w-5" />
                </Link>
              </div>
            </div>

            {/* Shop */}
            <div className="min-w-0">
              <h3 className="font-display font-bold text-sm md:text-base mb-3 md:mb-4 text-white">Comprar</h3>
              <ul className="space-y-2 md:space-y-2.5">
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
            <div className="min-w-0">
              <h3 className="font-display font-bold text-sm md:text-base mb-3 md:mb-4 text-white">Mi Cuenta</h3>
              <ul className="space-y-2 md:space-y-2.5">
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
            <div className="min-w-0">
              <h3 className="font-display font-bold text-sm md:text-base mb-3 md:mb-4 text-white">Ayuda</h3>
              <ul className="space-y-2 md:space-y-2.5">
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
            <div className="min-w-0">
              <h3 className="font-display font-bold text-sm md:text-base mb-3 md:mb-4 text-white">Contacto</h3>
              <ul className="space-y-2 md:space-y-2.5 text-sm text-white/50">
                <li className="flex items-center gap-2 min-w-0">
                  <Phone className="h-4 w-4 flex-shrink-0 text-green-400" />
                  <a
                    href="https://wa.me/56964269246"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors truncate"
                  >
                    +56 9 6426 9246
                  </a>
                </li>
                <li className="flex items-center gap-2 min-w-0">
                  <Clock className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                  <span className="truncate">L-S 08:30-20:30</span>
                </li>
                <li className="flex items-center gap-2 min-w-0">
                  <Clock className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                  <span className="truncate">Online: L-S 11:00-18:00</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 relative z-10">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 md:py-5">
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-3 md:gap-4 text-[11px] md:text-xs text-white/40 text-center md:text-left">
              <p>© {new Date().getFullYear()} Confitería Quelita. Todos los derechos reservados.</p>
              <div className="flex gap-5 md:gap-6">
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
