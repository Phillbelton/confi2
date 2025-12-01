import type { Metadata } from "next";
// Fuentes Google premium para UI/UX mejorada
import { Playfair_Display, Inter, Caveat } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Toaster } from "@/components/ui/toaster";

// Playfair Display: Headings elegantes (serif premium)
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  display: "swap",
});

// Inter: Body text moderna y legible (sans-serif)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Caveat: Acentos manuscritos (opcional para detalles especiales)
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-handwriting",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Confitería Quelita - Productos de Confitería Premium",
  description: "Descubre nuestra selección de productos de confitería premium. Compra online y recibe en tu domicilio o retira en tienda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfairDisplay.variable} ${caveat.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
