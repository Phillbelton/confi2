import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera un servidor minimo autocontenido para Docker (imagen liviana)
  output: 'standalone',
  images: {
    // Las imágenes ya vienen pre-redimensionadas a webp (w400/w800/w1200) por
    // sharp al subirlas, y se sirven desde el volumen vía Caddy (no por el
    // server de Next). El optimizador de next/image corre dentro del contenedor
    // frontend y NO tiene acceso a /uploads → daba 400 y rompía las imágenes en
    // todo el admin. Con unoptimized, next/image emite un <img> con el src
    // relativo y el navegador lo pide a Caddy. Independiente de la IP.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'http',
        hostname: '192.168.5.2', // Your local network IP
        port: '5000',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
  },
  // Optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns', 'framer-motion'],
  },
};

export default nextConfig;
