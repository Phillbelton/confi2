'use client';

import { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { adminApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * Página de import — formato Quelita-nativo.
 *
 * Endpoint: POST /api/products/import-quelita-excel
 *
 * Espera un Excel con encabezados nombrados:
 *   barcode, name, description, category, subcategory, subsubcategory,
 *   brand, provider, flavor, format_value, format_unit,
 *   unitPrice, saleUnit_type, saleUnit_quantity,
 *   tier1_*, tier2_*, tags, featured, active, image_url
 *
 * Body multipart:
 *   - file: el .xlsx
 *   - limit: cantidad máxima de productos (0 = todos los del archivo)
 *   - wipeTaxonomy: si 'true' borra todo antes de importar. PELIGROSO.
 */

interface ImportError {
  row: number;
  barcode?: string;
  message: string;
}

interface ImportReport {
  categoriesCreated: number;
  brandsCreated: number;
  flavorsCreated: number;
  formatsCreated: number;
  productsCreated: number;
  productsUpdated: number;
  errors: ImportError[];
  durationMs: number;
}

type Phase = 'idle' | 'uploading' | 'done' | 'error';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [limit, setLimit] = useState<string>('100');
  const [wipeTaxonomy, setWipeTaxonomy] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onPickFile = (f: File | null) => {
    if (!f) return;
    if (!/\.xlsx?$/i.test(f.name)) {
      setErrorMsg('Solo se aceptan archivos .xlsx o .xls');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setErrorMsg('El archivo excede 20MB');
      return;
    }
    setErrorMsg('');
    setFile(f);
    setPhase('idle');
    setReport(null);
  };

  const submit = async () => {
    if (!file) return;
    if (wipeTaxonomy) {
      const ok = window.confirm(
        '⚠️ MODO LIMPIO activado.\n\n' +
          'Esto va a BORRAR todos los productos, categorías, marcas, formatos, sabores, tags y colecciones existentes ANTES de importar.\n\n' +
          '¿Estás seguro de continuar?'
      );
      if (!ok) return;
    }

    setErrorMsg('');
    setPhase('uploading');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('limit', limit || '0');
    fd.append('wipeTaxonomy', wipeTaxonomy ? 'true' : 'false');

    try {
      const res = await adminApi.post<{ data: ImportReport }>(
        '/products/import-quelita-excel',
        fd,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 180000,
        }
      );
      setReport(res.data.data);
      setPhase('done');
    } catch (err: any) {
      setPhase('error');
      setErrorMsg(
        err?.response?.data?.error ||
          err?.message ||
          'Error al procesar el archivo'
      );
    }
  };

  const reset = () => {
    setFile(null);
    setPhase('idle');
    setReport(null);
    setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold">Importar catálogo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sube un Excel con el formato Quelita-nativo. Crea o actualiza
          productos, categorías (hasta 3 niveles), marcas, sabores y formatos.
        </p>
      </header>

      {phase === 'idle' && (
        <>
          <div className="border-2 border-dashed rounded-lg p-10 text-center bg-card">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="space-y-3">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-primary" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <Button variant="outline" onClick={reset} size="sm">
                  Cambiar archivo
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="text-sm">Haz click para seleccionar un archivo .xlsx</p>
                <Button onClick={() => inputRef.current?.click()}>
                  Elegir archivo
                </Button>
              </div>
            )}
          </div>

          {file && (
            <div className="space-y-4 border rounded-lg p-4 bg-card">
              <div className="space-y-2">
                <Label htmlFor="limit">Límite de productos a importar</Label>
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="100"
                  min="0"
                  className="max-w-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  El backend hace muestreo estratificado por grupo (variedad de
                  categorías). Usá <code>0</code> para importar todos los productos
                  válidos del Excel.
                </p>
              </div>

              <div className="flex items-start justify-between gap-4 pt-2 border-t">
                <div className="space-y-1">
                  <Label htmlFor="wipe" className="text-red-600 dark:text-red-400">
                    Modo limpio (peligroso)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Borra TODOS los productos, categorías, marcas, formatos,
                    sabores, tags y colecciones antes de importar. Útil solo
                    para la primera carga.
                  </p>
                </div>
                <Switch
                  id="wipe"
                  checked={wipeTaxonomy}
                  onCheckedChange={setWipeTaxonomy}
                />
              </div>

              {wipeTaxonomy && (
                <div className="flex items-start gap-2 p-3 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="text-red-900 dark:text-red-200">
                    Vas a borrar el catálogo existente. Esto no se puede deshacer.
                  </span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={reset}>
                  Cancelar
                </Button>
                <Button onClick={submit}>
                  {wipeTaxonomy ? 'Borrar todo e importar' : 'Importar'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {phase === 'uploading' && (
        <div className="border rounded-lg p-10 text-center bg-card">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-3 text-sm">Importando…</p>
          <p className="text-xs text-muted-foreground mt-1">
            Esto puede tardar 30-60 segundos dependiendo del tamaño del Excel.
          </p>
        </div>
      )}

      {phase === 'error' && (
        <div className="border border-destructive/50 bg-destructive/10 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-destructive">Error al procesar</p>
            <p className="text-sm mt-1">{errorMsg}</p>
            <Button variant="outline" className="mt-3" onClick={reset}>
              Reintentar
            </Button>
          </div>
        </div>
      )}

      {phase === 'done' && report && (
        <div className="border border-green-500/50 bg-green-50 dark:bg-green-950/30 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <h2 className="text-xl font-semibold">Importación completada</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Productos creados', value: report.productsCreated },
              { label: 'Productos actualizados', value: report.productsUpdated },
              { label: 'Categorías', value: report.categoriesCreated },
              { label: 'Marcas', value: report.brandsCreated },
              { label: 'Sabores', value: report.flavorsCreated },
              { label: 'Formatos', value: report.formatsCreated },
              { label: 'Errores', value: report.errors.length },
            ].map((c) => (
              <div key={c.label} className="border rounded-lg p-3 bg-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {c.label}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {c.value.toLocaleString('es-CL')}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Tiempo de procesamiento: {(report.durationMs / 1000).toFixed(1)}s
          </p>

          {report.errors.length > 0 && (
            <details className="border rounded-lg bg-card">
              <summary className="px-4 py-2 cursor-pointer text-sm font-medium">
                Ver {report.errors.length} errores
              </summary>
              <div className="border-t max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="text-left">
                      <th className="px-3 py-2">Fila</th>
                      <th className="px-3 py-2">Barcode</th>
                      <th className="px-3 py-2">Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.errors.map((e, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-1 text-muted-foreground">{e.row}</td>
                        <td className="px-3 py-1 font-mono">{e.barcode ?? '—'}</td>
                        <td className="px-3 py-1">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={reset}>
              Importar otro
            </Button>
            <Button onClick={() => (window.location.href = '/admin/productos')}>
              Ir a productos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
