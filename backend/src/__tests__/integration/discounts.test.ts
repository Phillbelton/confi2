import request from 'supertest';
import app from '../../server';
import {
  createTestUser,
  generateAuthToken,
  createTestProductParent,
  createTestProductVariant,
  clearDatabase,
} from '../setup/testUtils';
import ProductParent from '../../models/ProductParent';
import ProductVariant from '../../models/ProductVariant';
import {
  calculatePriceByQuantity,
  getVisibleTierPreviews,
  getApplicableTier,
  applyDiscountToCart,
  formatDiscountBadges,
} from '../../services/discountService';

/**
 * Discount Module Tests
 * Comprehensive tests for fixed discounts, tiered discounts, and discount calculations
 */

describe('Discount Module', () => {
  let adminToken: string;
  let adminUser: any;

  beforeAll(async () => {
    adminUser = await createTestUser({
      email: 'admin-discount@test.com',
      role: 'admin',
    });
    adminToken = generateAuthToken(adminUser);
  });

  beforeEach(async () => {
    await ProductParent.deleteMany({});
    await ProductVariant.deleteMany({});
  });

  afterAll(async () => {
    await clearDatabase();
  });

  // ==================== Fixed Discount Tests ====================

  describe('Fixed Discounts', () => {
    describe('Percentage Discounts', () => {
      it('should apply percentage discount correctly', async () => {
        const variant = await createTestProductVariant({
          price: 10000,
        });

        await ProductVariant.findByIdAndUpdate(variant._id, {
          fixedDiscount: {
            enabled: true,
            type: 'percentage',
            value: 20,
            badge: '20% OFF',
          },
        });

        const result = await calculatePriceByQuantity(variant._id, 1);

        expect(result.originalPrice).toBe(10000);
        expect(result.finalPricePerUnit).toBe(8000);
        expect(result.totalDiscount).toBe(2000);
      });

      it('should apply 50% discount correctly', async () => {
        const variant = await createTestProductVariant({
          price: 10000,
        });

        await ProductVariant.findByIdAndUpdate(variant._id, {
          fixedDiscount: {
            enabled: true,
            type: 'percentage',
            value: 50,
          },
        });

        const result = await calculatePriceByQuantity(variant._id, 2);

        expect(result.finalPricePerUnit).toBe(5000);
        expect(result.totalDiscount).toBe(10000);
      });

      it('should handle 100% discount', async () => {
        const variant = await createTestProductVariant({
          price: 10000,
        });

        await ProductVariant.findByIdAndUpdate(variant._id, {
          fixedDiscount: {
            enabled: true,
            type: 'percentage',
            value: 100,
          },
        });

        const result = await calculatePriceByQuantity(variant._id, 1);

        expect(result.finalPricePerUnit).toBe(0);
      });

      it('should not apply disabled discount', async () => {
        const variant = await createTestProductVariant({
          price: 10000,
        });

        await ProductVariant.findByIdAndUpdate(variant._id, {
          fixedDiscount: {
            enabled: false,
            type: 'percentage',
            value: 20,
          },
        });

        const result = await calculatePriceByQuantity(variant._id, 1);

        expect(result.originalPrice).toBe(10000);
        expect(result.finalPricePerUnit).toBe(10000);
        expect(result.totalDiscount).toBe(0);
      });
    });

    describe('Amount Discounts', () => {
      it('should apply fixed amount discount correctly', async () => {
        const variant = await createTestProductVariant({
          price: 10000,
        });

        await ProductVariant.findByIdAndUpdate(variant._id, {
          fixedDiscount: {
            enabled: true,
            type: 'amount',
            value: 2000,
            badge: '2000 OFF',
          },
        });

        const result = await calculatePriceByQuantity(variant._id, 1);

        expect(result.originalPrice).toBe(10000);
        expect(result.finalPricePerUnit).toBe(8000);
        expect(result.totalDiscount).toBe(2000);
      });

      it('should handle amount discount greater than price', async () => {
        const variant = await createTestProductVariant({
          price: 5000,
        });

        await ProductVariant.findByIdAndUpdate(variant._id, {
          fixedDiscount: {
            enabled: true,
            type: 'amount',
            value: 10000,
          },
        });

        const result = await calculatePriceByQuantity(variant._id, 1);

        expect(result.finalPricePerUnit).toBe(0);
      });

      it('should multiply discount by quantity', async () => {
        const variant = await createTestProductVariant({
          price: 10000,
        });

        await ProductVariant.findByIdAndUpdate(variant._id, {
          fixedDiscount: {
            enabled: true,
            type: 'amount',
            value: 1000,
          },
        });

        const result = await calculatePriceByQuantity(variant._id, 5);

        expect(result.totalDiscount).toBe(5000);
      });
    });

    describe('Date-based Discounts', () => {
      it('should apply discount within valid date range', async () => {
        const variant = await createTestProductVariant({
          price: 10000,
        });

        const now = new Date();
        const startDate = new Date(now.getTime() - 86400000); // Yesterday
        const endDate = new Date(now.getTime() + 86400000); // Tomorrow

        await ProductVariant.findByIdAndUpdate(variant._id, {
          fixedDiscount: {
            enabled: true,
            type: 'percentage',
            value: 15,
            startDate,
            endDate,
          },
        });

        const result = await calculatePriceByQuantity(variant._id, 1);

        expect(result.finalPricePerUnit).toBe(8500);
      });

      it('should not apply discount before start date', async () => {
        const variant = await createTestProductVariant({
          price: 10000,
        });

        const futureStart = new Date(Date.now() + 86400000 * 7); // 7 days from now

        await ProductVariant.findByIdAndUpdate(variant._id, {
          fixedDiscount: {
            enabled: true,
            type: 'percentage',
            value: 20,
            startDate: futureStart,
          },
        });

        const result = await calculatePriceByQuantity(variant._id, 1);

        expect(result.finalPricePerUnit).toBe(10000);
      });

      it('should not apply discount after end date', async () => {
        const variant = await createTestProductVariant({
          price: 10000,
        });

        const pastEnd = new Date(Date.now() - 86400000); // Yesterday

        await ProductVariant.findByIdAndUpdate(variant._id, {
          fixedDiscount: {
            enabled: true,
            type: 'percentage',
            value: 20,
            endDate: pastEnd,
          },
        });

        const result = await calculatePriceByQuantity(variant._id, 1);

        expect(result.finalPricePerUnit).toBe(10000);
      });

      it('should apply discount with only start date (no end)', async () => {
        const variant = await createTestProductVariant({
          price: 10000,
        });

        const pastStart = new Date(Date.now() - 86400000);

        await ProductVariant.findByIdAndUpdate(variant._id, {
          fixedDiscount: {
            enabled: true,
            type: 'percentage',
            value: 10,
            startDate: pastStart,
          },
        });

        const result = await calculatePriceByQuantity(variant._id, 1);

        expect(result.finalPricePerUnit).toBe(9000);
      });
    });
  });

  // ==================== Tiered Discount Tests ====================

  describe('Tiered Discounts (Variant Level)', () => {
    it('should apply tier based on quantity', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        tieredDiscount: {
          active: true,
          tiers: [
            { minQuantity: 5, maxQuantity: 9, type: 'percentage', value: 10 },
            { minQuantity: 10, maxQuantity: null, type: 'percentage', value: 20 },
          ],
          badge: 'BULK DISCOUNT',
        },
      });

      // Quantity 3 - no discount
      let result = await calculatePriceByQuantity(variant._id, 3);
      expect(result.finalPricePerUnit).toBe(10000);
      expect(result.appliedTier).toBeNull();

      // Quantity 5 - 10% discount
      result = await calculatePriceByQuantity(variant._id, 5);
      expect(result.finalPricePerUnit).toBe(9000);
      expect(result.appliedTier?.value).toBe(10);

      // Quantity 10 - 20% discount
      result = await calculatePriceByQuantity(variant._id, 10);
      expect(result.finalPricePerUnit).toBe(8000);
      expect(result.appliedTier?.value).toBe(20);
    });

    it('should apply amount-based tiered discount', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        tieredDiscount: {
          active: true,
          tiers: [
            { minQuantity: 3, maxQuantity: 5, type: 'amount', value: 500 },
            { minQuantity: 6, maxQuantity: null, type: 'amount', value: 1000 },
          ],
        },
      });

      // Quantity 4 - 500 off per unit
      let result = await calculatePriceByQuantity(variant._id, 4);
      expect(result.finalPricePerUnit).toBe(9500);
      expect(result.totalDiscount).toBe(2000);

      // Quantity 8 - 1000 off per unit
      result = await calculatePriceByQuantity(variant._id, 8);
      expect(result.finalPricePerUnit).toBe(9000);
      expect(result.totalDiscount).toBe(8000);
    });

    it('should respect maxQuantity limits', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        tieredDiscount: {
          active: true,
          tiers: [
            { minQuantity: 2, maxQuantity: 5, type: 'percentage', value: 10 },
          ],
        },
      });

      // Quantity 5 - within range
      let result = await calculatePriceByQuantity(variant._id, 5);
      expect(result.finalPricePerUnit).toBe(9000);

      // Quantity 6 - exceeds maxQuantity, no discount
      result = await calculatePriceByQuantity(variant._id, 6);
      expect(result.finalPricePerUnit).toBe(10000);
    });

    it('should apply highest applicable tier', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        tieredDiscount: {
          active: true,
          tiers: [
            { minQuantity: 1, maxQuantity: null, type: 'percentage', value: 5 },
            { minQuantity: 5, maxQuantity: null, type: 'percentage', value: 10 },
            { minQuantity: 10, maxQuantity: null, type: 'percentage', value: 15 },
            { minQuantity: 20, maxQuantity: null, type: 'percentage', value: 25 },
          ],
        },
      });

      // Quantity 15 - should apply 15% (tier for 10+)
      const result = await calculatePriceByQuantity(variant._id, 15);
      expect(result.finalPricePerUnit).toBe(8500);
      expect(result.appliedTier?.minQuantity).toBe(10);
    });

    it('should not apply inactive tiered discount', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        tieredDiscount: {
          active: false,
          tiers: [
            { minQuantity: 2, maxQuantity: null, type: 'percentage', value: 20 },
          ],
        },
      });

      const result = await calculatePriceByQuantity(variant._id, 5);
      expect(result.finalPricePerUnit).toBe(10000);
    });

    it('should respect tiered discount date range', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      const pastEnd = new Date(Date.now() - 86400000);

      await ProductVariant.findByIdAndUpdate(variant._id, {
        tieredDiscount: {
          active: true,
          tiers: [
            { minQuantity: 2, maxQuantity: null, type: 'percentage', value: 15 },
          ],
          endDate: pastEnd,
        },
      });

      const result = await calculatePriceByQuantity(variant._id, 5);
      expect(result.finalPricePerUnit).toBe(10000);
    });
  });

  // ==================== Combined Discounts Tests ====================

  describe('Combined Discounts (Fixed + Tiered)', () => {
    it('should stack fixed and tiered discounts', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        fixedDiscount: {
          enabled: true,
          type: 'percentage',
          value: 10,
        },
        tieredDiscount: {
          active: true,
          tiers: [
            { minQuantity: 3, maxQuantity: null, type: 'percentage', value: 10 },
          ],
        },
      });

      // Price after fixed: 10000 * 0.9 = 9000
      // Price after tiered: 9000 * 0.9 = 8100
      const result = await calculatePriceByQuantity(variant._id, 3);
      expect(result.finalPricePerUnit).toBe(8100);
    });

    it('should apply fixed amount then tiered percentage', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        fixedDiscount: {
          enabled: true,
          type: 'amount',
          value: 2000,
        },
        tieredDiscount: {
          active: true,
          tiers: [
            { minQuantity: 2, maxQuantity: null, type: 'percentage', value: 20 },
          ],
        },
      });

      // Price after fixed: 10000 - 2000 = 8000
      // Price after tiered: 8000 * 0.8 = 6400
      const result = await calculatePriceByQuantity(variant._id, 2);
      expect(result.finalPricePerUnit).toBe(6400);
    });

    it('should not stack if only fixed is active', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        fixedDiscount: {
          enabled: true,
          type: 'percentage',
          value: 25,
        },
        tieredDiscount: {
          active: false,
          tiers: [
            { minQuantity: 1, maxQuantity: null, type: 'percentage', value: 10 },
          ],
        },
      });

      const result = await calculatePriceByQuantity(variant._id, 5);
      expect(result.finalPricePerUnit).toBe(7500);
    });
  });

  // ==================== Parent Tiered Discounts Tests ====================

  describe('Parent Tiered Discounts (Legacy)', () => {
    it('should apply parent tiered discount when no variant discount', async () => {
      const parent = await createTestProductParent();

      await ProductParent.findByIdAndUpdate(parent._id, {
        tieredDiscounts: [
          {
            attribute: null,
            attributeValue: null,
            tiers: [
              { minQuantity: 3, maxQuantity: null, type: 'percentage', value: 15 },
            ],
            active: true,
          },
        ],
      });

      const variant = await createTestProductVariant({
        parentProduct: parent._id,
        price: 10000,
      });

      const result = await calculatePriceByQuantity(variant._id, 3);
      expect(result.finalPricePerUnit).toBe(8500);
    });

    it('should not apply parent discount if variant has fixed discount', async () => {
      const parent = await createTestProductParent();

      await ProductParent.findByIdAndUpdate(parent._id, {
        tieredDiscounts: [
          {
            attribute: null,
            attributeValue: null,
            tiers: [
              { minQuantity: 2, maxQuantity: null, type: 'percentage', value: 30 },
            ],
            active: true,
          },
        ],
      });

      const variant = await createTestProductVariant({
        parentProduct: parent._id,
        price: 10000,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        fixedDiscount: {
          enabled: true,
          type: 'percentage',
          value: 10,
        },
      });

      const result = await calculatePriceByQuantity(variant._id, 5);
      expect(result.finalPricePerUnit).toBe(9000);
    });
  });

  // ==================== Cart Discount Application ====================

  describe('Cart Discount Application', () => {
    it('should apply discounts to all cart items', async () => {
      const variant1 = await createTestProductVariant({
        price: 10000,
      });
      const variant2 = await createTestProductVariant({
        price: 5000,
      });

      await ProductVariant.findByIdAndUpdate(variant1._id, {
        fixedDiscount: {
          enabled: true,
          type: 'percentage',
          value: 10,
        },
      });

      const cartItems = [
        { variantId: variant1._id, quantity: 2 },
        { variantId: variant2._id, quantity: 3 },
      ];

      const results = await applyDiscountToCart(cartItems);

      expect(results).toHaveLength(2);
      expect(results[0].finalPricePerUnit).toBe(9000);
      expect(results[0].subtotal).toBe(18000);
      expect(results[1].finalPricePerUnit).toBe(5000);
      expect(results[1].subtotal).toBe(15000);
    });

    it('should calculate total discount for cart', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        tieredDiscount: {
          active: true,
          tiers: [
            { minQuantity: 5, maxQuantity: null, type: 'percentage', value: 20 },
          ],
        },
      });

      const cartItems = [{ variantId: variant._id, quantity: 5 }];

      const results = await applyDiscountToCart(cartItems);

      expect(results[0].originalPrice).toBe(10000);
      expect(results[0].finalPricePerUnit).toBe(8000);
      expect(results[0].totalDiscount).toBe(10000);
      expect(results[0].subtotal).toBe(40000);
    });

    it('should handle mixed discounts in cart', async () => {
      const variant1 = await createTestProductVariant({ price: 10000 });
      const variant2 = await createTestProductVariant({ price: 20000 });

      await ProductVariant.findByIdAndUpdate(variant1._id, {
        fixedDiscount: { enabled: true, type: 'amount', value: 1000 },
      });

      await ProductVariant.findByIdAndUpdate(variant2._id, {
        tieredDiscount: {
          active: true,
          tiers: [{ minQuantity: 2, maxQuantity: null, type: 'percentage', value: 15 }],
        },
      });

      const cartItems = [
        { variantId: variant1._id, quantity: 3 },
        { variantId: variant2._id, quantity: 2 },
      ];

      const results = await applyDiscountToCart(cartItems);

      // Variant 1: 10000 - 1000 = 9000 per unit
      expect(results[0].finalPricePerUnit).toBe(9000);
      expect(results[0].subtotal).toBe(27000);

      // Variant 2: 20000 * 0.85 = 17000 per unit
      expect(results[1].finalPricePerUnit).toBe(17000);
      expect(results[1].subtotal).toBe(34000);
    });
  });

  // ==================== Tier Preview Tests ====================

  describe('Tier Previews', () => {
    it('should get visible tier previews', async () => {
      const parent = await createTestProductParent({
        name: 'Test Product',
      });

      await ProductParent.findByIdAndUpdate(parent._id, {
        variantAttributes: [
          { name: 'size', values: [{ value: 'small' }, { value: 'large' }] },
        ],
        tieredDiscounts: [
          {
            attribute: 'size',
            attributeValue: 'small',
            tiers: [
              { minQuantity: 3, maxQuantity: 5, type: 'percentage', value: 10 },
              { minQuantity: 6, maxQuantity: 10, type: 'percentage', value: 15 },
              { minQuantity: 11, maxQuantity: null, type: 'percentage', value: 20 },
            ],
            active: true,
            badge: 'BULK',
          },
        ],
      });

      const variant = await ProductVariant.create({
        parentProduct: parent._id,
        price: 10000,
        stock: 100,
        attributes: { size: 'small' },
      });

      const previews = await getVisibleTierPreviews(variant._id);

      expect(previews).toHaveLength(2);
      expect(previews[0].minQuantity).toBe(3);
      expect(previews[0].pricePerUnit).toBe(9000);
      expect(previews[1].minQuantity).toBe(6);
      expect(previews[1].pricePerUnit).toBe(8500);
    });

    it('should return empty array if no applicable discounts', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      const previews = await getVisibleTierPreviews(variant._id);

      expect(previews).toHaveLength(0);
    });
  });

  // ==================== Badge Formatting Tests ====================

  describe('Discount Badge Formatting', () => {
    it('should format discount badges correctly', () => {
      const previews = [
        { minQuantity: 3, pricePerUnit: 9000, discountType: 'percentage' as const, discountValue: 10 },
        { minQuantity: 6, pricePerUnit: 8500, discountType: 'percentage' as const, discountValue: 15 },
      ];

      const badges = formatDiscountBadges(previews);

      expect(badges).toHaveLength(2);
      expect(badges[0]).toContain('3');
      expect(badges[1]).toContain('6');
    });
  });

  // ==================== Error Handling Tests ====================

  describe('Discount Error Handling', () => {
    it('should throw error for invalid variant ID', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await expect(calculatePriceByQuantity(fakeId, 1)).rejects.toThrow();
    });

    it('should throw error for zero quantity', async () => {
      const variant = await createTestProductVariant();

      await expect(calculatePriceByQuantity(variant._id, 0)).rejects.toThrow(
        'La cantidad debe ser mayor a 0'
      );
    });

    it('should throw error for negative quantity', async () => {
      const variant = await createTestProductVariant();

      await expect(calculatePriceByQuantity(variant._id, -1)).rejects.toThrow(
        'La cantidad debe ser mayor a 0'
      );
    });

    it('should handle empty cart gracefully', async () => {
      const results = await applyDiscountToCart([]);
      expect(results).toHaveLength(0);
    });
  });

  // ==================== API Endpoint Tests ====================

  describe('Discount Preview API', () => {
    it('should return discount preview via API', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        fixedDiscount: {
          enabled: true,
          type: 'percentage',
          value: 15,
          badge: 'SALE',
        },
      });

      const response = await request(app)
        .get(`/api/products/variants/${variant._id}/discount-preview`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.originalPrice).toBe(10000);
      expect(response.body.data.hasDiscount).toBe(true);
      expect(response.body.data.discountType).toBe('percentage');
      expect(response.body.data.discountValue).toBe(15);
    });

    it('should indicate no discount in preview', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      const response = await request(app)
        .get(`/api/products/variants/${variant._id}/discount-preview`)
        .expect(200);

      expect(response.body.data.hasDiscount).toBe(false);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle very large quantities', async () => {
      const variant = await createTestProductVariant({
        price: 100,
        stock: 999999,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        tieredDiscount: {
          active: true,
          tiers: [
            { minQuantity: 1000, maxQuantity: null, type: 'percentage', value: 50 },
          ],
        },
      });

      const result = await calculatePriceByQuantity(variant._id, 10000);

      expect(result.finalPricePerUnit).toBe(50);
      expect(result.totalDiscount).toBe(500000);
    });

    it('should handle very small prices', async () => {
      const variant = await createTestProductVariant({
        price: 1,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        fixedDiscount: {
          enabled: true,
          type: 'percentage',
          value: 50,
        },
      });

      const result = await calculatePriceByQuantity(variant._id, 1);

      expect(result.finalPricePerUnit).toBe(1); // Rounded from 0.5
    });

    it('should handle decimal percentages correctly', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        fixedDiscount: {
          enabled: true,
          type: 'percentage',
          value: 33.33,
        },
      });

      const result = await calculatePriceByQuantity(variant._id, 1);

      expect(result.finalPricePerUnit).toBe(6667);
    });

    it('should handle concurrent discount calculations', async () => {
      const variant = await createTestProductVariant({
        price: 10000,
      });

      await ProductVariant.findByIdAndUpdate(variant._id, {
        fixedDiscount: {
          enabled: true,
          type: 'percentage',
          value: 10,
        },
      });

      const results = await Promise.all([
        calculatePriceByQuantity(variant._id, 1),
        calculatePriceByQuantity(variant._id, 2),
        calculatePriceByQuantity(variant._id, 3),
        calculatePriceByQuantity(variant._id, 4),
        calculatePriceByQuantity(variant._id, 5),
      ]);

      results.forEach((result) => {
        expect(result.finalPricePerUnit).toBe(9000);
      });
    });
  });
});
