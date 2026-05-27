import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server';
import { User, IUser } from '../../models/User';
import { signTokenFor } from '../setup/authTestHelpers';

/**
 * Tests e2e del CRUD de direcciones del cliente.
 *  Base: /api/users/me/addresses
 *
 * Reglas de negocio cubiertas:
 *  - Toda la ruta es protegida (authenticate).
 *  - La PRIMERA dirección de un usuario queda automáticamente como default.
 *  - POST con isDefault=true en otra dirección desmarca la anterior.
 *  - DELETE rechaza eliminar la default si hay más direcciones.
 *  - PATCH /:id/default cambia el default exclusivo.
 *  - Aislamiento entre usuarios: A nunca puede operar sobre direcciones de B.
 */

const VALID_PASSWORD = 'Password1!';

const createUserAndToken = async () => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const user = await User.create({
    name: 'Cliente',
    email: `client-${suffix}@test.com`,
    password: VALID_PASSWORD,
    role: 'cliente',
    active: true,
  }) as IUser;
  const token = signTokenFor(user);
  return { user, token };
};

const addressBody = (overrides: Partial<{
  label: string;
  street: string;
  number: string;
  city: string;
  neighborhood: string;
  reference: string;
}> = {}) => ({
  label: 'Casa',
  street: 'Av. Siempre Viva',
  number: '742',
  city: 'Springfield',
  ...overrides,
});

describe('GET /api/users/me/addresses', () => {
  it('401 sin auth', async () => {
    const res = await request(app).get('/api/users/me/addresses');
    expect(res.status).toBe(401);
  });

  it('retorna array vacío si el usuario no tiene direcciones', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .get('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.addresses).toEqual([]);
  });
});

describe('POST /api/users/me/addresses', () => {
  it('crea la primera dirección y la marca como isDefault=true automáticamente', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addressBody());

    expect(res.status).toBe(201);
    expect(res.body.data.address).toMatchObject({
      label: 'Casa',
      street: 'Av. Siempre Viva',
      isDefault: true,
    });
  });

  it('una segunda dirección queda con isDefault=false (mantiene la primera como default)', async () => {
    const { token } = await createUserAndToken();
    await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addressBody({ label: 'Casa' }));

    const second = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addressBody({ label: 'Trabajo' }));

    expect(second.body.data.address.isDefault).toBe(false);

    const list = await request(app)
      .get('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.data.addresses).toHaveLength(2);
    expect(list.body.data.addresses.filter((a: any) => a.isDefault)).toHaveLength(1);
  });

  it('400 si Zod rechaza el body (label vacío)', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addressBody({ label: '' }));
    expect(res.status).toBe(400);
  });

  it('400 si Zod rechaza el body (street muy corto)', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addressBody({ street: 'A' }));
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/users/me/addresses/:id', () => {
  it('actualiza una dirección existente', async () => {
    const { token } = await createUserAndToken();
    const create = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addressBody());
    const id = create.body.data.address._id;

    const upd = await request(app)
      .put(`/api/users/me/addresses/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'Casa nueva', city: 'Otra ciudad' });

    expect(upd.status).toBe(200);
    expect(upd.body.data.address.label).toBe('Casa nueva');
    expect(upd.body.data.address.city).toBe('Otra ciudad');
    // Lo NO enviado se preserva
    expect(upd.body.data.address.street).toBe('Av. Siempre Viva');
  });

  it('404 si la dirección no existe', async () => {
    const { token } = await createUserAndToken();
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/users/me/addresses/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'Lo que sea' });
    expect(res.status).toBe(404);
  });

  it('400 si el id en la URL no es un ObjectId válido (Zod)', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .put('/api/users/me/addresses/no-es-un-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'X' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/users/me/addresses/:id', () => {
  it('permite eliminar la única dirección (aunque sea default)', async () => {
    const { token } = await createUserAndToken();
    const create = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addressBody());
    const id = create.body.data.address._id;

    const del = await request(app)
      .delete(`/api/users/me/addresses/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.data.addresses).toEqual([]);
  });

  it('rechaza con 400 eliminar la default si hay más direcciones', async () => {
    const { token } = await createUserAndToken();
    const first = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addressBody({ label: 'Casa' }));
    const defaultId = first.body.data.address._id;

    await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addressBody({ label: 'Trabajo' }));

    const del = await request(app)
      .delete(`/api/users/me/addresses/${defaultId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(400);
    expect(del.body.error || del.body.message).toMatch(/predeterminada/i);
  });

  it('404 si la dirección no existe', async () => {
    const { token } = await createUserAndToken();
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/users/me/addresses/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/users/me/addresses/:id/default', () => {
  it('cambia el default: la anterior pierde isDefault, la nueva lo gana', async () => {
    const { token } = await createUserAndToken();
    const first = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addressBody({ label: 'Casa' }));
    const second = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addressBody({ label: 'Trabajo' }));

    expect(first.body.data.address.isDefault).toBe(true);
    expect(second.body.data.address.isDefault).toBe(false);

    const patch = await request(app)
      .patch(`/api/users/me/addresses/${second.body.data.address._id}/default`)
      .set('Authorization', `Bearer ${token}`);
    expect(patch.status).toBe(200);

    const defaults = patch.body.data.addresses.filter((a: any) => a.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0]._id).toBe(second.body.data.address._id);
  });
});

describe('aislamiento entre usuarios', () => {
  it('usuario A no puede actualizar ni borrar direcciones de usuario B', async () => {
    const alice = await createUserAndToken();
    const bob = await createUserAndToken();

    const aliceAddr = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${alice.token}`)
      .send(addressBody({ label: 'Casa de Alice' }));
    const aliceAddrId = aliceAddr.body.data.address._id;

    // Bob intenta actualizar la dirección de Alice — no la encuentra dentro
    // de SUS propias direcciones, así que el service responde 404.
    const upd = await request(app)
      .put(`/api/users/me/addresses/${aliceAddrId}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ label: 'Hackeado por Bob' });
    expect(upd.status).toBe(404);

    const del = await request(app)
      .delete(`/api/users/me/addresses/${aliceAddrId}`)
      .set('Authorization', `Bearer ${bob.token}`);
    expect(del.status).toBe(404);

    // La dirección de Alice queda intacta
    const list = await request(app)
      .get('/api/users/me/addresses')
      .set('Authorization', `Bearer ${alice.token}`);
    expect(list.body.data.addresses[0].label).toBe('Casa de Alice');
  });
});
