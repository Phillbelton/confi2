import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { auditLog, logAudit } from '../../middleware/auditMiddleware';
import AuditLog from '../../models/AuditLog';
import type { AuthRequest } from '../../types';

/**
 * Tests del middleware `auditLog`.
 *
 * El middleware:
 *   1. Reemplaza res.send y res.json para interceptar la respuesta.
 *   2. Solo registra si statusCode 2xx Y body.success === true.
 *   3. Toma `entityId` de req.params.id (update/delete) o del data del
 *      response (create).
 *   4. Para update/delete usa req.beforeState como `changes.before`.
 *   5. Para create/update usa data del response como `changes.after`.
 *   6. Llama a AuditLog.log() vía `setImmediate` (fire-and-forget — no
 *      bloquea la respuesta al cliente).
 *
 * Por (6), todos los tests deben esperar un tick del event loop antes
 * de consultar la DB.
 */

/**
 * El middleware encola el insert con setImmediate. Bajo carga (suite
 * completa), un solo tick + 20ms no alcanza porque mongo-memory-server
 * compite con otros queries. Hacemos polling activo hasta ver el log
 * (o timeout 500ms), en vez de adivinar un sleep arbitrario.
 *
 * `expectAtLeastOne` controla si el caller espera que SE registre o
 * NO se registre el log. Para tests "no debe registrar" devolvemos
 * inmediatamente tras un tick + 30ms (margen para que cualquier insert
 * indeseado quede visible si llegara a suceder).
 */
const flushAudit = async (expectAtLeastOne = true): Promise<void> => {
  await new Promise<void>((resolve) => setImmediate(resolve));
  if (!expectAtLeastOne) {
    await new Promise<void>((resolve) => setTimeout(resolve, 30));
    return;
  }
  const deadline = Date.now() + 500;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AuditLog = require('../../models/AuditLog').default;
  while (Date.now() < deadline) {
    const count = await AuditLog.countDocuments();
    if (count > 0) return;
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
  }
};

const makeReq = (overrides: Partial<{
  userId: string;
  paramsId: string;
  beforeState: any;
  headers: Record<string, string>;
}> = {}): AuthRequest => {
  const userId = overrides.userId ?? new mongoose.Types.ObjectId().toString();
  return {
    user: { id: userId, email: 'x@test.com', role: 'admin' },
    params: overrides.paramsId ? { id: overrides.paramsId } : {},
    headers: overrides.headers ?? { 'user-agent': 'jest-test' },
    beforeState: overrides.beforeState,
    ip: '127.0.0.1',
  } as any as AuthRequest;
};

const makeRes = (statusCode = 200): Response => {
  return {
    statusCode,
    // Aceptan cualquier data; el middleware los reemplaza por interceptores
    send: function (data: any) {
      return this;
    },
    json: function (data: any) {
      return this;
    },
  } as any;
};

