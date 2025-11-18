'use client';

import { useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

interface VariantImageManagerProps {
  images: string[];
  onUpload: (files: File[]) => void;
  onDelete: (filename: string) => void;
  isUploading?: boolean;
  isDeleting?: boolean;
  maxImages?: number;
}

export function VariantImageManager({
  images,
  onUpload,
  onDelete,
  isUploading = false,
  isDeleting = false,
  maxImages = 5,
}: VariantImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file count
    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      alert(`Solo puedes agregar ${remainingSlots} imagen(es) más`);
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        errors.push(`${file.name}: Solo se permiten imágenes JPG, PNG o WebP`);
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        errors.push(`${file.name}: La imagen no debe exceder 5MB`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      onUpload(validFiles);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFilenameFromUrl = (url: string): string => {
    try {
      // Extract filename from Cloudinary URL or path
      const parts = url.split('/');
      return parts[parts.length - 1];
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {images.length < maxImages && (
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir Imágenes ({images.length}/{maxImages})
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading || isDeleting}
          />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            JPG, PNG o WebP • Máximo 5MB por imagen
          </p>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Imágenes ({images.length}/{maxImages})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((imageUrl, index) => (
              <Card key={imageUrl} className="relative group overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={imageUrl}
                    alt={`Imagen ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Principal
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(getFilenameFromUrl(imageUrl))}
                      disabled={isUploading || isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay imágenes</p>
          <p className="text-xs">Sube hasta {maxImages} imágenes para esta variante</p>
        </div>
      )}

      {/* Loading State */}
      {(isUploading || isDeleting) && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            {isUploading ? 'Subiendo imágenes...' : 'Eliminando imagen...'}
          </p>
        </div>
      )}
    </div>
  );
}
