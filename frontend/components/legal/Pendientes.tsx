import { AlertTriangle } from 'lucide-react';
import { legalData, legalPendientes, type LegalKey } from '@/lib/legal';

/**
 * Muestra un dato legal del negocio, o un placeholder imposible de pasar por
 * alto si todavía está pendiente. Buscar "PENDIENTE" en el sitio alcanza para
 * saber si quedó algo sin completar.
 */
export function Dato({ k }: { k: LegalKey }) {
  const field = legalData[k];
  const value = field.value.trim();

  if (value) {
    return field.multiline ? (
      <span className="whitespace-pre-line">{value}</span>
    ) : (
      <span>{value}</span>
    );
  }

  return (
    <mark className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[0.85em] font-semibold text-amber-900 dark:bg-amber-500/20 dark:text-amber-100">
      [PENDIENTE: {field.label.toLowerCase()}]
    </mark>
  );
}

/**
 * Aviso al inicio de las páginas legales con la lista de datos que faltan.
 * Desaparece solo cuando se completan todos en `lib/legal.ts`.
 *
 * Se muestra también en producción a propósito: si la página está publicada con
 * huecos, es mejor que se vea el aviso que dejar un `[PENDIENTE: rut]` suelto
 * sin explicación en medio de un texto legal.
 */
export function AvisoPendientes() {
  const pendientes = legalPendientes();
  if (pendientes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-500/10">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <h2 className="font-semibold text-amber-900 dark:text-amber-100">
          Falta completar {pendientes.length}{' '}
          {pendientes.length === 1 ? 'dato' : 'datos'} antes de publicar
        </h2>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-amber-900/90 dark:text-amber-100/80">
        {pendientes.map((f) => (
          <li key={f.key}>
            <span className="font-semibold">{f.label}:</span> {f.hint}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-amber-900/70 dark:text-amber-100/60">
        Se completan en <code className="font-mono">frontend/lib/legal.ts</code>.
        Este aviso desaparece solo cuando no quede ninguno.
      </p>
    </div>
  );
}
