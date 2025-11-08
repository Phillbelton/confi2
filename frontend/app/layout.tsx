import type { Metadata } from "next";
// TODO: Enable Google Fonts in production environment
// For development, using system fonts due to build environment TLS constraints
// Uncomment below when deploying to production:
// import { DM_Sans, Comfortaa } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

// const dmSans = DM_Sans({
//   subsets: ["latin"],
//   variable: "--font-dm-sans",
//   display: "swap",
// });

// const comfortaa = Comfortaa({
//   subsets: ["latin"],
//   variable: "--font-comfortaa",
//   weight: ["400", "700"],
//   display: "swap",
// });

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
    <html lang="es">
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
