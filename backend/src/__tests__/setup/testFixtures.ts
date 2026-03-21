/**
 * Test Fixtures - Reusable test data
 */

export const testUsers = {
  admin: {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'Admin123!',
    role: 'admin' as const,
    phone: '595981111111',
  },
  funcionario: {
    name: 'Funcionario User',
    email: 'funcionario@test.com',
    password: 'Func123!',
    role: 'funcionario' as const,
    phone: '595981222222',
  },
  cliente: {
    name: 'Cliente User',
    email: 'cliente@test.com',
    password: 'Cliente123!',
    role: 'cliente' as const,
    phone: '595981333333',
  },
};

export const testCategories = [
  {
    name: 'Chocolates',
    description: 'Deliciosos chocolates artesanales',
    color: '#8B4513',
    order: 1,
  },
  {
    name: 'Caramelos',
    description: 'Variedad de caramelos',
    color: '#FF1493',
    order: 2,
  },
  {
    name: 'Bombones',
    description: 'Bombones finos',
    color: '#4B0082',
    order: 3,
  },
];

export const testBrands = [
  {
    name: 'Arcor',
    logo: '/uploads/brands/arcor.jpg',
  },
  {
    name: 'Nestlé',
    logo: '/uploads/brands/nestle.jpg',
  },
  {
    name: 'Felfort',
    logo: '/uploads/brands/felfort.jpg',
  },
];

export const testTags = [
  {
    name: 'Nuevo',
    color: '#10B981',
    description: 'Productos nuevos',
    order: 1,
  },
  {
    name: 'Oferta',
    color: '#EF4444',
    description: 'Productos en oferta',
    order: 2,
  },
  {
    name: 'Popular',
    color: '#F59E0B',
    description: 'Productos más vendidos',
    order: 3,
  },
  {
    name: 'Sin TACC',
    color: '#8B5CF6',
    description: 'Sin gluten',
    order: 4,
  },
];

export const testProducts = [
  {
    name: 'Chocolate con Leche 100g',
    description: 'Delicioso chocolate con leche',
    price: 5000,
    stock: 50,
  },
  {
    name: 'Caramelos de Menta',
    description: 'Refrescantes caramelos de menta',
    price: 2500,
    stock: 100,
  },
  {
    name: 'Bombones Surtidos 250g',
    description: 'Caja de bombones variados',
    price: 15000,
    stock: 30,
  },
];

export const testAddresses = [
  {
    street: 'Av. Mariscal López',
    number: '1234',
    city: 'Asunción',
    neighborhood: 'Villa Morra',
    reference: 'Cerca del Shopping del Sol',
    isDefault: true,
  },
  {
    street: 'Calle Palma',
    number: '567',
    city: 'Asunción',
    neighborhood: 'Centro',
    reference: 'Entre Alberdi e Independencia Nacional',
    isDefault: false,
  },
];

export const validProductParent = {
  name: 'Test Product Parent',
  description: 'Test product parent description',
  seoTitle: 'Test Product SEO Title',
  seoDescription: 'Test product SEO description',
  variantAttributes: [],
  tieredDiscounts: [],
  featured: false,
};

export const validProductVariant = {
  name: 'Test Variant',
  description: 'Test variant description',
  price: 10000,
  stock: 100,
  attributes: {},
  trackStock: true,
  allowBackorder: false,
  lowStockThreshold: 10,
};

export const validOrder = {
  deliveryMethod: 'delivery' as const,
  paymentMethod: 'cash' as const,
  customerNotes: 'Test order notes',
  deliveryNotes: 'Test delivery notes',
};

// Invalid data for testing validation
export const invalidData = {
  email: 'not-an-email',
  password: '123', // Too short
  phone: 'invalid',
  color: 'not-a-hex-color',
  price: -100, // Negative
  stock: -10, // Negative
  quantity: 0, // Zero
};
