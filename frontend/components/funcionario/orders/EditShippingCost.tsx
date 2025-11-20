'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit2, Check, X, Loader2 } from 'lucide-react';

interface EditShippingCostProps {
  currentCost: number;
  onSave: (newCost: number) => void;
  isSaving?: boolean;
  canEdit?: boolean;
}

export function EditShippingCost({
  currentCost,
  onSave,
  isSaving = false,
  canEdit = true,
}: EditShippingCostProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [cost, setCost] = useState(currentCost.toString());

  const handleSave = () => {
    const numCost = parseInt(cost) || 0;
    onSave(numCost);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCost(currentCost.toString());
    setIsEditing(false);
  };

  const quickAmounts = [
    { label: 'Gratis', value: 0 },
    { label: '10k', value: 10000 },
    { label: '15k', value: 15000 },
    { label: '20k', value: 20000 },
    { label: '25k', value: 25000 },
  ];

  if (!isEditing) {
    return (
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">Costo de envío:</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatCurrency(currentCost)}</span>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Editar costo de envío
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="flex flex-wrap gap-2">
        {quickAmounts.map((amount) => (
          <Badge
            key={amount.value}
            variant="outline"
            className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40"
            onClick={() => setCost(amount.value.toString())}
          >
            {amount.label}
          </Badge>
        ))}
      </div>

      {/* Manual input */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="Ingresa monto"
          className="flex-1"
          disabled={isSaving}
          min="0"
          step="1000"
        />
        <span className="text-sm text-slate-500 whitespace-nowrap">Gs</span>
      </div>

      <p className="text-xs text-slate-500">
        Nuevo total: <span className="font-semibold">{formatCurrency(parseInt(cost) || 0)}</span>
      </p>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' Gs';
}
