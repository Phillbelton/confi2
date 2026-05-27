/**
 * Configuración centralizada de la API.
 *
 * Centraliza el fallback para NEXT_PUBLIC_API_URL para evitar el string
 * mágico "http://localhost:5000/api" repartido por todo el frontend.
 *
 * Todos los clientes (axios, adminApi, clientApi, funcionarioApi, images,
 * fetch sueltos) deben importar API_URL desde aquí.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
