import { Response, RequestHandler } from 'express';
import multer from 'multer';
import { AuthRequest, ApiResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import {
  runQuelitaProductImport,
  QuelitaImportReport,
  QuelitaImportMode,
} from '../services/quelitaProductImportService';
import logger from '../config/logger';

/**
 * Multer en memoria para .xlsx — devuelve Buffer en req.file.buffer.
 * Separado del uploader de imágenes (que solo acepta jpg/png/webp).
 */
const xlsxUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (_req, file, cb) => {
    const okMime = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
    ].includes(file.mimetype);
    const okExt = /\.xlsx?$/i.test(file.originalname);
    if (okMime || okExt) cb(null, true);
    else cb(new Error('Solo se aceptan archivos .xlsx o .xls'));
  },
}).single('file');

/**
 * Middleware Express para parsear el upload del .xlsx con manejo de errores.
 * Se exporta para mountar en la ruta antes del controller.
 */
export const uploadExcelMiddleware: RequestHandler = (req, res, next) => {
  xlsxUpload(req, res, (err: any) => {
    if (err) {
      logger.warn('[import] Error al parsear .xlsx', { error: err.message });
      res.status(400).json({
        success: false,
        error: err.message || 'Error procesando el archivo',
      });
      return;
    }
    next();
  });
};

/**
 * POST /api/products/import-quelita-excel
 * Body multipart: { file: .xlsx, mode?: 'replace'|'upsert'|'insertNew', limit?: '0' }
 * (`wipeTaxonomy: 'true'` se sigue aceptando como alias de mode='replace'.)
 *
 * Formato Quelita-nativo (NO Bicom). Lee columnas por NOMBRE:
 *   sku, barcode, name, description, category, subcategory, subsubcategory,
 *   brand, flavor, format_value, format_unit,
 *   unitPrice, saleUnit_type, saleUnit_quantity,
 *   tier1_minQty, tier1_price, tier1_label,
 *   tier2_minQty, tier2_price, tier2_label,
 *   tags, featured, active, image_url.
 *
 * Auto-crea: Category (hasta 3 niveles anidados), Brand, Flavor, Format.
 * Solo admin.
 */
export const importProductsFromQuelitaExcel = asyncHandler(
  async (
    req: AuthRequest,
    res: Response<ApiResponse<QuelitaImportReport>>
  ) => {
    const file = req.file;
    if (!file) {
      throw new AppError(400, 'Archivo .xlsx requerido en el campo "file"');
    }

    const VALID_MODES: QuelitaImportMode[] = ['replace', 'upsert', 'insertNew'];
    const modeRaw = String(req.body.mode || '');
    const mode: QuelitaImportMode = (VALID_MODES as string[]).includes(modeRaw)
      ? (modeRaw as QuelitaImportMode)
      : String(req.body.wipeTaxonomy) === 'true'
      ? 'replace'
      : 'insertNew';
    const limitRaw = req.body.limit ? parseInt(String(req.body.limit), 10) : 0;
    const limit = Number.isFinite(limitRaw) && limitRaw >= 0 ? limitRaw : 0;

    logger.info('[import-quelita] Procesando upload', {
      file: file.originalname,
      size: file.size,
      mode,
      limit,
      userId: req.user?.id,
    });

    const report = await runQuelitaProductImport(file.buffer, {
      mode,
      limit,
      userId: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: 'Importación Quelita completada',
      data: report,
    });
  }
);
