import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductParent from '../models/ProductParent';
import ProductVariant from '../models/ProductVariant';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';

dotenv.config();

interface ProductSeed {
  name: string;
  description: string;
  categoryNames: string[]; // Nombres de categorías (main + sub)
  brandName: string;
  tags?: string[];
  featured?: boolean;
  // Para productos de una sola dimensión de variante
  variantAttributeName?: string; // ej: "tamaño", "sabor", "peso"
  variantAttributeDisplayName?: string; // ej: "Tamaño", "Sabor", "Peso"
  variants?: {
    value: string; // ej: "350ml", "500ml"
    displayValue: string; // ej: "350ml (Lata)", "500ml (Botella)"
    price: number; // Precio en CLP
    stock: number;
    order: number;
  }[];
  // Para productos multi-dimensionales (múltiples atributos de variante)
  variantAttributes?: {
    name: string;
    displayName: string;
    order: number;
    values: {
      value: string;
      displayValue: string;
      order: number;
    }[];
  }[];
  // Variantes multi-dimensionales: combinaciones de los atributos
  multiVariants?: {
    attributeCombination: { [attributeName: string]: string }; // ej: { sabor: "vainilla", tamaño: "500ml" }
    sku: string;
    price: number;
    stock: number;
  }[];
}

const productsToSeed: ProductSeed[] = [
  // ===================================================================
  // CATEGORIA 1: BEBIDAS
  // ===================================================================

  // Subcategoría: Gaseosas
  {
    name: 'Producto-1-001',
    description: 'Bebida gaseosa sabor cola para pruebas de sistema',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1A-Gaseosas'],
    brandName: 'Marca-A',
    tags: ['gaseosa', 'bebida', 'cola'],
    featured: true,
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '350ml', displayValue: '350ml (Lata)', price: 990, stock: 150, order: 1 },
      { value: '500ml', displayValue: '500ml (Botella)', price: 1490, stock: 120, order: 2 },
      { value: '1.5L', displayValue: '1.5L (Botella)', price: 2490, stock: 80, order: 3 },
      { value: '3L', displayValue: '3L (Botella Familiar)', price: 3990, stock: 50, order: 4 },
    ],
  },
  {
    name: 'Producto-1-002',
    description: 'Bebida gaseosa sabor naranja para pruebas de sistema',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1A-Gaseosas'],
    brandName: 'Marca-A',
    tags: ['gaseosa', 'bebida', 'naranja'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '350ml', displayValue: '350ml (Lata)', price: 990, stock: 140, order: 1 },
      { value: '500ml', displayValue: '500ml (Botella)', price: 1490, stock: 110, order: 2 },
      { value: '1.5L', displayValue: '1.5L (Botella)', price: 2490, stock: 75, order: 3 },
    ],
  },
  {
    name: 'Producto-1-003',
    description: 'Bebida gaseosa sabor limón para pruebas de sistema',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1A-Gaseosas'],
    brandName: 'Marca-B',
    tags: ['gaseosa', 'bebida', 'limón'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '350ml', displayValue: '350ml (Lata)', price: 1090, stock: 130, order: 1 },
      { value: '500ml', displayValue: '500ml (Botella)', price: 1590, stock: 100, order: 2 },
      { value: '2L', displayValue: '2L (Botella)', price: 2990, stock: 60, order: 3 },
    ],
  },
  {
    name: 'Producto-1-004',
    description: 'Bebida gaseosa sabor uva para pruebas de sistema',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1A-Gaseosas'],
    brandName: 'Marca-B',
    tags: ['gaseosa', 'bebida', 'uva'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '350ml', displayValue: '350ml (Lata)', price: 1090, stock: 125, order: 1 },
      { value: '1.5L', displayValue: '1.5L (Botella)', price: 2690, stock: 70, order: 2 },
    ],
  },

  // Subcategoría: Jugos
  {
    name: 'Producto-1-005',
    description: 'Jugo de frutas sabor durazno para pruebas de sistema',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1B-Jugos'],
    brandName: 'Marca-C',
    tags: ['jugo', 'bebida', 'durazno'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '200ml', displayValue: '200ml (Caja)', price: 690, stock: 200, order: 1 },
      { value: '1L', displayValue: '1L (Tetra Pak)', price: 1890, stock: 90, order: 2 },
      { value: '1.5L', displayValue: '1.5L (Tetra Pak)', price: 2590, stock: 70, order: 3 },
    ],
  },
  {
    name: 'Producto-1-006',
    description: 'Jugo de frutas sabor manzana para pruebas de sistema',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1B-Jugos'],
    brandName: 'Marca-C',
    tags: ['jugo', 'bebida', 'manzana'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '200ml', displayValue: '200ml (Caja)', price: 690, stock: 190, order: 1 },
      { value: '1L', displayValue: '1L (Tetra Pak)', price: 1890, stock: 85, order: 2 },
    ],
  },
  {
    name: 'Producto-1-007',
    description: 'Jugo de frutas sabor naranja para pruebas de sistema',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1B-Jugos'],
    brandName: 'Marca-D',
    tags: ['jugo', 'bebida', 'naranja', 'citrico'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '200ml', displayValue: '200ml (Caja)', price: 790, stock: 180, order: 1 },
      { value: '1L', displayValue: '1L (Tetra Pak)', price: 1990, stock: 95, order: 2 },
      { value: '1.5L', displayValue: '1.5L (Tetra Pak)', price: 2790, stock: 65, order: 3 },
    ],
  },
  {
    name: 'Producto-1-008',
    description: 'Jugo de frutas sabor piña para pruebas de sistema',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1B-Jugos'],
    brandName: 'Marca-D',
    tags: ['jugo', 'bebida', 'piña', 'tropical'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '200ml', displayValue: '200ml (Caja)', price: 790, stock: 175, order: 1 },
      { value: '1L', displayValue: '1L (Tetra Pak)', price: 1990, stock: 88, order: 2 },
    ],
  },

  // Subcategoría: Aguas
  {
    name: 'Producto-1-009',
    description: 'Agua mineral natural sin gas para pruebas de sistema',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1C-Aguas'],
    brandName: 'Marca-E',
    tags: ['agua', 'mineral', 'sin-gas'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '500ml', displayValue: '500ml (Botella)', price: 890, stock: 200, order: 1 },
      { value: '1.5L', displayValue: '1.5L (Botella)', price: 1490, stock: 150, order: 2 },
      { value: '6L', displayValue: '6L (Bidón)', price: 3490, stock: 60, order: 3 },
    ],
  },
  {
    name: 'Producto-1-010',
    description: 'Agua mineral con gas para pruebas de sistema',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1C-Aguas'],
    brandName: 'Marca-E',
    tags: ['agua', 'mineral', 'con-gas'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '500ml', displayValue: '500ml (Botella)', price: 990, stock: 180, order: 1 },
      { value: '1.5L', displayValue: '1.5L (Botella)', price: 1690, stock: 130, order: 2 },
    ],
  },

  // ===================================================================
  // CATEGORIA 2: SNACKS
  // ===================================================================

  // Subcategoría: Salados
  {
    name: 'Producto-2-001',
    description: 'Papas fritas sabor natural para pruebas de sistema',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2A-Salados'],
    brandName: 'Marca-F',
    tags: ['snack', 'papas', 'salado'],
    featured: true,
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '50g', displayValue: '50g (Individual)', price: 890, stock: 200, order: 1 },
      { value: '150g', displayValue: '150g (Mediano)', price: 1990, stock: 120, order: 2 },
      { value: '300g', displayValue: '300g (Familiar)', price: 3490, stock: 80, order: 3 },
    ],
  },
  {
    name: 'Producto-2-002',
    description: 'Papas fritas sabor queso para pruebas de sistema',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2A-Salados'],
    brandName: 'Marca-F',
    tags: ['snack', 'papas', 'salado', 'queso'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '50g', displayValue: '50g (Individual)', price: 890, stock: 190, order: 1 },
      { value: '150g', displayValue: '150g (Mediano)', price: 1990, stock: 115, order: 2 },
      { value: '300g', displayValue: '300g (Familiar)', price: 3490, stock: 75, order: 3 },
    ],
  },
  {
    name: 'Producto-2-003',
    description: 'Nachos sabor natural para pruebas de sistema',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2A-Salados'],
    brandName: 'Marca-G',
    tags: ['snack', 'nachos', 'salado', 'maiz'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Individual)', price: 1190, stock: 150, order: 1 },
      { value: '250g', displayValue: '250g (Familiar)', price: 2490, stock: 90, order: 2 },
    ],
  },
  {
    name: 'Producto-2-004',
    description: 'Nachos sabor picante para pruebas de sistema',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2A-Salados'],
    brandName: 'Marca-G',
    tags: ['snack', 'nachos', 'salado', 'picante'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Individual)', price: 1190, stock: 145, order: 1 },
      { value: '250g', displayValue: '250g (Familiar)', price: 2490, stock: 85, order: 2 },
    ],
  },

  // ============ PRODUCTO CON VARIANTES MULTI-DIMENSIONALES ============
  // Este producto tiene MÚLTIPLES atributos de variante: sabor Y tamaño
  {
    name: 'Producto-2-004-MD',
    description: 'Papas fritas premium con múltiples sabores y tamaños para pruebas de sistema',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2A-Salados'],
    brandName: 'Marca-F',
    tags: ['snack', 'papas', 'salado', 'premium', 'multi-variante'],
    featured: true,
    // Definir los atributos de variante (múltiples dimensiones)
    variantAttributes: [
      {
        name: 'sabor',
        displayName: 'Sabor',
        order: 1,
        values: [
          { value: 'natural', displayValue: 'Natural', order: 1 },
          { value: 'queso', displayValue: 'Queso', order: 2 },
          { value: 'bbq', displayValue: 'BBQ', order: 3 },
        ],
      },
      {
        name: 'tamaño',
        displayName: 'Tamaño',
        order: 2,
        values: [
          { value: '50g', displayValue: '50g (Individual)', order: 1 },
          { value: '150g', displayValue: '150g (Mediano)', order: 2 },
        ],
      },
    ],
    // Combinaciones de variantes (todas las combinaciones posibles)
    multiVariants: [
      // Natural
      { attributeCombination: { sabor: 'natural', tamaño: '50g' }, sku: 'PROD-2-004-MD-NAT-50G', price: 990, stock: 100 },
      { attributeCombination: { sabor: 'natural', tamaño: '150g' }, sku: 'PROD-2-004-MD-NAT-150G', price: 2190, stock: 80 },
      // Queso
      { attributeCombination: { sabor: 'queso', tamaño: '50g' }, sku: 'PROD-2-004-MD-QUE-50G', price: 1090, stock: 95 },
      { attributeCombination: { sabor: 'queso', tamaño: '150g' }, sku: 'PROD-2-004-MD-QUE-150G', price: 2290, stock: 75 },
      // BBQ
      { attributeCombination: { sabor: 'bbq', tamaño: '50g' }, sku: 'PROD-2-004-MD-BBQ-50G', price: 1090, stock: 90 },
      { attributeCombination: { sabor: 'bbq', tamaño: '150g' }, sku: 'PROD-2-004-MD-BBQ-150G', price: 2290, stock: 70 },
    ],
  },

  // Subcategoría: Dulces
  {
    name: 'Producto-2-005',
    description: 'Snack dulce de maíz acaramelado para pruebas de sistema',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2B-Dulces'],
    brandName: 'Marca-H',
    tags: ['snack', 'dulce', 'maiz'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '80g', displayValue: '80g (Individual)', price: 990, stock: 160, order: 1 },
      { value: '200g', displayValue: '200g (Familiar)', price: 2290, stock: 100, order: 2 },
    ],
  },
  {
    name: 'Producto-2-006',
    description: 'Snack dulce de arroz inflado para pruebas de sistema',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2B-Dulces'],
    brandName: 'Marca-H',
    tags: ['snack', 'dulce', 'arroz'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '80g', displayValue: '80g (Individual)', price: 990, stock: 155, order: 1 },
      { value: '200g', displayValue: '200g (Familiar)', price: 2290, stock: 95, order: 2 },
    ],
  },

  // Subcategoría: Frutos Secos
  {
    name: 'Producto-2-007',
    description: 'Maní salado para pruebas de sistema',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2C-Frutos-Secos'],
    brandName: 'Marca-I',
    tags: ['snack', 'frutos-secos', 'mani'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Bolsa)', price: 1490, stock: 120, order: 1 },
      { value: '250g', displayValue: '250g (Bolsa)', price: 2990, stock: 80, order: 2 },
    ],
  },
  {
    name: 'Producto-2-008',
    description: 'Mix de frutos secos para pruebas de sistema',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2C-Frutos-Secos'],
    brandName: 'Marca-I',
    tags: ['snack', 'frutos-secos', 'mix'],
    featured: true,
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Bolsa)', price: 1990, stock: 110, order: 1 },
      { value: '250g', displayValue: '250g (Bolsa)', price: 3990, stock: 70, order: 2 },
    ],
  },

  // ===================================================================
  // CATEGORIA 3: CHOCOLATES
  // ===================================================================

  // Subcategoría: Barras
  {
    name: 'Producto-3-001',
    description: 'Barra de chocolate con leche para pruebas de sistema',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3A-Barras'],
    brandName: 'Marca-J',
    tags: ['chocolate', 'barra', 'leche'],
    featured: true,
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '30g', displayValue: '30g (Mini)', price: 690, stock: 200, order: 1 },
      { value: '50g', displayValue: '50g (Estándar)', price: 990, stock: 180, order: 2 },
      { value: '100g', displayValue: '100g (Grande)', price: 1790, stock: 120, order: 3 },
    ],
  },
  {
    name: 'Producto-3-002',
    description: 'Barra de chocolate negro para pruebas de sistema',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3A-Barras'],
    brandName: 'Marca-J',
    tags: ['chocolate', 'barra', 'negro', 'amargo'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '30g', displayValue: '30g (Mini)', price: 790, stock: 170, order: 1 },
      { value: '50g', displayValue: '50g (Estándar)', price: 1090, stock: 150, order: 2 },
      { value: '100g', displayValue: '100g (Grande)', price: 1990, stock: 100, order: 3 },
    ],
  },
  {
    name: 'Producto-3-003',
    description: 'Barra de chocolate blanco para pruebas de sistema',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3A-Barras'],
    brandName: 'Marca-K',
    tags: ['chocolate', 'barra', 'blanco'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '30g', displayValue: '30g (Mini)', price: 790, stock: 165, order: 1 },
      { value: '50g', displayValue: '50g (Estándar)', price: 1090, stock: 145, order: 2 },
    ],
  },
  {
    name: 'Producto-3-004',
    description: 'Barra de chocolate con almendras para pruebas de sistema',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3A-Barras'],
    brandName: 'Marca-K',
    tags: ['chocolate', 'barra', 'almendras', 'frutos-secos'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '40g', displayValue: '40g (Estándar)', price: 1190, stock: 140, order: 1 },
      { value: '80g', displayValue: '80g (Grande)', price: 2090, stock: 90, order: 2 },
    ],
  },

  // ============ PRODUCTO CON VARIANTES MULTI-DIMENSIONALES ============
  // Este producto tiene MÚLTIPLES atributos: tipo de chocolate Y tamaño
  {
    name: 'Producto-3-004-MD',
    description: 'Barra de chocolate premium con múltiples tipos y tamaños para pruebas de sistema',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3A-Barras'],
    brandName: 'Marca-K',
    tags: ['chocolate', 'barra', 'premium', 'multi-variante'],
    featured: true,
    // Definir los atributos de variante (múltiples dimensiones)
    variantAttributes: [
      {
        name: 'tipo',
        displayName: 'Tipo de Chocolate',
        order: 1,
        values: [
          { value: 'leche', displayValue: 'Con Leche', order: 1 },
          { value: 'negro', displayValue: 'Negro 70%', order: 2 },
          { value: 'blanco', displayValue: 'Blanco', order: 3 },
        ],
      },
      {
        name: 'tamaño',
        displayName: 'Tamaño',
        order: 2,
        values: [
          { value: '50g', displayValue: '50g (Estándar)', order: 1 },
          { value: '100g', displayValue: '100g (Grande)', order: 2 },
        ],
      },
    ],
    // Combinaciones de variantes
    multiVariants: [
      // Con Leche
      { attributeCombination: { tipo: 'leche', tamaño: '50g' }, sku: 'PROD-3-004-MD-LEC-50G', price: 1190, stock: 120 },
      { attributeCombination: { tipo: 'leche', tamaño: '100g' }, sku: 'PROD-3-004-MD-LEC-100G', price: 2090, stock: 90 },
      // Negro
      { attributeCombination: { tipo: 'negro', tamaño: '50g' }, sku: 'PROD-3-004-MD-NEG-50G', price: 1390, stock: 110 },
      { attributeCombination: { tipo: 'negro', tamaño: '100g' }, sku: 'PROD-3-004-MD-NEG-100G', price: 2390, stock: 85 },
      // Blanco
      { attributeCombination: { tipo: 'blanco', tamaño: '50g' }, sku: 'PROD-3-004-MD-BLA-50G', price: 1290, stock: 115 },
      { attributeCombination: { tipo: 'blanco', tamaño: '100g' }, sku: 'PROD-3-004-MD-BLA-100G', price: 2190, stock: 80 },
    ],
  },

  // Subcategoría: Bombones
  {
    name: 'Producto-3-005',
    description: 'Bombones surtidos para pruebas de sistema',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3B-Bombones'],
    brandName: 'Marca-L',
    tags: ['chocolate', 'bombones', 'surtido'],
    featured: true,
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Caja)', price: 2490, stock: 100, order: 1 },
      { value: '200g', displayValue: '200g (Caja)', price: 4490, stock: 70, order: 2 },
      { value: '300g', displayValue: '300g (Caja Premium)', price: 6490, stock: 50, order: 3 },
    ],
  },
  {
    name: 'Producto-3-006',
    description: 'Bombones rellenos de licor para pruebas de sistema',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3B-Bombones'],
    brandName: 'Marca-L',
    tags: ['chocolate', 'bombones', 'licor', 'adulto'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '150g', displayValue: '150g (Caja)', price: 3490, stock: 80, order: 1 },
      { value: '250g', displayValue: '250g (Caja)', price: 5490, stock: 55, order: 2 },
    ],
  },

  // Subcategoría: Premium
  {
    name: 'Producto-3-007',
    description: 'Chocolate premium artesanal para pruebas de sistema',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3C-Premium'],
    brandName: 'Marca-M',
    tags: ['chocolate', 'premium', 'artesanal'],
    featured: true,
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Tableta)', price: 3990, stock: 60, order: 1 },
      { value: '200g', displayValue: '200g (Tableta)', price: 7490, stock: 40, order: 2 },
    ],
  },
  {
    name: 'Producto-3-008',
    description: 'Chocolate premium relleno de frutos del bosque para pruebas de sistema',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3C-Premium'],
    brandName: 'Marca-M',
    tags: ['chocolate', 'premium', 'artesanal', 'frutos-del-bosque'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Tableta)', price: 4490, stock: 55, order: 1 },
      { value: '200g', displayValue: '200g (Tableta)', price: 8490, stock: 35, order: 2 },
    ],
  },

  // ===================================================================
  // CATEGORIA 4: CARAMELOS
  // ===================================================================

  // Subcategoría: Duros
  {
    name: 'Producto-4-001',
    description: 'Caramelos duros sabor frutas para pruebas de sistema',
    categoryNames: ['Categoria-4-Caramelos', 'Subcat-4A-Duros'],
    brandName: 'Marca-N',
    tags: ['caramelo', 'duro', 'frutas'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Bolsa)', price: 890, stock: 180, order: 1 },
      { value: '250g', displayValue: '250g (Bolsa)', price: 1990, stock: 120, order: 2 },
    ],
  },
  {
    name: 'Producto-4-002',
    description: 'Lollipops surtidos para pruebas de sistema',
    categoryNames: ['Categoria-4-Caramelos', 'Subcat-4A-Duros'],
    brandName: 'Marca-N',
    tags: ['caramelo', 'lollipop', 'surtido'],
    variantAttributeName: 'cantidad',
    variantAttributeDisplayName: 'Cantidad',
    variants: [
      { value: '6-unidades', displayValue: '6 unidades', price: 990, stock: 150, order: 1 },
      { value: '12-unidades', displayValue: '12 unidades', price: 1790, stock: 100, order: 2 },
    ],
  },

  // Subcategoría: Gomitas
  {
    name: 'Producto-4-003',
    description: 'Gomitas sabor frutas para pruebas de sistema',
    categoryNames: ['Categoria-4-Caramelos', 'Subcat-4B-Gomitas'],
    brandName: 'Marca-O',
    tags: ['caramelo', 'gomita', 'frutas'],
    featured: true,
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Bolsa)', price: 1290, stock: 170, order: 1 },
      { value: '250g', displayValue: '250g (Bolsa)', price: 2790, stock: 110, order: 2 },
    ],
  },
  {
    name: 'Producto-4-004',
    description: 'Gomitas ácidas para pruebas de sistema',
    categoryNames: ['Categoria-4-Caramelos', 'Subcat-4B-Gomitas'],
    brandName: 'Marca-O',
    tags: ['caramelo', 'gomita', 'acido'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Bolsa)', price: 1390, stock: 160, order: 1 },
      { value: '250g', displayValue: '250g (Bolsa)', price: 2990, stock: 105, order: 2 },
    ],
  },

  // Subcategoría: Chicles
  {
    name: 'Producto-4-005',
    description: 'Chicles sabor menta para pruebas de sistema',
    categoryNames: ['Categoria-4-Caramelos', 'Subcat-4C-Chicles'],
    brandName: 'Marca-P',
    tags: ['chicle', 'menta'],
    variantAttributeName: 'cantidad',
    variantAttributeDisplayName: 'Cantidad',
    variants: [
      { value: '10-unidades', displayValue: '10 unidades (Blister)', price: 690, stock: 200, order: 1 },
      { value: '30-unidades', displayValue: '30 unidades (Caja)', price: 1890, stock: 120, order: 2 },
    ],
  },
  {
    name: 'Producto-4-006',
    description: 'Chicles sabor frutas para pruebas de sistema',
    categoryNames: ['Categoria-4-Caramelos', 'Subcat-4C-Chicles'],
    brandName: 'Marca-P',
    tags: ['chicle', 'frutas'],
    variantAttributeName: 'cantidad',
    variantAttributeDisplayName: 'Cantidad',
    variants: [
      { value: '10-unidades', displayValue: '10 unidades (Blister)', price: 690, stock: 195, order: 1 },
      { value: '30-unidades', displayValue: '30 unidades (Caja)', price: 1890, stock: 115, order: 2 },
    ],
  },

  // ===================================================================
  // CATEGORIA 5: REPOSTERIA
  // ===================================================================

  // Subcategoría: Galletas
  {
    name: 'Producto-5-001',
    description: 'Galletas de chocolate para pruebas de sistema',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5A-Galletas'],
    brandName: 'Marca-Q',
    tags: ['galleta', 'chocolate', 'dulce'],
    featured: true,
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Paquete)', price: 1190, stock: 150, order: 1 },
      { value: '250g', displayValue: '250g (Paquete)', price: 2690, stock: 100, order: 2 },
      { value: '500g', displayValue: '500g (Familia)', price: 4490, stock: 70, order: 3 },
    ],
  },
  {
    name: 'Producto-5-002',
    description: 'Galletas de vainilla para pruebas de sistema',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5A-Galletas'],
    brandName: 'Marca-Q',
    tags: ['galleta', 'vainilla', 'dulce'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Paquete)', price: 1090, stock: 145, order: 1 },
      { value: '250g', displayValue: '250g (Paquete)', price: 2490, stock: 95, order: 2 },
    ],
  },
  {
    name: 'Producto-5-003',
    description: 'Galletas saladas crackers para pruebas de sistema',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5A-Galletas'],
    brandName: 'Marca-R',
    tags: ['galleta', 'salada', 'cracker'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '150g', displayValue: '150g (Paquete)', price: 1390, stock: 130, order: 1 },
      { value: '300g', displayValue: '300g (Familia)', price: 2590, stock: 85, order: 2 },
    ],
  },

  // Subcategoría: Alfajores
  {
    name: 'Producto-5-004',
    description: 'Alfajores rellenos de dulce de leche para pruebas de sistema',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5B-Alfajores'],
    brandName: 'Marca-S',
    tags: ['alfajor', 'dulce-de-leche', 'relleno'],
    featured: true,
    variantAttributeName: 'cantidad',
    variantAttributeDisplayName: 'Cantidad',
    variants: [
      { value: '1-unidad', displayValue: '1 unidad (40g)', price: 690, stock: 200, order: 1 },
      { value: '6-unidades', displayValue: '6 unidades (Caja)', price: 3690, stock: 90, order: 2 },
      { value: '12-unidades', displayValue: '12 unidades (Caja)', price: 6990, stock: 60, order: 3 },
    ],
  },
  {
    name: 'Producto-5-005',
    description: 'Alfajores de chocolate para pruebas de sistema',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5B-Alfajores'],
    brandName: 'Marca-S',
    tags: ['alfajor', 'chocolate', 'relleno'],
    variantAttributeName: 'cantidad',
    variantAttributeDisplayName: 'Cantidad',
    variants: [
      { value: '1-unidad', displayValue: '1 unidad (40g)', price: 790, stock: 190, order: 1 },
      { value: '6-unidades', displayValue: '6 unidades (Caja)', price: 4190, stock: 85, order: 2 },
    ],
  },

  // Subcategoría: Obleas
  {
    name: 'Producto-5-006',
    description: 'Obleas rellenas de crema de vainilla para pruebas de sistema',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5C-Obleas'],
    brandName: 'Marca-T',
    tags: ['oblea', 'vainilla', 'relleno'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Paquete)', price: 1290, stock: 140, order: 1 },
      { value: '250g', displayValue: '250g (Paquete)', price: 2890, stock: 90, order: 2 },
    ],
  },
  {
    name: 'Producto-5-007',
    description: 'Obleas rellenas de dulce de leche para pruebas de sistema',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5C-Obleas'],
    brandName: 'Marca-T',
    tags: ['oblea', 'dulce-de-leche', 'relleno'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Paquete)', price: 1290, stock: 135, order: 1 },
      { value: '250g', displayValue: '250g (Paquete)', price: 2890, stock: 85, order: 2 },
    ],
  },

  // ===================================================================
  // CATEGORIA 6: HELADOS
  // ===================================================================

  // Subcategoría: Paletas de Agua
  {
    name: 'Producto-6-001',
    description: 'Paleta de agua sabor frutilla para pruebas de sistema',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6A-Paletas-Agua'],
    brandName: 'Marca-A',
    tags: ['helado', 'paleta', 'agua', 'frutilla'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '80ml', displayValue: '80ml (Individual)', price: 890, stock: 200, order: 1 },
      { value: '120ml', displayValue: '120ml (Grande)', price: 1290, stock: 150, order: 2 },
    ],
  },
  {
    name: 'Producto-6-002',
    description: 'Paleta de agua sabor limón para pruebas de sistema',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6A-Paletas-Agua'],
    brandName: 'Marca-A',
    tags: ['helado', 'paleta', 'agua', 'limon'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '80ml', displayValue: '80ml (Individual)', price: 890, stock: 195, order: 1 },
      { value: '120ml', displayValue: '120ml (Grande)', price: 1290, stock: 145, order: 2 },
    ],
  },

  // Subcategoría: Paletas de Crema
  {
    name: 'Producto-6-003',
    description: 'Paleta de crema sabor vainilla para pruebas de sistema',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6B-Paletas-Crema'],
    brandName: 'Marca-B',
    tags: ['helado', 'paleta', 'crema', 'vainilla'],
    featured: true,
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '90ml', displayValue: '90ml (Individual)', price: 1490, stock: 180, order: 1 },
      { value: '130ml', displayValue: '130ml (Grande)', price: 1990, stock: 130, order: 2 },
    ],
  },
  {
    name: 'Producto-6-004',
    description: 'Paleta de crema sabor chocolate para pruebas de sistema',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6B-Paletas-Crema'],
    brandName: 'Marca-B',
    tags: ['helado', 'paleta', 'crema', 'chocolate'],
    featured: true,
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '90ml', displayValue: '90ml (Individual)', price: 1490, stock: 175, order: 1 },
      { value: '130ml', displayValue: '130ml (Grande)', price: 1990, stock: 125, order: 2 },
    ],
  },
  {
    name: 'Producto-6-005',
    description: 'Paleta de crema sabor lúcuma para pruebas de sistema',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6B-Paletas-Crema'],
    brandName: 'Marca-B',
    tags: ['helado', 'paleta', 'crema', 'lucuma'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '90ml', displayValue: '90ml (Individual)', price: 1490, stock: 170, order: 1 },
      { value: '130ml', displayValue: '130ml (Grande)', price: 1990, stock: 120, order: 2 },
    ],
  },

  // ============ PRODUCTO CON VARIANTES MULTI-DIMENSIONALES ============
  // Este producto tiene MÚLTIPLES atributos: sabor Y tamaño
  {
    name: 'Producto-6-005-MD',
    description: 'Paleta de crema premium con múltiples sabores y tamaños para pruebas de sistema',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6B-Paletas-Crema'],
    brandName: 'Marca-B',
    tags: ['helado', 'paleta', 'crema', 'premium', 'multi-variante'],
    featured: true,
    // Definir los atributos de variante (múltiples dimensiones)
    variantAttributes: [
      {
        name: 'sabor',
        displayName: 'Sabor',
        order: 1,
        values: [
          { value: 'vainilla', displayValue: 'Vainilla', order: 1 },
          { value: 'chocolate', displayValue: 'Chocolate', order: 2 },
          { value: 'frutilla', displayValue: 'Frutilla', order: 3 },
          { value: 'lucuma', displayValue: 'Lúcuma', order: 4 },
        ],
      },
      {
        name: 'tamaño',
        displayName: 'Tamaño',
        order: 2,
        values: [
          { value: '90ml', displayValue: '90ml (Individual)', order: 1 },
          { value: '130ml', displayValue: '130ml (Grande)', order: 2 },
        ],
      },
    ],
    // Combinaciones de variantes
    multiVariants: [
      // Vainilla
      { attributeCombination: { sabor: 'vainilla', tamaño: '90ml' }, sku: 'PROD-6-005-MD-VAN-90ML', price: 1590, stock: 150 },
      { attributeCombination: { sabor: 'vainilla', tamaño: '130ml' }, sku: 'PROD-6-005-MD-VAN-130ML', price: 2090, stock: 110 },
      // Chocolate
      { attributeCombination: { sabor: 'chocolate', tamaño: '90ml' }, sku: 'PROD-6-005-MD-CHO-90ML', price: 1590, stock: 145 },
      { attributeCombination: { sabor: 'chocolate', tamaño: '130ml' }, sku: 'PROD-6-005-MD-CHO-130ML', price: 2090, stock: 105 },
      // Frutilla
      { attributeCombination: { sabor: 'frutilla', tamaño: '90ml' }, sku: 'PROD-6-005-MD-FRU-90ML', price: 1590, stock: 140 },
      { attributeCombination: { sabor: 'frutilla', tamaño: '130ml' }, sku: 'PROD-6-005-MD-FRU-130ML', price: 2090, stock: 100 },
      // Lúcuma
      { attributeCombination: { sabor: 'lucuma', tamaño: '90ml' }, sku: 'PROD-6-005-MD-LUC-90ML', price: 1690, stock: 135 },
      { attributeCombination: { sabor: 'lucuma', tamaño: '130ml' }, sku: 'PROD-6-005-MD-LUC-130ML', price: 2190, stock: 95 },
    ],
  },

  // Subcategoría: Paletas Aguacrema
  {
    name: 'Producto-6-006',
    description: 'Paleta aguacrema sabor chirimoya para pruebas de sistema',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6C-Paletas-Aguacrema'],
    brandName: 'Marca-C',
    tags: ['helado', 'paleta', 'aguacrema', 'chirimoya'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '100ml', displayValue: '100ml (Individual)', price: 1190, stock: 160, order: 1 },
      { value: '140ml', displayValue: '140ml (Grande)', price: 1690, stock: 110, order: 2 },
    ],
  },
  {
    name: 'Producto-6-007',
    description: 'Paleta aguacrema sabor coco para pruebas de sistema',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6C-Paletas-Aguacrema'],
    brandName: 'Marca-C',
    tags: ['helado', 'paleta', 'aguacrema', 'coco'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '100ml', displayValue: '100ml (Individual)', price: 1190, stock: 155, order: 1 },
      { value: '140ml', displayValue: '140ml (Grande)', price: 1690, stock: 105, order: 2 },
    ],
  },

  // Subcategoría: Cassatas
  {
    name: 'Producto-6-008',
    description: 'Cassata neopolitana 3 sabores para pruebas de sistema',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6D-Cassatas'],
    brandName: 'Marca-D',
    tags: ['helado', 'cassata', 'neopolitana', 'familiar'],
    featured: true,
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '1L', displayValue: '1L (Cassata)', price: 5490, stock: 70, order: 1 },
      { value: '2L', displayValue: '2L (Cassata Familiar)', price: 9990, stock: 50, order: 2 },
    ],
  },
  {
    name: 'Producto-6-009',
    description: 'Cassata sabor chocolate para pruebas de sistema',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6D-Cassatas'],
    brandName: 'Marca-D',
    tags: ['helado', 'cassata', 'chocolate'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '1L', displayValue: '1L (Cassata)', price: 5490, stock: 65, order: 1 },
      { value: '2L', displayValue: '2L (Cassata Familiar)', price: 9990, stock: 45, order: 2 },
    ],
  },

  // Subcategoría: Conos
  {
    name: 'Producto-6-010',
    description: 'Cono de helado sabor vainilla con cobertura de chocolate para pruebas de sistema',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6E-Conos'],
    brandName: 'Marca-E',
    tags: ['helado', 'cono', 'vainilla', 'chocolate'],
    featured: true,
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '100ml', displayValue: '100ml (Individual)', price: 1890, stock: 140, order: 1 },
      { value: '150ml', displayValue: '150ml (Grande)', price: 2490, stock: 100, order: 2 },
    ],
  },
  {
    name: 'Producto-6-011',
    description: 'Cono de helado sabor frutilla con trozos de frutilla para pruebas de sistema',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6E-Conos'],
    brandName: 'Marca-E',
    tags: ['helado', 'cono', 'frutilla'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '100ml', displayValue: '100ml (Individual)', price: 1890, stock: 135, order: 1 },
      { value: '150ml', displayValue: '150ml (Grande)', price: 2490, stock: 95, order: 2 },
    ],
  },
  {
    name: 'Producto-6-012',
    description: 'Cono de helado sabor chocolate intenso para pruebas de sistema',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6E-Conos'],
    brandName: 'Marca-E',
    tags: ['helado', 'cono', 'chocolate', 'intenso'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '100ml', displayValue: '100ml (Individual)', price: 1890, stock: 130, order: 1 },
      { value: '150ml', displayValue: '150ml (Grande)', price: 2490, stock: 90, order: 2 },
    ],
  },
];

