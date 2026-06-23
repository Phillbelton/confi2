/**
 * Normalización de texto para búsqueda/autocompletado.
 *
 * El catálogo es en español: los clientes escriben sin acentos ("limon",
 * "mani", "pina") y en cualquier capitalización. Para que el autocompletado
 * por prefijo encuentre igual, normalizamos AMBOS lados (el campo indexado y
 * la query) a una forma canónica: minúsculas, sin diacríticos, solo
 * alfanumérico, espacios colapsados.
 *
 * Nota: `ñ` se descompone (NFD) en `n` + tilde combinante y queda como `n`. Es
 * intencional y consistente en ambos lados ("niño" -> "nino", y el usuario que
 * escribe "nino" lo encuentra).
 */
export function normalizeForSearch(input: string | null | undefined): string {
  return (input ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // quita marcas diacríticas (acentos, tildes)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // no-alfanumérico -> espacio
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escapa una cadena para usarla literal dentro de un RegExp. */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