describe('auditLog middleware', () => {
  it('registra un log de CREATE tomando entityId del response data._id', async () => {
    const req = makeReq();
    const res = makeRes(201);
    const next: NextFunction = jest.fn();
    const entityId = new mongoose.Types.ObjectId();

    auditLog('category', 'create')(req, res, next);
    expect(next).toHaveBeenCalledWith();

    // Simular el envío de la respuesta — el middleware ya reemplazó .json
    res.json({
      success: true,
      data: { category: { _id: entityId, name: 'Cat A' } },
    } as any);

    await flushAudit();

    const log = await AuditLog.findOne({ entity: 'category', action: 'create' });
    expect(log).not.toBeNull();
    expect(log?.entityId.toString()).toBe(entityId.toString());
    expect(log?.user.toString()).toBe(req.user!.id);
    expect(log?.ipAddress).toBe('127.0.0.1');
    expect(log?.userAgent).toBe('jest-test');
    expect(log?.changes.after).toMatchObject({ name: 'Cat A' });
  });

  it('registra log de UPDATE con before (de req.beforeState) y after (de response)', async () => {
    const entityId = new mongoose.Types.ObjectId();
    const req = makeReq({
      paramsId: entityId.toString(),
      beforeState: { name: 'Cat Old' },
    });
    const res = makeRes(200);
    const next: NextFunction = jest.fn();

    auditLog('category', 'update')(req, res, next);

    res.json({
      success: true,
      data: { category: { _id: entityId, name: 'Cat New' } },
    } as any);

    await flushAudit();

    const log = await AuditLog.findOne({ entity: 'category', action: 'update' });
    expect(log).not.toBeNull();
    expect(log?.entityId.toString()).toBe(entityId.toString());
    expect(log?.changes.before).toMatchObject({ name: 'Cat Old' });
    expect(log?.changes.after).toMatchObject({ name: 'Cat New' });
  });

  it('registra log de DELETE preservando before pero sin after', async () => {
    const entityId = new mongoose.Types.ObjectId();
    const req = makeReq({
      paramsId: entityId.toString(),
      beforeState: { name: 'Cat to delete' },
    });
    const res = makeRes(200);
    const next: NextFunction = jest.fn();

    auditLog('category', 'delete')(req, res, next);
    res.json({ success: true, data: null } as any);

    await flushAudit();

    const log = await AuditLog.findOne({ entity: 'category', action: 'delete' });
    expect(log).not.toBeNull();
    expect(log?.changes.before).toMatchObject({ name: 'Cat to delete' });
    // delete no debería tener `after` poblado
    expect(log?.changes.after).toEqual({});
  });

  it('NO registra log si statusCode no es 2xx', async () => {
    const req = makeReq();
    const res = makeRes(400);
    const next: NextFunction = jest.fn();

    auditLog('category', 'create')(req, res, next);
    res.json({ success: false, error: 'Algo falló' } as any);

    await flushAudit(false);
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  it('NO registra log si body.success === false (aunque statusCode sea 200)', async () => {
    const req = makeReq();
    const res = makeRes(200);
    const next: NextFunction = jest.fn();

    auditLog('category', 'create')(req, res, next);
    res.json({ success: false, error: 'Operación no exitosa' } as any);

    await flushAudit(false);
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  it('NO registra log si no hay req.user (no autenticado, defensa extra)', async () => {
    const req = makeReq();
    delete (req as any).user;
    const res = makeRes(201);
    const next: NextFunction = jest.fn();

    auditLog('category', 'create')(req, res, next);
    res.json({
      success: true,
      data: { category: { _id: new mongoose.Types.ObjectId() } },
    } as any);

    await flushAudit(false);
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  it('NO registra log si NO se puede determinar entityId', async () => {
    const req = makeReq(); // sin paramsId
    const res = makeRes(201);
    const next: NextFunction = jest.fn();

    auditLog('category', 'create')(req, res, next);
    res.json({
      success: true,
      data: { algo: 'pero sin _id ni id ni el field esperado' },
    } as any);

    await flushAudit(false);
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  it('extrae IP de x-forwarded-for cuando viene del proxy', async () => {
    const req = makeReq({
      headers: {
        'x-forwarded-for': '203.0.113.10, 10.0.0.1',
        'user-agent': 'jest-test',
      },
    });
    const res = makeRes(201);
    const next: NextFunction = jest.fn();

    auditLog('category', 'create')(req, res, next);
    res.json({
      success: true,
      data: { category: { _id: new mongoose.Types.ObjectId(), name: 'X' } },
    } as any);

    await flushAudit();

    const log = await AuditLog.findOne();
    // Toma el primer IP del x-forwarded-for (el del cliente real)
    expect(log?.ipAddress).toBe('203.0.113.10');
  });

  it('soporta data como string JSON (res.send con stringify)', async () => {
    const entityId = new mongoose.Types.ObjectId();
    const req = makeReq();
    const res = makeRes(201);
    const next: NextFunction = jest.fn();

    auditLog('category', 'create')(req, res, next);
    res.send(JSON.stringify({
      success: true,
      data: { category: { _id: entityId, name: 'Stringified' } },
    }) as any);

    await flushAudit();

    const log = await AuditLog.findOne();
    expect(log?.entityId.toString()).toBe(entityId.toString());
  });
});

describe('logAudit helper (registro manual)', () => {
  it('registra un audit log con before/after sin pasar por res.send', async () => {
    const userId = new mongoose.Types.ObjectId();
    const entityId = new mongoose.Types.ObjectId();
    const req = {
      headers: { 'user-agent': 'manual-test' },
      ip: '10.0.0.42',
    } as any as AuthRequest;

    await logAudit(
      userId,
      'cancel',
      'order',
      entityId,
      { before: { status: 'pending_whatsapp' }, after: { status: 'cancelled' } },
      req
    );

    const log = await AuditLog.findOne({ entity: 'order', action: 'cancel' });
    expect(log).not.toBeNull();
    expect(log?.user.toString()).toBe(userId.toString());
    expect(log?.entityId.toString()).toBe(entityId.toString());
    expect(log?.changes.before).toMatchObject({ status: 'pending_whatsapp' });
    expect(log?.changes.after).toMatchObject({ status: 'cancelled' });
    expect(log?.ipAddress).toBe('10.0.0.42');
    expect(log?.userAgent).toBe('manual-test');
  });

  it('no propaga errores: si AuditLog.log() falla, no rompe el flujo', async () => {
    const spy = jest
      .spyOn(AuditLog, 'log')
      .mockRejectedValueOnce(new Error('DB unavailable'));

    const req = { headers: {}, ip: '1.1.1.1' } as any as AuthRequest;

    // No debería tirar (el catch interno traga el error)
    await expect(
      logAudit(
        new mongoose.Types.ObjectId(),
        'update',
        'product',
        new mongoose.Types.ObjectId(),
        {},
        req
      )
    ).resolves.toBeUndefined();

    spy.mockRestore();
  });
});
