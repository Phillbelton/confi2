'use client';

import { useCallback, useState } from 'react';

const KEY = 'quelita:recent-searches';
const MAX = 6;

/** Lee el historial de localStorage. Seguro en SSR (devuelve []). */
function readStore(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

function writeStore(next: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* sin localStorage (modo privado) → historial solo en memoria */
  }
}

/**
 * Historial de búsquedas recientes persistido en localStorage. Se muestra en el
 * dropdown del buscador cuando el campo está vacío, como atajo de re-búsqueda.
 *
 * El estado se inicializa de forma perezosa leyendo localStorage (no en un
 * effect): en SSR es [] y no afecta el render inicial, porque el dropdown solo
 * aparece tras la interacción del usuario.
 */
export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>(readStore);

  const add = useCallback((termRaw: string) => {
    const term = termRaw.trim();
    if (term.length < 2) return;
    setRecent((prev) => {
      const next = [term, ...prev.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX);
      writeStore(next);
      return next;
    });
  }, []);

  const remove = useCallback((term: string) => {
    setRecent((prev) => {
      const next = prev.filter((t) => t !== term);
      writeStore(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setRecent([]);
    writeStore([]);
  }, []);

  return { recent, add, remove, clear };
}
