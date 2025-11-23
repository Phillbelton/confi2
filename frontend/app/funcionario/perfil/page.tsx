'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

export default function PerfilPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Configuración de tu cuenta
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil del Funcionario</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <User className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
            <p className="text-slate-500">
              Esta sección está en desarrollo y estará disponible pronto.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
