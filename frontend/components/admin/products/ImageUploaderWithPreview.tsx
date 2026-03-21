'use client';

import { useState, useRef, DragEvent } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface ImageUploaderWithPreviewProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUploaderWithPreview({
  images,
  onChange,
  maxImages = 5,
  disabled = false,
}: ImageUploaderWithPreviewProps) {
  const [isDragging, setIsDragging] = useState(false);
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

    const newImages: ImageFile[] = [];
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
          id: `${Date.now()}-${i}`,
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

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {images.length < maxImages && (
        <Card
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div
            className="p-8 text-center"
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Arrastra imágenes aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG o WebP • Máximo 5MB • {images.length}/{maxImages} imágenes
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
        </Card>
      )}

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Imágenes ({images.length}/{maxImages})
            {images.length > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                La primera imagen será la principal
              </span>
            )}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Principal
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(image.id)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {index > 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => moveImage(index, index - 1)}
                        disabled={disabled}
                      >
                        ←
                      </Button>
                    )}
                    {index < images.length - 1 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => moveImage(index, index + 1)}
                        disabled={disabled}
                      >
                        →
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-muted">
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
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay imágenes seleccionadas</p>
        </div>
      )}
    </div>
  );
}
