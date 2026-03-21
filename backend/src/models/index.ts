export { User, IUser } from './User';
export { Category, ICategory } from './Category';
export { Brand, IBrand } from './Brand';
export { Tag, ITag, PREDEFINED_TAGS } from './Tag';
export { Order, IOrder, IOrderItem } from './Order';

// Nuevos modelos para sistema de variantes
export { default as ProductParent, IProductParent, IVariantAttribute } from './ProductParent';
export { default as ProductVariant, IProductVariant, IFixedDiscount } from './ProductVariant';
export { default as StockMovement, IStockMovement, StockMovementType } from './StockMovement';
export { default as AuditLog, IAuditLog, AuditAction, AuditEntity } from './AuditLog';

// NOTA: El modelo Product.ts antiguo debe ser deprecado y reemplazado por ProductParent + ProductVariant
