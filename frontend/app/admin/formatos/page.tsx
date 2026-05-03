'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useFormats, useFormatOps } from '@/hooks/admin/useFormatsFlavors';
import type { Format } from '@/types';

const UNITS: Format['unit'][] = ['g', 'kg', 'ml', 'l', 'cc', 'oz'];

export default function FormatosPage() {
  const { data: formats, isLoading } = useFormats();
  const { create, update, remove } = useFormatOps();

  const [editing, setEditing] = useState<Format | null>(null);
  const [value, setValue] = useState<number>(0);
  const [unit, setUnit] = useState<Format['unit']>('g');
  const [active, setActive] = useState(true);

  const reset = () => { setEditing(null); setValue(0); setUnit('g'); setActive(true); };

  const submit = () => {
    if (!value || value <= 0) return;
    if (editing) {
      update.mutate(
        { id: editing._id, data: { value, unit, active } },
        { onSuccess: reset }
      );
    } else {
      create.mutate({ value, unit, active }, { onSuccess: reset });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Formatos</h1>
        <p className="text-muted-foreground">Gestiona presentaciones físicas: gramos, ml, litros…</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Editar formato' : 'Nuevo formato'}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label>Valor</Label>
            <Input
              type="number"
              min={0}
              value={value || ''}
              onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
              placeholder="35"
            />
          </div>
          <div>
            <Label>Unidad</Label>
            <Select value={unit} onValueChange={(v) => setUnit(v as Format['unit'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <Label>Activo</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Guardar' : <><Plus className="mr-2 h-4 w-4" />Agregar</>}
            </Button>
            {editing && <Button variant="ghost" onClick={reset}>Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Listado</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etiqueta</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(formats || []).map((f) => (
                  <TableRow key={f._id}>
                    <TableCell className="font-medium">{f.label}</TableCell>
                    <TableCell>{f.value}</TableCell>
                    <TableCell>{f.unit}</TableCell>
                    <TableCell className="text-center">{f.productCount ?? 0}</TableCell>
                    <TableCell>{f.active ? 'Sí' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => {
                        setEditing(f); setValue(f.value); setUnit(f.unit); setActive(f.active);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => confirm(`¿Eliminar ${f.label}?`) && remove.mutate(f._id)}
                        className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(formats || []).length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay formatos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
