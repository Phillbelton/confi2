'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function HelpPanel({ isOpen, onClose, title, children }: HelpPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-background border-l shadow-lg z-50 transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="p-4 space-y-4">
            {children}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}

interface HelpSectionProps {
  title?: string;
  children: React.ReactNode;
}

export function HelpSection({ title, children }: HelpSectionProps) {
  return (
    <div className="space-y-2">
      {title && <h3 className="font-medium text-sm">{title}</h3>}
      <div className="text-sm text-muted-foreground space-y-2">
        {children}
      </div>
    </div>
  );
}

interface HelpExampleProps {
  title?: string;
  children: React.ReactNode;
}

export function HelpExample({ title, children }: HelpExampleProps) {
  return (
    <div className="bg-muted/50 border rounded-lg p-3 space-y-1">
      {title && <p className="text-xs font-medium text-muted-foreground">{title}</p>}
      <div className="text-sm">{children}</div>
    </div>
  );
}
