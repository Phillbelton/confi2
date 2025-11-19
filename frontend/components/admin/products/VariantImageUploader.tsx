'use client';

import { useRef, DragEvent } from 'react';
import { X, Upload, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

export interface VariantImageFile {
  file: File;
  preview: string;
  id: string;
}

interface VariantImageUploaderProps {
  images: VariantImageFile[];
  onChange: (images: VariantImageFile[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function VariantImageUploader({
  images,
  onChange,
  maxImages = 5,
  disabled = false,
}: VariantImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Validar tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Solo se permiten imágenes JPG, PNG o WebP';
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'La imagen no debe exceder 5MB';
    }

    return null;
  };

  const addFiles = (files: FileList | null) => {
    if (!files || disabled) return;

    const newImages: VariantImageFile[] = [];
    const errors: string[] = [];

    // Validar cantidad
    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      errors.push(`Solo puedes agregar ${remainingSlots} imagen(es) más`);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);

      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
          id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        });
      }
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }
  };

  const removeImage = (id: string) => {
    const image = images.find((img) => img.id === id);
    if (image) {
      URL.revokeObjectURL(image.preview);
    }
    onChange(images.filter((img) => img.id !== id));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onChange(newImages);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
            disabled={disabled}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Seleccionar Imágenes ({images.length}/{maxImages})
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            JPG, PNG o WebP • Máximo 5MB por imagen
          </p>
        </div>
      )}

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Imágenes seleccionadas ({images.length}/{maxImages})
            {images.length > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                La primera será la principal
              </span>
            )}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {images.map((image, index) => (
              <Card key={image.id} className="relative group overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={image.preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                      Principal
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    <div className="flex gap-1">
                      {index > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => moveImage(index, index - 1)}
                          disabled={disabled}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                      )}
                      {index < images.length - 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => moveImage(index, index + 1)}
                          disabled={disabled}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(image.id)}
                      disabled={disabled}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-1.5 bg-muted">
                  <p className="text-xs truncate">{image.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(image.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay imágenes seleccionadas</p>
          <p className="text-xs">Las imágenes son opcionales</p>
        </div>
      )}
    </div>
  );
}
