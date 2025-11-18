import React from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface FormFieldWithHelpProps {
  label: string;
  tooltip?: string;
  helpContent?: React.ReactNode;
  onHelpClick?: () => void;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormFieldWithHelp({
  label,
  tooltip,
  helpContent,
  onHelpClick,
  required = false,
  htmlFor,
  className = '',
  children,
}: FormFieldWithHelpProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Label htmlFor={htmlFor} className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>

        {/* Tooltip nivel 1 */}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Botón de ayuda nivel 2 */}
        {(helpContent || onHelpClick) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
            onClick={onHelpClick}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        )}
      </div>

      {children}
    </div>
  );
}
