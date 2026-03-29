import type { Metadata } from "next";
// Fuentes Google — Quelita brand: redondeadas, amigables, profesionales
import { Nunito, Quicksand, Caveat } from "next/font/google";
import "./globals.css";
import "@/styles/premium.css";
import { Providers } from "@/lib/providers";
// Toaster de Sonner se carga en providers.tsx
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";

// Nunito: Headings redondeados y amigables
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

// Quicksand: Body text redondeado y legible
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Caveat: Acentos manuscritos (para "Con Cariño" y detalles)
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-handwriting",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Confitería Quelita - Productos de Confitería Premium",
    template: "%s | Confitería Quelita"
  },
  description: "Descubre nuestra selección de productos de confitería premium. Dulces, chocolates, snacks y más. Compra online y recibe en tu domicilio o retira en tienda.",
  keywords: ["confitería", "dulces", "chocolates", "snacks", "golosinas", "productos premium", "tienda online"],
  authors: [{ name: "Confitería Quelita" }],
  creator: "Confitería Quelita",
  publisher: "Confitería Quelita",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "Confitería Quelita",
    title: "Confitería Quelita - Productos de Confitería Premium",
    description: "Descubre nuestra selección de productos de confitería premium. Dulces, chocolates, snacks y más.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Confitería Quelita - Productos Premium"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Confitería Quelita - Productos de Confitería Premium",
    description: "Descubre nuestra selección de productos de confitería premium.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "your-google-verification-code", // Agregar cuando se configure Google Search Console
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${quicksand.variable} ${nunito.variable} ${caveat.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
