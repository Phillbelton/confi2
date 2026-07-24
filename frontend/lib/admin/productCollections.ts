import { adminCollectionService } from '@/services/admin/collections';

/** Devuelve el `_id` tanto si la ref viene poblada como si es un string. */
const idOf = (p: string | { _id: string }): string => (typeof p === 'string' ? p : p._id);

/**
 * Sincroniza a qué colecciones pertenece un producto.
 *
 * Las colecciones guardan su lista de productos (no al revés), así que hay que
 * editar cada colección afectada. Es best-effort: devuelve `false` si alguna
 * falló, para que la vista avise sin abortar el guardado del producto.
 */
export async function assignCollections(
  productId: string,
  collectionIds: string[],
  /** Colecciones a las que pertenecía antes; se lo quita de las que ya no estén. */
  previousIds: string[] = []
): Promise<boolean> {
  let allOk = true;

  const toAdd = collectionIds.filter((id) => !previousIds.includes(id));
  const toRemove = previousIds.filter((id) => !collectionIds.includes(id));

  for (const cid of toAdd) {
    try {
      const res = await adminCollectionService.getById(cid);
      const ids = (res.data.collection.products || []).map(idOf);
      if (!ids.includes(productId)) {
        await adminCollectionService.update(cid, { products: [...ids, productId] });
      }
    } catch {
      allOk = false;
    }
  }

  for (const cid of toRemove) {
    try {
      const res = await adminCollectionService.getById(cid);
      const ids = (res.data.collection.products || []).map(idOf);
      if (ids.includes(productId)) {
        await adminCollectionService.update(cid, {
          products: ids.filter((id) => id !== productId),
        });
      }
    } catch {
      allOk = false;
    }
  }

  return allOk;
}

/** Colecciones (ids) que contienen al producto. Para precargar el form al editar. */
export async function getCollectionIdsForProduct(productId: string): Promise<string[]> {
  const res = await adminCollectionService.getAll('all');
  return res.data.collections
    .filter((c) => (c.products || []).map(idOf).includes(productId))
    .map((c) => c._id);
}
