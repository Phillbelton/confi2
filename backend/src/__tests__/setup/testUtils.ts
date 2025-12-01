import jwt from 'jsonwebtoken';
import { User, IUser } from '../../models/User';
import { Category } from '../../models/Category';
import { Brand } from '../../models/Brand';
import { Tag } from '../../models/Tag';
import ProductParent from '../../models/ProductParent';
import ProductVariant from '../../models/ProductVariant';
import { Order } from '../../models/Order';
import AuditLog, { AuditAction, AuditEntity } from '../../models/AuditLog';
import mongoose from 'mongoose';

/**
 * Create a test user with specified role and data
 */
export async function createTestUser(data?: {
  name?: string;
  email?: string;
  password?: string;
  role?: 'cliente' | 'funcionario' | 'admin';
  phone?: string;
  active?: boolean;
}): Promise<IUser> {
  const userData = {
    name: data?.name || 'Test User',
    email: data?.email || `test-${Date.now()}@example.com`,
    password: data?.password || 'Test123!',
    role: data?.role || 'cliente',
    phone: data?.phone || '595981234567',
    active: data?.active !== undefined ? data.active : true,
  };

  const user = await User.create(userData);
  return user;
}

/**
 * Generate JWT token for a user
 */
export function generateAuthToken(user: IUser): string {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'test_secret', {
    expiresIn: '7d',
  });
}

/**
 * Create a test category
 */
export async function createTestCategory(data?: {
  name?: string;
  parent?: mongoose.Types.ObjectId;
  color?: string;
  order?: number;
  active?: boolean;
}) {
  const categoryData = {
    name: data?.name || `Test Category ${Date.now()}`,
    description: 'Test category description',
    color: data?.color || '#3B82F6',
    parent: data?.parent || null,
    order: data?.order !== undefined ? data.order : 0,
    active: data?.active !== undefined ? data.active : true,
  };

  return await Category.create(categoryData);
}

/**
 * Create a test brand
 */
export async function createTestBrand(data?: {
  name?: string;
  active?: boolean;
}) {
  const brandData = {
    name: data?.name || `Test Brand ${Date.now()}`,
    logo: '/uploads/brands/test-logo.jpg',
    active: data?.active !== undefined ? data.active : true,
  };

  return await Brand.create(brandData);
}

/**
 * Create a test tag
 */
export async function createTestTag(data?: {
  name?: string;
  color?: string;
  description?: string;
  order?: number;
  active?: boolean;
}) {
  const tagData = {
    name: data?.name || `Test Tag ${Date.now()}`,
    color: data?.color || '#10B981',
    description: data?.description || 'Test tag description',
    order: data?.order !== undefined ? data.order : 0,
    active: data?.active !== undefined ? data.active : true,
  };

  return await Tag.create(tagData);
}

/**
 * Create a test product parent
 */
export async function createTestProductParent(data?: {
  name?: string;
  categories?: mongoose.Types.ObjectId[];
  brand?: mongoose.Types.ObjectId;
  tags?: mongoose.Types.ObjectId[];
  active?: boolean;
}) {
  // Create dependencies if not provided
  let categories = data?.categories;
  if (!categories || categories.length === 0) {
    const category = await createTestCategory();
    categories = [category._id as mongoose.Types.ObjectId];
  }

  let brand = data?.brand;
  if (!brand) {
    const testBrand = await createTestBrand();
    brand = testBrand._id as mongoose.Types.ObjectId;
  }

  const productData = {
    name: data?.name || `Test Product ${Date.now()}`,
    description: 'Test product description',
    categories,
    brand,
    tags: data?.tags || [],
    images: ['/uploads/products/test-image.jpg'],
    seoTitle: 'Test Product SEO',
    seoDescription: 'Test product SEO description',
    variantAttributes: [],
    tieredDiscounts: [],
    featured: false,
    active: data?.active !== undefined ? data.active : true,
  };

  return await ProductParent.create(productData);
}

