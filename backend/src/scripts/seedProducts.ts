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
  // Para productos SIN variantes (unitarios)
  singleVariant?: {
    sku: string;
    price: number;
    stock: number;
  };
  // Para productos de una sola dimensión de variante
  variantAttributeName?: string; // ej: "tamaño", "sabor", "peso"
  variantAttributeDisplayName?: string; // ej: "Tamaño", "Sabor", "Peso"
  variants?: {
    value: string; // ej: "350ml", "500ml"
    displayValue: string; // ej: "350ml (Lata)", "500ml (Botella)"
    price: number;
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
    attributeCombination: { [attributeName: string]: string };
    sku: string;
    price: number;
    stock: number;
  }[];
}

const productsToSeed: ProductSeed[] = [
  // ===================================================================
  // CATEGORIA 1: BEBIDAS
  // ===================================================================

  // Subcategoría: Gaseosas (CON variantes)
  {
    name: 'Coca Cola',
    description: 'La auténtica Coca Cola, refrescante bebida gaseosa sabor cola',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1A-Gaseosas'],
    brandName: 'Marca-A',
    tags: ['gaseosa', 'bebida', 'cola', 'refrescante'],
    featured: true,
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '350ml', displayValue: '350ml (Lata)', price: 990, stock: 150, order: 1 },
      { value: '500ml', displayValue: '500ml (Botella)', price: 1490, stock: 120, order: 2 },
      { value: '1.5L', displayValue: '1.5L (Botella)', price: 2490, stock: 80, order: 3 },
      { value: '2L', displayValue: '2L (Botella)', price: 2990, stock: 70, order: 4 },
      { value: '3L', displayValue: '3L (Botella Familiar)', price: 3990, stock: 50, order: 5 },
    ],
  },
  {
    name: 'Fanta Naranja',
    description: 'Fanta sabor naranja, la clásica bebida gaseosa con sabor frutal',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1A-Gaseosas'],
    brandName: 'Marca-A',
    tags: ['gaseosa', 'bebida', 'naranja', 'frutal'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '350ml', displayValue: '350ml (Lata)', price: 990, stock: 140, order: 1 },
      { value: '500ml', displayValue: '500ml (Botella)', price: 1490, stock: 110, order: 2 },
      { value: '1.5L', displayValue: '1.5L (Botella)', price: 2490, stock: 75, order: 3 },
      { value: '2L', displayValue: '2L (Botella)', price: 2990, stock: 65, order: 4 },
    ],
  },
  {
    name: 'Sprite',
    description: 'Sprite lima-limón, refrescante y sin colorantes',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1A-Gaseosas'],
    brandName: 'Marca-A',
    tags: ['gaseosa', 'bebida', 'limón', 'lima', 'refrescante'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '350ml', displayValue: '350ml (Lata)', price: 990, stock: 130, order: 1 },
      { value: '500ml', displayValue: '500ml (Botella)', price: 1490, stock: 100, order: 2 },
      { value: '1.5L', displayValue: '1.5L (Botella)', price: 2490, stock: 70, order: 3 },
    ],
  },
  {
    name: 'Pepsi',
    description: 'Pepsi cola, sabor intenso y refrescante',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1A-Gaseosas'],
    brandName: 'Marca-B',
    tags: ['gaseosa', 'bebida', 'cola'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '350ml', displayValue: '350ml (Lata)', price: 950, stock: 125, order: 1 },
      { value: '500ml', displayValue: '500ml (Botella)', price: 1390, stock: 95, order: 2 },
      { value: '1.5L', displayValue: '1.5L (Botella)', price: 2390, stock: 65, order: 3 },
    ],
  },

  // Subcategoría: Jugos
  {
    name: 'Jugo Jumex Durazno',
    description: 'Jugo de durazno Jumex, sabor natural',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1B-Jugos'],
    brandName: 'Marca-C',
    tags: ['jugo', 'bebida', 'durazno', 'frutal'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '200ml', displayValue: '200ml (Caja)', price: 690, stock: 200, order: 1 },
      { value: '1L', displayValue: '1L (Tetra Pak)', price: 1890, stock: 90, order: 2 },
    ],
  },
  {
    name: 'Jugo Ades Manzana',
    description: 'Bebida a base de soja sabor manzana',
    categoryNames: ['Categoria-1-Bebidas', 'Subcat-1B-Jugos'],
    brandName: 'Marca-C',
    tags: ['jugo', 'bebida', 'manzana', 'soja'],
    variantAttributeName: 'tamaño',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '200ml', displayValue: '200ml (Caja)', price: 790, stock: 190, order: 1 },
      { value: '1L', displayValue: '1L (Tetra Pak)', price: 1990, stock: 85, order: 2 },
    ],
  },

  // Subcategoría: Aguas
  {
    name: 'Agua Mineral Villavicencio',
    description: 'Agua mineral natural sin gas',
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

  // ===================================================================
  // CATEGORIA 2: SNACKS
  // ===================================================================

  // Subcategoría: Salados (CON variantes)
  {
    name: 'Papas Lays Clásicas',
    description: 'Papas fritas Lays sabor natural, las clásicas de siempre',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2A-Salados'],
    brandName: 'Marca-F',
    tags: ['snack', 'papas', 'salado', 'clasico'],
    featured: true,
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '42g', displayValue: '42g (Individual)', price: 890, stock: 200, order: 1 },
      { value: '140g', displayValue: '140g (Mediano)', price: 1990, stock: 120, order: 2 },
      { value: '280g', displayValue: '280g (Familiar)', price: 3490, stock: 80, order: 3 },
    ],
  },
  {
    name: 'Doritos Nacho',
    description: 'Doritos sabor queso nacho, intenso y crujiente',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2A-Salados'],
    brandName: 'Marca-F',
    tags: ['snack', 'doritos', 'salado', 'queso'],
    featured: true,
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '48g', displayValue: '48g (Individual)', price: 990, stock: 180, order: 1 },
      { value: '150g', displayValue: '150g (Mediano)', price: 2190, stock: 110, order: 2 },
      { value: '300g', displayValue: '300g (Familiar)', price: 3990, stock: 70, order: 3 },
    ],
  },
  {
    name: 'Cheetos',
    description: 'Cheetos sabor queso, el snack que te deja los dedos naranjas',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2A-Salados'],
    brandName: 'Marca-F',
    tags: ['snack', 'cheetos', 'salado', 'queso'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '40g', displayValue: '40g (Individual)', price: 850, stock: 190, order: 1 },
      { value: '150g', displayValue: '150g (Mediano)', price: 2090, stock: 115, order: 2 },
    ],
  },

  // Subcategoría: Salados (SIN variantes - productos unitarios)
  {
    name: 'Pringles Original 124g',
    description: 'Pringles sabor original en su clásico tubo, 124g',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2A-Salados'],
    brandName: 'Marca-G',
    tags: ['snack', 'pringles', 'salado', 'unitario'],
    singleVariant: {
      sku: 'PRINGLES-ORIGINAL-124G',
      price: 2990,
      stock: 85,
    },
  },
  {
    name: 'Pringles Crema y Cebolla 124g',
    description: 'Pringles sabor crema y cebolla, 124g',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2A-Salados'],
    brandName: 'Marca-G',
    tags: ['snack', 'pringles', 'salado', 'unitario'],
    singleVariant: {
      sku: 'PRINGLES-CREMA-CEBOLLA-124G',
      price: 2990,
      stock: 75,
    },
  },

  // Subcategoría: Dulces
  {
    name: 'Popcorn Caramelo',
    description: 'Palomitas de maíz acaramelado, dulce y crujiente',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2B-Dulces'],
    brandName: 'Marca-H',
    tags: ['snack', 'dulce', 'palomitas', 'caramelo'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '80g', displayValue: '80g (Individual)', price: 990, stock: 160, order: 1 },
      { value: '200g', displayValue: '200g (Familiar)', price: 2290, stock: 100, order: 2 },
    ],
  },

  // Subcategoría: Frutos Secos
  {
    name: 'Maní Salado',
    description: 'Maní tostado y salado, perfecto para compartir',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2C-Frutos-Secos'],
    brandName: 'Marca-I',
    tags: ['snack', 'frutos-secos', 'mani', 'salado'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Bolsa)', price: 1490, stock: 120, order: 1 },
      { value: '250g', displayValue: '250g (Bolsa)', price: 2990, stock: 80, order: 2 },
    ],
  },
  {
    name: 'Mix Frutos Secos Premium',
    description: 'Mezcla de nueces, almendras, maní y pasas',
    categoryNames: ['Categoria-2-Snacks', 'Subcat-2C-Frutos-Secos'],
    brandName: 'Marca-I',
    tags: ['snack', 'frutos-secos', 'mix', 'premium'],
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

  // Subcategoría: Barras (SIN variantes - productos unitarios)
  {
    name: 'Snickers 50g',
    description: 'Barra de chocolate Snickers con maní y caramelo, 50g',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3A-Barras'],
    brandName: 'Marca-J',
    tags: ['chocolate', 'barra', 'snickers', 'maní', 'caramelo'],
    featured: true,
    singleVariant: {
      sku: 'SNICKERS-50G',
      price: 890,
      stock: 200,
    },
  },
  {
    name: 'Kit Kat 45g',
    description: 'Kit Kat wafer cubierto de chocolate con leche, 45g',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3A-Barras'],
    brandName: 'Marca-J',
    tags: ['chocolate', 'barra', 'kitkat', 'wafer'],
    featured: true,
    singleVariant: {
      sku: 'KITKAT-45G',
      price: 850,
      stock: 190,
    },
  },
  {
    name: 'Milky Way 52g',
    description: 'Barra Milky Way con caramelo y nougat cubierto de chocolate, 52g',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3A-Barras'],
    brandName: 'Marca-J',
    tags: ['chocolate', 'barra', 'milkyway', 'caramelo'],
    singleVariant: {
      sku: 'MILKYWAY-52G',
      price: 870,
      stock: 180,
    },
  },
  {
    name: 'Twix 50g',
    description: 'Twix galleta con caramelo cubierta de chocolate, 50g',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3A-Barras'],
    brandName: 'Marca-J',
    tags: ['chocolate', 'barra', 'twix', 'caramelo', 'galleta'],
    singleVariant: {
      sku: 'TWIX-50G',
      price: 890,
      stock: 175,
    },
  },
  {
    name: 'Snickers 50g',
    description: 'Barra de chocolate Snickers con maní y caramelo, 50g',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3A-Barras'],
    brandName: 'Marca-J',
    tags: ['chocolate', 'barra', 'snickers', 'maní', 'caramelo'],
    singleVariant: {
      sku: 'M&MS-45G',
      price: 890,
      stock: 185,
    },
  },
  {
    name: 'Hersheys 43g',
    description: 'Chocolate Hersheys con leche, el clásico americano, 43g',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3A-Barras'],
    brandName: 'Marca-K',
    tags: ['chocolate', 'barra', 'hersheys', 'leche'],
    singleVariant: {
      sku: 'HERSHEYS-43G',
      price: 790,
      stock: 170,
    },
  },

  // Subcategoría: Barras (CON variantes)
  {
    name: 'Toblerone',
    description: 'Toblerone chocolate suizo con miel y almendras',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3A-Barras'],
    brandName: 'Marca-K',
    tags: ['chocolate', 'barra', 'toblerone', 'almendras', 'premium'],
    featured: true,
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '50g', displayValue: '50g (Mini)', price: 1190, stock: 140, order: 1 },
      { value: '100g', displayValue: '100g (Estándar)', price: 2190, stock: 100, order: 2 },
      { value: '200g', displayValue: '200g (Grande)', price: 3990, stock: 70, order: 3 },
    ],
  },

  // Subcategoría: Bombones
  {
    name: 'Ferrero Rocher',
    description: 'Bombones Ferrero Rocher con avellana y chocolate',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3B-Bombones'],
    brandName: 'Marca-L',
    tags: ['chocolate', 'bombones', 'ferrero', 'avellana', 'premium'],
    featured: true,
    variantAttributeName: 'cantidad',
    variantAttributeDisplayName: 'Presentación',
    variants: [
      { value: '3-unidades', displayValue: '3 unidades (37.5g)', price: 2490, stock: 100, order: 1 },
      { value: '8-unidades', displayValue: '8 unidades (100g)', price: 5490, stock: 70, order: 2 },
      { value: '16-unidades', displayValue: '16 unidades (200g)', price: 9990, stock: 50, order: 3 },
    ],
  },
  {
    name: 'Bon o Bon',
    description: 'Bombones Bon o Bon con maní cubiertos de chocolate',
    categoryNames: ['Categoria-3-Chocolates', 'Subcat-3B-Bombones'],
    brandName: 'Marca-L',
    tags: ['chocolate', 'bombones', 'bon-o-bon', 'maní'],
    variantAttributeName: 'cantidad',
    variantAttributeDisplayName: 'Presentación',
    variants: [
      { value: '15g-unidad', displayValue: 'Unidad 15g', price: 290, stock: 250, order: 1 },
      { value: '270g-caja', displayValue: 'Caja 270g (18 unidades)', price: 4490, stock: 60, order: 2 },
    ],
  },

  // ===================================================================
  // CATEGORIA 4: CARAMELOS
  // ===================================================================

  // Subcategoría: Duros
  {
    name: 'Caramelos Menthoplus',
    description: 'Caramelos duros sabor menta, refrescantes',
    categoryNames: ['Categoria-4-Caramelos', 'Subcat-4A-Duros'],
    brandName: 'Marca-N',
    tags: ['caramelo', 'duro', 'menta', 'refrescante'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Presentación',
    variants: [
      { value: '100g', displayValue: '100g (Bolsa)', price: 890, stock: 180, order: 1 },
      { value: '250g', displayValue: '250g (Bolsa)', price: 1990, stock: 120, order: 2 },
    ],
  },
  {
    name: 'Chupetín Pico Dulce',
    description: 'Chupetín clásico sabores surtidos',
    categoryNames: ['Categoria-4-Caramelos', 'Subcat-4A-Duros'],
    brandName: 'Marca-N',
    tags: ['caramelo', 'chupetín', 'lollipop', 'surtido'],
    variantAttributeName: 'cantidad',
    variantAttributeDisplayName: 'Cantidad',
    variants: [
      { value: '1-unidad', displayValue: '1 unidad', price: 190, stock: 300, order: 1 },
      { value: '12-unidades', displayValue: '12 unidades', price: 1790, stock: 100, order: 2 },
    ],
  },

  // Subcategoría: Gomitas
  {
    name: 'Gomitas Mogul',
    description: 'Gomitas Mogul sabor frutas',
    categoryNames: ['Categoria-4-Caramelos', 'Subcat-4B-Gomitas'],
    brandName: 'Marca-O',
    tags: ['caramelo', 'gomita', 'frutas', 'mogul'],
    featured: true,
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Bolsa)', price: 1290, stock: 170, order: 1 },
      { value: '250g', displayValue: '250g (Bolsa)', price: 2790, stock: 110, order: 2 },
    ],
  },
  {
    name: 'Gomitas Bananita',
    description: 'Gomitas Bananita dulce de leche',
    categoryNames: ['Categoria-4-Caramelos', 'Subcat-4B-Gomitas'],
    brandName: 'Marca-O',
    tags: ['caramelo', 'gomita', 'bananita', 'dulce-de-leche'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Peso',
    variants: [
      { value: '100g', displayValue: '100g (Bolsa)', price: 1390, stock: 160, order: 1 },
      { value: '250g', displayValue: '250g (Bolsa)', price: 2990, stock: 105, order: 2 },
    ],
  },

  // Subcategoría: Chicles (SIN variantes)
  {
    name: 'Chicle Beldent Menta',
    description: 'Chicle Beldent sabor menta, 10 pastillas',
    categoryNames: ['Categoria-4-Caramelos', 'Subcat-4C-Chicles'],
    brandName: 'Marca-P',
    tags: ['chicle', 'menta', 'beldent'],
    singleVariant: {
      sku: 'BELDENT-MENTA-10U',
      price: 690,
      stock: 200,
    },
  },
  {
    name: 'Chicle Beldent Tutti Frutti',
    description: 'Chicle Beldent sabor tutti frutti, 10 pastillas',
    categoryNames: ['Categoria-4-Caramelos', 'Subcat-4C-Chicles'],
    brandName: 'Marca-P',
    tags: ['chicle', 'frutas', 'beldent'],
    singleVariant: {
      sku: 'BELDENT-TUTTI-10U',
      price: 690,
      stock: 195,
    },
  },
  {
    name: 'Chicle Topline Menta',
    description: 'Chicle Topline sabor menta fuerte, blister 5 unidades',
    categoryNames: ['Categoria-4-Caramelos', 'Subcat-4C-Chicles'],
    brandName: 'Marca-P',
    tags: ['chicle', 'menta', 'topline'],
    singleVariant: {
      sku: 'TOPLINE-MENTA-5U',
      price: 590,
      stock: 185,
    },
  },

  // ===================================================================
  // CATEGORIA 5: REPOSTERIA
  // ===================================================================

  // Subcategoría: Galletas
  {
    name: 'Oreo Original',
    description: 'Galletas Oreo clásicas con crema de vainilla',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5A-Galletas'],
    brandName: 'Marca-Q',
    tags: ['galleta', 'oreo', 'chocolate', 'crema'],
    featured: true,
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '54g', displayValue: '54g (6 galletas)', price: 790, stock: 150, order: 1 },
      { value: '117g', displayValue: '117g (Paquete)', price: 1490, stock: 120, order: 2 },
      { value: '432g', displayValue: '432g (Familia)', price: 4490, stock: 70, order: 3 },
    ],
  },
  {
    name: 'Chips Ahoy',
    description: 'Galletas Chips Ahoy con chispas de chocolate',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5A-Galletas'],
    brandName: 'Marca-Q',
    tags: ['galleta', 'chips-ahoy', 'chocolate', 'dulce'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '100g', displayValue: '100g (Paquete)', price: 1190, stock: 145, order: 1 },
      { value: '250g', displayValue: '250g (Paquete)', price: 2690, stock: 95, order: 2 },
    ],
  },
  {
    name: 'Galletas Ritz',
    description: 'Galletas saladas Ritz, crackers clásicas',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5A-Galletas'],
    brandName: 'Marca-R',
    tags: ['galleta', 'salada', 'ritz', 'cracker'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '100g', displayValue: '100g (Paquete)', price: 1390, stock: 130, order: 1 },
      { value: '300g', displayValue: '300g (Familia)', price: 2990, stock: 85, order: 2 },
    ],
  },

  // Subcategoría: Alfajores (SIN variantes)
  {
    name: 'Alfajor Jorgito Chocolate',
    description: 'Alfajor Jorgito triple de chocolate con dulce de leche, 60g',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5B-Alfajores'],
    brandName: 'Marca-S',
    tags: ['alfajor', 'jorgito', 'chocolate', 'dulce-de-leche'],
    featured: true,
    singleVariant: {
      sku: 'JORGITO-CHOCOLATE-60G',
      price: 690,
      stock: 200,
    },
  },
  {
    name: 'Alfajor Havanna Blanco',
    description: 'Alfajor Havanna cubierto de chocolate blanco, 70g',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5B-Alfajores'],
    brandName: 'Marca-S',
    tags: ['alfajor', 'havanna', 'chocolate-blanco', 'premium'],
    featured: true,
    singleVariant: {
      sku: 'HAVANNA-BLANCO-70G',
      price: 1290,
      stock: 150,
    },
  },
  {
    name: 'Alfajor Havanna Negro',
    description: 'Alfajor Havanna cubierto de chocolate negro, 70g',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5B-Alfajores'],
    brandName: 'Marca-S',
    tags: ['alfajor', 'havanna', 'chocolate-negro', 'premium'],
    featured: true,
    singleVariant: {
      sku: 'HAVANNA-NEGRO-70G',
      price: 1290,
      stock: 145,
    },
  },
  {
    name: 'Alfajor Capitán del Espacio',
    description: 'Alfajor clásico Capitán del Espacio triple, 60g',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5B-Alfajores'],
    brandName: 'Marca-S',
    tags: ['alfajor', 'capitan-espacio', 'clasico'],
    singleVariant: {
      sku: 'CAPITAN-ESPACIO-60G',
      price: 590,
      stock: 180,
    },
  },
  {
    name: 'Alfajor Oreo',
    description: 'Alfajor Oreo con crema de vainilla, 55g',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5B-Alfajores'],
    brandName: 'Marca-S',
    tags: ['alfajor', 'oreo', 'vainilla'],
    singleVariant: {
      sku: 'ALFAJOR-OREO-55G',
      price: 790,
      stock: 170,
    },
  },

  // Subcategoría: Obleas
  {
    name: 'Oblea Bon o Bon',
    description: 'Oblea Bon o Bon rellena de crema de maní',
    categoryNames: ['Categoria-5-Reposteria', 'Subcat-5C-Obleas'],
    brandName: 'Marca-T',
    tags: ['oblea', 'bon-o-bon', 'maní'],
    variantAttributeName: 'peso',
    variantAttributeDisplayName: 'Tamaño',
    variants: [
      { value: '100g', displayValue: '100g (Paquete)', price: 1290, stock: 140, order: 1 },
      { value: '250g', displayValue: '250g (Paquete)', price: 2890, stock: 90, order: 2 },
    ],
  },

  // ===================================================================
  // CATEGORIA 6: HELADOS
  // ===================================================================

  // Subcategoría: Paletas de Crema
  {
    name: 'Paleta Magnum Classic',
    description: 'Paleta Magnum helado de vainilla con cobertura de chocolate belga',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6B-Paletas-Crema'],
    brandName: 'Marca-B',
    tags: ['helado', 'paleta', 'magnum', 'vainilla', 'chocolate'],
    featured: true,
    singleVariant: {
      sku: 'MAGNUM-CLASSIC-110ML',
      price: 2490,
      stock: 80,
    },
  },
  {
    name: 'Paleta Magnum Almendras',
    description: 'Paleta Magnum helado de vainilla con chocolate y almendras',
    categoryNames: ['Categoria-6-Helados', 'Subcat-6B-Paletas-Crema'],
    brandName: 'Marca-B',
    tags: ['helado', 'paleta', 'magnum', 'almendras'],
    featured: true,
    singleVariant: {
      sku: 'MAGNUM-ALMENDRAS-110ML',
      price: 2690,
      stock: 75,
    },
  },

  // Subcategoría: Conos
  {
    name: 'Cono Helado Vainilla',
    description: 'Cono de helado de vainilla con cobertura de chocolate',
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

  // Subcategoría: Cassatas
  {
    name: 'Cassata Neopolitana',
    description: 'Cassata 3 sabores: chocolate, frutilla y vainilla',
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
    console.log('✅ Conectado a MongoDB\n');

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

        // Determinar el tipo de producto
        const isSingleVariant = !!productData.singleVariant;
        const isMultiDimensional = !!productData.variantAttributes;

        // Construir variantAttributes
        let variantAttributes: Array<{
          name: string;
          displayName: string;
          order: number;
          values: {
            value: string;
            displayValue: string;
            order: number;
          }[];
        }>;

        if (isSingleVariant) {
          // Producto sin variantes: crear atributo vacío
          variantAttributes = [];
        } else if (isMultiDimensional) {
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
            views: 0,
          });
          createdParents++;
          console.log(`✅ ${parentProduct.name}`);
        }

        // Crear/Actualizar variantes según el tipo de producto
        if (isSingleVariant) {
          // Producto unitario: crear una sola variante
          const variantData = productData.singleVariant!;
          let variant = await ProductVariant.findOne({ sku: variantData.sku });

          if (variant) {
            // Actualizar variante existente
            variant.name = productData.name;
            variant.attributes = {};
            variant.price = variantData.price;
            variant.stock = variantData.stock;
            variant.parentProduct = parentProduct._id;
            await variant.save();
            updatedVariants++;
          } else {
            // Crear nueva variante
            await ProductVariant.create({
              parentProduct: parentProduct._id,
              sku: variantData.sku,
              attributes: {},
              name: productData.name,
              price: variantData.price,
              stock: variantData.stock,
              trackStock: true,
              allowBackorder: false,
              lowStockThreshold: 10,
              active: true,
              order: 1,
              views: 0,
            });
            createdVariants++;
          }
        } else if (isMultiDimensional) {
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
              });
              createdVariants++;
            }
            order++;
          }
        } else {
          // Producto simple: usar variants
          for (const variantData of productData.variants!) {
            const sku = `${productData.name.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '')}-${variantData.value.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
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

    // Contar productos con y sin variantes
    const productsWithVariants = productsToSeed.filter(p => !p.singleVariant).length;
    const productsWithoutVariants = productsToSeed.filter(p => p.singleVariant).length;

    console.log('═'.repeat(70));
    console.log('📊 TIPOS DE PRODUCTOS');
    console.log('═'.repeat(70));
    console.log(`🔀 Productos con variantes: ${productsWithVariants}`);
    console.log(`📦 Productos sin variantes (unitarios): ${productsWithoutVariants}`);
    console.log('═'.repeat(70) + '\n');

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