async function seedProducts() {
  try {
    console.log('🔄 Iniciando seed de productos...\n');

    // Conectar a MongoDB
    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
      throw new Error('MONGODB_URI no está configurada');
    }

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Preguntar si limpiar productos existentes
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      readline.question('¿Deseas eliminar todos los productos y variantes existentes? (s/n): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() === 's') {
      const deletedVariants = await ProductVariant.deleteMany({});
      const deletedParents = await ProductParent.deleteMany({});
      console.log(`\n🗑️  ${deletedVariants.deletedCount} variantes eliminadas`);
      console.log(`🗑️  ${deletedParents.deletedCount} productos eliminados\n`);
    }

    let createdParents = 0;
    let updatedParents = 0;
    let skippedParents = 0;
    let createdVariants = 0;
    let updatedVariants = 0;

    // Cargar todas las categorías y marcas para mapeo
    const categories = await Category.find({});
    const brands = await Brand.find({});

    const categoryMap = new Map(categories.map(cat => [cat.name, cat._id]));
    const brandMap = new Map(brands.map(brand => [brand.name, brand._id]));

    console.log('📦 Creando productos y variantes...\n');

    for (const productData of productsToSeed) {
      try {
        // Mapear nombres de categorías a IDs
        const categoryIds = productData.categoryNames
          .map(name => categoryMap.get(name))
          .filter(id => id !== undefined) as mongoose.Types.ObjectId[];

        if (categoryIds.length === 0) {
          console.error(`❌ Categorías no encontradas para "${productData.name}"`);
          skippedParents++;
          continue;
        }

        // Mapear nombre de marca a ID
        const brandId = brandMap.get(productData.brandName);
        if (!brandId) {
          console.error(`❌ Marca "${productData.brandName}" no encontrada para "${productData.name}"`);
          skippedParents++;
          continue;
        }

        // Verificar si el producto padre ya existe
        let parentProduct = await ProductParent.findOne({ name: productData.name });

        // Determinar si es producto multi-dimensional o simple
        const isMultiDimensional = !!productData.variantAttributes;

        // Construir variantAttributes según el tipo
        let variantAttributes;
        if (isMultiDimensional) {
          // Producto con múltiples dimensiones
          variantAttributes = productData.variantAttributes!;
        } else {
          // Producto con una sola dimensión
          variantAttributes = [
            {
              name: productData.variantAttributeName!,
              displayName: productData.variantAttributeDisplayName!,
              order: 1,
              values: productData.variants!.map(v => ({
                value: v.value,
                displayValue: v.displayValue,
                order: v.order,
              })),
            },
          ];
        }

        if (parentProduct) {
          // Actualizar producto padre existente
          parentProduct.description = productData.description;
          parentProduct.categories = categoryIds;
          parentProduct.brand = brandId;
          parentProduct.tags = productData.tags || [];
          parentProduct.featured = productData.featured || false;
          parentProduct.variantAttributes = variantAttributes;
          await parentProduct.save();
          updatedParents++;
        } else {
          // Crear nuevo producto padre
          parentProduct = await ProductParent.create({
            name: productData.name,
            description: productData.description,
            categories: categoryIds,
            brand: brandId,
            tags: productData.tags || [],
            featured: productData.featured || false,
            active: true,
            variantAttributes: variantAttributes,
            tieredDiscounts: [],
            views: 0,
          });
          createdParents++;
          console.log(`✅ ${parentProduct.name}`);
        }

        // Crear/Actualizar variantes según el tipo de producto
        if (isMultiDimensional) {
          // Producto multi-dimensional: usar multiVariants
          let order = 1;
          for (const variantData of productData.multiVariants!) {
            const sku = variantData.sku;

            // Construir nombre de variante basado en las combinaciones
            const attributeStrings = Object.entries(variantData.attributeCombination)
              .map(([key, value]) => {
                const attr = productData.variantAttributes!.find(a => a.name === key);
                const val = attr?.values.find(v => v.value === value);
                return val?.displayValue || value;
              })
              .join(' - ');
            const variantName = `${productData.name} ${attributeStrings}`;

            let variant = await ProductVariant.findOne({ sku });

            if (variant) {
              // Actualizar variante existente
              variant.name = variantName;
              variant.attributes = variantData.attributeCombination;
              variant.price = variantData.price;
              variant.stock = variantData.stock;
              variant.order = order;
              variant.parentProduct = parentProduct._id;
              await variant.save();
              updatedVariants++;
            } else {
              // Crear nueva variante
              await ProductVariant.create({
                parentProduct: parentProduct._id,
                sku,
                attributes: variantData.attributeCombination,
                name: variantName,
                price: variantData.price,
                stock: variantData.stock,
                trackStock: true,
                allowBackorder: false,
                lowStockThreshold: 10,
                active: true,
                order: order,
                views: 0,
                images: ['https://via.placeholder.com/400x400?text=Producto'], // Imagen placeholder
              });
              createdVariants++;
            }
            order++;
          }
        } else {
          // Producto simple: usar variants
          for (const variantData of productData.variants!) {
            const sku = `${productData.name.toUpperCase().replace(/-/g, '')}-${variantData.value.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
            const variantName = `${productData.name} ${variantData.displayValue}`;

            let variant = await ProductVariant.findOne({ sku });

            if (variant) {
              // Actualizar variante existente
              variant.name = variantName;
              variant.attributes = { [productData.variantAttributeName!]: variantData.value };
              variant.price = variantData.price;
              variant.stock = variantData.stock;
              variant.order = variantData.order;
              variant.parentProduct = parentProduct._id;
              await variant.save();
              updatedVariants++;
            } else {
              // Crear nueva variante
              await ProductVariant.create({
                parentProduct: parentProduct._id,
                sku,
                attributes: { [productData.variantAttributeName!]: variantData.value },
                name: variantName,
                price: variantData.price,
                stock: variantData.stock,
                trackStock: true,
                allowBackorder: false,
                lowStockThreshold: 10,
                active: true,
                order: variantData.order,
                views: 0,
                images: ['https://via.placeholder.com/400x400?text=Producto'], // Imagen placeholder
              });
              createdVariants++;
            }
          }
        }

      } catch (error: any) {
        console.error(`❌ Error con "${productData.name}":`, error.message);
        skippedParents++;
      }
    }

    // Resumen
    console.log('\n' + '═'.repeat(70));
    console.log('📊 RESUMEN DE SEED');
    console.log('═'.repeat(70));
    console.log(`✅ Productos creados: ${createdParents}`);
    console.log(`🔄 Productos actualizados: ${updatedParents}`);
    console.log(`⚠️  Productos omitidos: ${skippedParents}`);
    console.log(`✅ Variantes creadas: ${createdVariants}`);
    console.log(`🔄 Variantes actualizadas: ${updatedVariants}`);
    console.log(`📦 Total productos procesados: ${productsToSeed.length}`);
    console.log('═'.repeat(70) + '\n');

    // Estadísticas por categoría
    console.log('═'.repeat(90));
    console.log('📊 PRODUCTOS POR CATEGORÍA');
    console.log('═'.repeat(90));
    console.log('');

    const mainCats = await Category.find({ parent: null, active: true }).sort({ order: 1 });

    for (const mainCat of mainCats) {
      const productCount = await ProductParent.countDocuments({
        categories: mainCat._id,
        active: true,
      });

      const variantCount = await ProductVariant.countDocuments({
        parentProduct: {
          $in: (await ProductParent.find({ categories: mainCat._id, active: true })).map(p => p._id),
        },
        active: true,
      });

      console.log(`📁 ${mainCat.name}: ${productCount} productos, ${variantCount} variantes`);
    }

    console.log('\n' + '═'.repeat(90) + '\n');

  } catch (error: any) {
    console.error('❌ Error fatal en seed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
if (require.main === module) {
  seedProducts();
}

export default seedProducts;