/**
 * Create a test product variant
 */
export async function createTestProductVariant(data?: {
  parentProduct?: mongoose.Types.ObjectId;
  name?: string;
  price?: number;
  stock?: number;
  lowStockThreshold?: number;
  active?: boolean;
}) {
  // Create parent if not provided
  let parentProduct = data?.parentProduct;
  if (!parentProduct) {
    const parent = await createTestProductParent();
    parentProduct = parent._id as mongoose.Types.ObjectId;
  }

  const variantData = {
    parentProduct,
    name: data?.name || `Test Variant ${Date.now()}`,
    description: 'Test variant description',
    price: data?.price || 10000,
    stock: data?.stock !== undefined ? data.stock : 100,
    attributes: {},
    images: ['/uploads/products/test-variant.jpg'],
    trackStock: true,
    allowBackorder: false,
    lowStockThreshold: data?.lowStockThreshold !== undefined ? data.lowStockThreshold : 10,
    active: data?.active !== undefined ? data.active : true,
    order: 0,
  };

  return await ProductVariant.create(variantData);
}

/**
 * Create a test order
 */
export async function createTestOrder(data?: {
  user?: IUser;
  items?: Array<{ variantId: mongoose.Types.ObjectId; quantity: number }>;
  status?: string;
}) {
  // Create user if not provided
  let user = data?.user;
  if (!user) {
    user = await createTestUser();
  }

  // Create order items if not provided
  let items = data?.items;
  if (!items || items.length === 0) {
    const variant = await createTestProductVariant({ price: 10000, stock: 100 });
    items = [{ variantId: variant._id as mongoose.Types.ObjectId, quantity: 2 }];
  }

  // Build order items with snapshots
  const orderItems = await Promise.all(
    items.map(async (item) => {
      const variant = await ProductVariant.findById(item.variantId);
      if (!variant) {
        throw new Error(`Variant ${item.variantId} not found`);
      }

      return {
        variant: variant._id,
        variantSnapshot: {
          sku: variant.sku,
          name: variant.name,
          price: variant.price,
          attributes: variant.attributes,
          image: variant.images[0] || '',
        },
        quantity: item.quantity,
        pricePerUnit: variant.price,
        discount: 0,
        subtotal: variant.price * item.quantity,
      };
    })
  );

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  const orderData = {
    customer: {
      user: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: {
        street: 'Test Street',
        number: '123',
        city: 'Asunción',
        neighborhood: 'Test Neighborhood',
      },
    },
    items: orderItems,
    subtotal,
    totalDiscount: 0,
    shippingCost: 0,
    total: subtotal,
    deliveryMethod: 'delivery',
    paymentMethod: 'cash',
    status: data?.status || 'pending_whatsapp',
    whatsappSent: false,
  };

  return await Order.create(orderData);
}

/**
 * Clear all database collections
 */
export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Create a test audit log
 */
export async function createTestAuditLog(data?: {
  user?: mongoose.Types.ObjectId;
  action?: AuditAction;
  entity?: AuditEntity;
  entityId?: mongoose.Types.ObjectId;
  changes?: { before?: any; after?: any };
  ipAddress?: string;
  userAgent?: string;
}) {
  // Create user if not provided
  let userId = data?.user;
  if (!userId) {
    const user = await createTestUser();
    userId = user._id as mongoose.Types.ObjectId;
  }

  const auditData = {
    user: userId,
    action: data?.action || 'create',
    entity: data?.entity || 'product',
    entityId: data?.entityId || new mongoose.Types.ObjectId(),
    changes: data?.changes || { before: {}, after: {} },
    ipAddress: data?.ipAddress || '127.0.0.1',
    userAgent: data?.userAgent || 'Mozilla/5.0 Test Agent',
  };

  return await AuditLog.create(auditData);
}

/**
 * Wait for a specific amount of time (for rate limiting tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
