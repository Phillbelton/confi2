import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para parsear campos JSON de FormData
 *
 * Cuando se envían datos con FormData (multipart/form-data),
 * todos los valores se convierten a strings. Este middleware
 * parsea los campos que deberían ser JSON o boolean.
 */
export const parseProductFormData = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parsear categories (JSON array)
    if (req.body.categories && typeof req.body.categories === 'string') {
      try {
        req.body.categories = JSON.parse(req.body.categories);
      } catch (e) {
        // Si no es JSON válido, dejarlo como está para que la validación lo rechace
      }
    }

    // Parsear tags (JSON array)
    if (req.body.tags && typeof req.body.tags === 'string') {
      try {
        req.body.tags = JSON.parse(req.body.tags);
      } catch (e) {
        // Ignorar si no es JSON válido
      }
    }

    // Parsear variantAttributes (JSON array)
    if (req.body.variantAttributes && typeof req.body.variantAttributes === 'string') {
      try {
        req.body.variantAttributes = JSON.parse(req.body.variantAttributes);
      } catch (e) {
        // Ignorar si no es JSON válido
      }
    }

    // Parsear defaultVariant (JSON object)
    if (req.body.defaultVariant && typeof req.body.defaultVariant === 'string') {
      try {
        req.body.defaultVariant = JSON.parse(req.body.defaultVariant);
      } catch (e) {
        // Ignorar si no es JSON válido
      }
    }

    // Convertir featured a boolean
    if (req.body.featured !== undefined) {
      if (typeof req.body.featured === 'string') {
        req.body.featured = req.body.featured === 'true';
      }
    }

    // Convertir active a boolean
    if (req.body.active !== undefined) {
      if (typeof req.body.active === 'string') {
        req.body.active = req.body.active === 'true';
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
