'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useFlavors, useFlavorOps } from '@/hooks/admin/useFormatsFlavors';
import type { Flavor } from '@/types';

export default function SaboresPage() {
  const { data: flavors, isLoading } = useFlavors();
  const { create, update, remove } = useFlavorOps();

  const [editing, setEditing] = useState<Flavor | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [active, setActive] = useState(true);

  const reset = () => { setEditing(null); setName(''); setColor(''); setActive(true); };

  const submit = () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), color: color || undefined, active };
    if (editing) {
      update.mutate({ id: editing._id, data }, { onSuccess: reset });
    } else {
      create.mutate(data, { onSuccess: reset });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sabores</h1>
        <p className="text-muted-foreground">Gestiona sabores para filtrar productos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Editar sabor' : 'Nuevo sabor'}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Chocolate" />
          </div>
          <div>
            <Label>Color (hex)</Label>
            <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#8B4513" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <Label>Activo</Label>
          </div>
          <div className="flex gap-2 md:col-span-4">
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(flavors || []).map((f) => (
                  <TableRow key={f._id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>
                      {f.color ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block h-4 w-4 rounded" style={{ background: f.color }} />
                          <span className="font-mono text-xs">{f.color}</span>
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-center">{f.productCount ?? 0}</TableCell>
                    <TableCell>{f.active ? 'Sí' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => {
                        setEditing(f); setName(f.name); setColor(f.color || ''); setActive(f.active);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => confirm(`¿Eliminar ${f.name}?`) && remove.mutate(f._id)}
                        className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(flavors || []).length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay sabores
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
