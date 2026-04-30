/**
 * errorHandler.ts — manejador global de excepciones para express
 *
 * este middleware captura cualquier error no controlado en las rutas
 * y asegura que el servidor responda siempre con un formato json consistente,
 * evitando que se filtre información sensible del stack trace en producción.
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  // registrar el error en los logs para depuración
  logger.error({ err }, "error no controlado detectado");

  // determinar el código de estado (por defecto 500 para errores internos)
  const status = err.status || 500;

  // responder al cliente con un mensaje de error legible
  res.status(status).json({ 
    error: err.message || "error interno del servidor" 
  });
};

