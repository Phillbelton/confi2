import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';
import { ENV } from '../config/env';

// Asegurar que el directorio de uploads existe
const ensureUploadDirExists = () => {
  const uploadDir = ENV.UPLOAD_DIR;

  // Crear directorios si no existen
  const dirs = [
    uploadDir,
    path.join(uploadDir, 'products'),
    path.join(uploadDir, 'categories'),
    path.join(uploadDir, 'brands'),
    path.join(uploadDir, 'temp'),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Directorio creado: ${dir}`);
    }
  });
};

// Ejecutar al cargar el módulo
ensureUploadDirExists();

/**
 * Configuración de almacenamiento de Multer
 * Guarda archivos con nombres únicos basados en timestamp
 */
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Determinar subdirectorio según el tipo de archivo
    let subdir = 'temp';

    if (req.baseUrl.includes('/products')) {
      subdir = 'products';
    } else if (req.baseUrl.includes('/categories')) {
      subdir = 'categories';
    } else if (req.baseUrl.includes('/brands')) {
      subdir = 'brands';
    }

    const destination = path.join(ENV.UPLOAD_DIR, subdir);
    cb(null, destination);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generar nombre único: timestamp-random-original.ext
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 20); // Limitar longitud

    cb(null, `${uniqueSuffix}-${nameWithoutExt}${ext}`);
  },
});

/**
 * Filtro de archivos: solo imágenes
 * Valida por MIME type y extensión
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // MIME types permitidos
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  // Extensiones permitidas
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  // Validar MIME type
  if (!allowedMimeTypes.includes(mimeType)) {
    return cb(
      new Error(
        `Tipo de archivo no permitido. Solo se aceptan: ${allowedMimeTypes.join(', ')}`
      )
    );
  }

  // Validar extensión
  if (!allowedExtensions.includes(ext)) {
    return cb(
      new Error(
        `Extensión de archivo no permitida. Solo se aceptan: ${allowedExtensions.join(', ')}`
      )
    );
  }

  // Archivo válido
  cb(null, true);
};

/**
 * Configuración base de Multer
 */
const multerConfig: multer.Options = {
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 5, // Máximo 5 archivos por request
  },
};

/**
 * Middleware para subir una sola imagen
 * Uso: upload.single('image')
 */
export const uploadSingle = multer(multerConfig).single('image');

/**
 * Middleware para subir múltiples imágenes
 * Uso: upload.array('images', 5)
 */
export const uploadMultiple = multer(multerConfig).array('images', 5);

/**
 * Middleware para subir campos específicos
 * Uso: upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }])
 */
export const uploadFields = (fields: { name: string; maxCount: number }[]) => {
  return multer(multerConfig).fields(fields);
};

/**
 * Función helper para eliminar archivo
 */
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        // Si el archivo no existe, no es un error crítico
        if (err.code === 'ENOENT') {
          console.warn(`⚠️  Archivo no encontrado: ${filePath}`);
          return resolve();
        }
        return reject(err);
      }
      console.log(`🗑️  Archivo eliminado: ${filePath}`);
      resolve();
    });
  });
};

/**
 * Función helper para eliminar múltiples archivos
 */
export const deleteFiles = async (filePaths: string[]): Promise<void> => {
  const promises = filePaths.map((filePath) => deleteFile(filePath));
  await Promise.all(promises);
};

/**
 * Función helper para obtener la ruta completa del archivo
 */
export const getFilePath = (filename: string, subdir: string = 'temp'): string => {
  return path.join(ENV.UPLOAD_DIR, subdir, filename);
};

/**
 * Función helper para obtener la URL pública del archivo
 */
export const getFileUrl = (filename: string, subdir: string = 'temp'): string => {
  return `/uploads/${subdir}/${filename}`;
};

/**
 * Middleware de manejo de errores de Multer
 */
export const handleMulterError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    // Errores específicos de Multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'El archivo excede el tamaño máximo permitido (5MB)',
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Demasiados archivos. Máximo 5 archivos por request',
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Campo de archivo inesperado',
      });
    }

    return res.status(400).json({
      success: false,
      error: `Error al subir archivo: ${err.message}`,
    });
  }

  // Errores de validación (fileFilter)
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Error al procesar el archivo',
    });
  }

  next();
};
