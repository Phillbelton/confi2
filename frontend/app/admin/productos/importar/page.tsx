'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ImportReport {
  categoriesCreated: number;
  brandsCreated: number;
  productsCreated: number;
  productsUpdated: number;
  variantsCreated: number;
  errors: Array<{ row: number; barcode?: string; message: string }>;
  durationMs: number;
}

export default function ImportarProductosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [wipeTaxonomy, setWipeTaxonomy] = useState(false);
  const [limit, setLimit] = useState<number>(500);
  const [isUploading, setIsUploading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
    onDrop: (accepted) => {
      if (accepted[0]) setFile(accepted[0]);
    },
  });

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setReport(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('wipeTaxonomy', String(wipeTaxonomy));
      fd.append('limit', String(limit));

      const token = localStorage.getItem('admin-token');
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/import-excel`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        }
      );
      const json = await resp.json();
      if (!resp.ok || !json.success) {
        throw new Error(json.error || json.message || 'Error en la importación');
      }
      setReport(json.data);
      toast({
        title: 'Importación completada',
        description: `${json.data.productsCreated} creados · ${json.data.productsUpdated} actualizados`,
      });
    } catch (err: any) {
      console.error('Error importing:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudo importar el archivo',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Importar productos desde Excel
          </h1>
          <p className="text-muted-foreground">
            Carga masiva idempotente por código de barras
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archivo .xlsx</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-colors cursor-pointer',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40 hover:bg-muted/40'
            )}
          >
            <input {...getInputProps()} />
            {file ? (
              <>
                <FileSpreadsheet className="h-10 w-10 text-primary" />
                <p className="text-sm font-semibold">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB · click para cambiar
                </p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-semibold">
                  {isDragActive ? 'Soltá el archivo acá' : 'Arrastrá o hacé click para subir'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Solo .xlsx · máx 20MB
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm font-semibold">
                Wipe completo antes de importar
              </Label>
              <p className="text-xs text-muted-foreground">
                Borra: <strong>Productos, Marcas, Categorías, Formatos, Sabores, Tags y Colecciones</strong>.
                Activá solo en la primera carga inicial. ¡No revertible!
              </p>
            </div>
            <Switch
              checked={wipeTaxonomy}
              onCheckedChange={setWipeTaxonomy}
              disabled={isUploading}
            />
          </div>

          <div>
            <Label htmlFor="limit" className="text-sm font-semibold">
              Cantidad máxima de productos
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              <code>0</code> = todos. Recomendado <code>500</code> para testing inicial.
            </p>
            <Input
              id="limit"
              type="number"
              min={0}
              max={10000}
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10) || 0)}
              disabled={isUploading}
              className="max-w-[180px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          size="lg"
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {isUploading ? 'Procesando…' : 'Importar'}
        </Button>
      </div>

      {report && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Reporte de importación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Stat label="Categorías creadas" value={report.categoriesCreated} />
              <Stat label="Marcas creadas" value={report.brandsCreated} />
              <Stat label="Productos creados" value={report.productsCreated} />
              <Stat label="Productos actualizados" value={report.productsUpdated} />
              <Stat label="Variants creadas" value={report.variantsCreated} />
              <Stat
                label="Duración"
                value={`${(report.durationMs / 1000).toFixed(1)}s`}
              />
            </div>
            {report.errors.length > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
                <div className="flex items-center gap-2 text-amber-700 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-bold">
                    {report.errors.length} {report.errors.length === 1 ? 'fila' : 'filas'} con problemas
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-amber-900 max-h-48 overflow-y-auto">
                  {report.errors.slice(0, 30).map((e, i) => (
                    <li key={i}>
                      <span className="font-mono">row {e.row}</span>
                      {e.barcode && (
                        <span className="text-muted-foreground"> ({e.barcode})</span>
                      )}
                      : {e.message}
                    </li>
                  ))}
                  {report.errors.length > 30 && (
                    <li className="italic">…y {report.errors.length - 30} más</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
