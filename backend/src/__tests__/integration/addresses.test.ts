import request from 'supertest';
import app from '../../server';
import { createTestUser, generateAuthToken } from '../setup/testUtils';
import { User } from '../../models/User';

describe('Addresses API', () => {
  describe('GET /api/users/me/addresses', () => {
    it('should get user addresses', async () => {
      const user = await createTestUser();
      user.addresses.push({
        label: 'Casa',
        street: 'Test Street',
        number: '123',
        city: 'Asunción',
        neighborhood: 'Centro',
        isDefault: true,
      } as any);
      await user.save();

      const token = generateAuthToken(user);

      const response = await request(app)
        .get('/api/users/me/addresses')
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.addresses).toBeInstanceOf(Array);
      expect(response.body.data.addresses.length).toBe(1);
      expect(response.body.data.addresses[0].street).toBe('Test Street');
    });

    it('should return empty array when no addresses', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .get('/api/users/me/addresses')
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.addresses).toEqual([]);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/me/addresses');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/users/me/addresses', () => {
    it('should add new address for authenticated user', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .post('/api/users/me/addresses')
        .set('Cookie', `token=${token}`)
        .send({
          label: 'Oficina',
          street: 'Av. Mariscal López',
          number: '1234',
          city: 'Asunción',
          neighborhood: 'Villa Morra',
          reference: 'Cerca del Shopping',
          isDefault: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.address.street).toBe('Av. Mariscal López');
      expect(response.body.data.address.isDefault).toBe(true);

      // Verify address was added to user
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.addresses.length).toBe(1);
    });

    it('should set first address as default automatically', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .post('/api/users/me/addresses')
        .set('Cookie', `token=${token}`)
        .send({
          label: 'Casa',
          street: 'Test Street',
          number: '123',
          city: 'Asunción',
          neighborhood: 'Centro',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.address.isDefault).toBe(true);
    });

    it('should unset previous default when adding new default', async () => {
      const user = await createTestUser();
      user.addresses.push({
        label: 'Casa',
        street: 'Old Default',
        number: '111',
        city: 'Asunción',
        neighborhood: 'Centro',
        isDefault: true,
      } as any);
      await user.save();

      const token = generateAuthToken(user);

      const response = await request(app)
        .post('/api/users/me/addresses')
        .set('Cookie', `token=${token}`)
        .send({
          label: 'Oficina',
          street: 'New Default',
          number: '222',
          city: 'Asunción',
          neighborhood: 'Villa Morra',
          isDefault: true,
        });

      expect(response.status).toBe(201);

      // Verify only one default exists
      const updatedUser = await User.findById(user._id);
      const defaultAddresses = updatedUser?.addresses.filter(a => a.isDefault);
      expect(defaultAddresses?.length).toBe(1);
      expect(defaultAddresses?.[0].street).toBe('New Default');
    });

    it('should reject missing required fields', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .post('/api/users/me/addresses')
        .set('Cookie', `token=${token}`)
        .send({
          street: 'Test Street',
          // Missing number, city, neighborhood
        });

      expect(response.status).toBe(400);
    });

    it('should validate street length', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .post('/api/users/me/addresses')
        .set('Cookie', `token=${token}`)
        .send({
          label: 'Casa',
          street: 'AB', // Too short
          number: '123',
          city: 'Asunción',
          neighborhood: 'Centro',
        });

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/users/me/addresses')
        .send({
          label: 'Casa',
          street: 'Test Street',
          number: '123',
          city: 'Asunción',
          neighborhood: 'Centro',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/me/addresses/:addressId', () => {
    it('should update existing address', async () => {
      const user = await createTestUser();
      user.addresses.push({
        label: 'Trabajo',
        street: 'Old Street',
        number: '111',
        city: 'Asunción',
        neighborhood: 'Centro',
        isDefault: false,
      } as any);
      await user.save();

      const addressId = user.addresses[0]._id;
      const token = generateAuthToken(user);

      const response = await request(app)
        .put(`/api/users/me/addresses/${addressId}`)
        .set('Cookie', `token=${token}`)
        .send({
          street: 'Updated Street',
          number: '999',
          reference: 'New reference',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.address.street).toBe('Updated Street');
      expect(response.body.data.address.number).toBe('999');
      expect(response.body.data.address.city).toBe('Asunción'); // Unchanged
    });

    it('should return 404 for non-existent address', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/users/me/addresses/${fakeId}`)
        .set('Cookie', `token=${token}`)
        .send({
          street: 'Updated Street',
        });

      expect(response.status).toBe(404);
    });

    it('should validate updated fields', async () => {
      const user = await createTestUser();
      user.addresses.push({
        label: 'Casa',
        street: 'Test Street',
        number: '123',
        city: 'Asunción',
        neighborhood: 'Centro',
        isDefault: false,
      } as any);
      await user.save();

      const addressId = user.addresses[0]._id;
      const token = generateAuthToken(user);

      const response = await request(app)
        .put(`/api/users/me/addresses/${addressId}`)
        .set('Cookie', `token=${token}`)
        .send({
          street: 'A', // Too short
        });

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/users/me/addresses/${fakeId}`)
        .send({ street: 'Updated' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/users/me/addresses/:addressId', () => {
    it('should delete address', async () => {
      const user = await createTestUser();
      user.addresses.push({
        label: 'Oficina',
        street: 'Delete Me',
        number: '123',
        city: 'Asunción',
        neighborhood: 'Centro',
        isDefault: false,
      } as any);
      await user.save();

      const addressId = user.addresses[0]._id;
      const token = generateAuthToken(user);

      const response = await request(app)
        .delete(`/api/users/me/addresses/${addressId}`)
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('eliminada');

      // Verify address was removed
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.addresses.length).toBe(0);
    });

    it('should prevent deleting default address if other addresses exist', async () => {
      const user = await createTestUser();
      user.addresses.push(
        {
          label: 'Casa',
          street: 'Default Address',
          number: '123',
          city: 'Asunción',
          neighborhood: 'Centro',
          isDefault: true,
        } as any,
        {
          label: 'Trabajo',
          street: 'Other Address',
          number: '456',
          city: 'Asunción',
          neighborhood: 'Villa Morra',
          isDefault: false,
        } as any
      );
      await user.save();

      const defaultAddressId = user.addresses[0]._id;
      const token = generateAuthToken(user);

      const response = await request(app)
        .delete(`/api/users/me/addresses/${defaultAddressId}`)
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('predeterminada');
    });

    it('should allow deleting default address if its the only one', async () => {
      const user = await createTestUser();
      user.addresses.push({
        label: 'Casa',
        street: 'Only Address',
        number: '123',
        city: 'Asunción',
        neighborhood: 'Centro',
        isDefault: true,
      } as any);
      await user.save();

      const addressId = user.addresses[0]._id;
      const token = generateAuthToken(user);

      const response = await request(app)
        .delete(`/api/users/me/addresses/${addressId}`)
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.addresses.length).toBe(0);
    });

    it('should return 404 for non-existent address', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/users/me/addresses/${fakeId}`)
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/users/me/addresses/${fakeId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/me/addresses/:addressId/default', () => {
    it('should set address as default', async () => {
      const user = await createTestUser();
      user.addresses.push(
        {
          label: 'Casa',
          street: 'Old Default',
          number: '111',
          city: 'Asunción',
          neighborhood: 'Centro',
          isDefault: true,
        } as any,
        {
          label: 'Oficina',
          street: 'New Default',
          number: '222',
          city: 'Asunción',
          neighborhood: 'Villa Morra',
          isDefault: false,
        } as any
      );
      await user.save();

      const newDefaultId = user.addresses[1]._id;
      const token = generateAuthToken(user);

      const response = await request(app)
        .patch(`/api/users/me/addresses/${newDefaultId}/default`)
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.address.isDefault).toBe(true);

      // Verify only one default exists
      const updatedUser = await User.findById(user._id);
      const defaultAddresses = updatedUser?.addresses.filter(a => a.isDefault);
      expect(defaultAddresses?.length).toBe(1);
      expect(defaultAddresses?.[0].street).toBe('New Default');
    });

    it('should return 404 for non-existent address', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .patch(`/api/users/me/addresses/${fakeId}/default`)
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(404);
    });

    it('should be idempotent (setting already default address)', async () => {
      const user = await createTestUser();
      user.addresses.push({
        label: 'Casa',
        street: 'Already Default',
        number: '123',
        city: 'Asunción',
        neighborhood: 'Centro',
        isDefault: true,
      } as any);
      await user.save();

      const addressId = user.addresses[0]._id;
      const token = generateAuthToken(user);

      const response = await request(app)
        .patch(`/api/users/me/addresses/${addressId}/default`)
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.address.isDefault).toBe(true);
    });

    it('should require authentication', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/users/me/addresses/${fakeId}/default`);

      expect(response.status).toBe(401);
    });
  });

  describe('Address validation edge cases', () => {
    it('should accept maximum length fields', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .post('/api/users/me/addresses')
        .set('Cookie', `token=${token}`)
        .send({
          label: 'Casa',
          street: 'A'.repeat(100),
          number: '1'.repeat(20),
          city: 'C'.repeat(50),
          neighborhood: 'N'.repeat(50),
          reference: 'R'.repeat(200),
        });

      expect(response.status).toBe(201);
    });

    it('should reject exceeding maximum length', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .post('/api/users/me/addresses')
        .set('Cookie', `token=${token}`)
        .send({
          label: 'Casa',
          street: 'A'.repeat(201), // Too long (max is 200)
          number: '123',
          city: 'Asunción',
          neighborhood: 'Centro',
        });

      expect(response.status).toBe(400);
    });

    it('should handle special characters in addresses', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const response = await request(app)
        .post('/api/users/me/addresses')
        .set('Cookie', `token=${token}`)
        .send({
          label: 'Oficina',
          street: 'Av. José de San Martín',
          number: '123-A',
          city: 'Asunción',
          neighborhood: 'Ñuñoa',
          reference: 'Al lado del árbol grande',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.address.neighborhood).toBe('Ñuñoa');
    });
  });
});
