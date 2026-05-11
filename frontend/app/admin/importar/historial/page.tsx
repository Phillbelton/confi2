'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { adminApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';

interface SessionRow {
  _id: string;
  filename: string;
  uploadedAt: string;
  appliedAt?: string;
  status: 'preview' | 'applied' | 'failed' | 'cancelled';
  uploadedBy?: { name?: string; email?: string };
  stats: {
    totalRowsParsed: number;
    created: number;
    updated: number;
    deactivated: number;
    skipped: number;
    errors: number;
  };
}

const statusLabel: Record<SessionRow['status'], string> = {
  preview: 'Preview',
  applied: 'Aplicada',
  failed: 'Con errores',
  cancelled: 'Cancelada',
};

const statusColor: Record<SessionRow['status'], string> = {
  preview: 'text-muted-foreground',
  applied: 'text-green-600',
  failed: 'text-red-600',
  cancelled: 'text-amber-600',
};

export default function ImportHistoryPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.get('/admin/import/pricelist/sessions');
        if (!cancelled) setSessions(res.data?.data?.sessions ?? []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Error al cargar el historial');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-center gap-3">
        <Link href="/admin/importar" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Historial de importaciones</h1>
      </header>

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && sessions.length === 0 && (
        <p className="text-sm text-muted-foreground">Aún no hay importaciones registradas.</p>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="border rounded-lg bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Archivo</th>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">Por</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Resumen</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{s.filename}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(s.appliedAt ?? s.uploadedAt).toLocaleString('es-CL')}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.uploadedBy?.name ?? s.uploadedBy?.email ?? '—'}
                  </td>
                  <td className={`px-4 py-3 font-medium ${statusColor[s.status]}`}>
                    {statusLabel[s.status]}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    +{s.stats.created} / ✎{s.stats.updated} / ✕{s.stats.deactivated} / ⊘{s.stats.skipped}
                    {s.stats.errors > 0 && <span className="text-red-600 ml-2">⚠ {s.stats.errors}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
