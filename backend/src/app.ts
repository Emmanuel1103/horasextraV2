/**
 * app.ts — configuración de la aplicación express
 *
 * este archivo define la estructura de la aplicación de node.js, incluyendo:
 *  - middlewares de seguridad y cors.
 *  - limitación de peticiones (rate limiting).
 *  - definición de rutas principales de la api.
 *  - manejadores globales de errores y logging.
 */

import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import apiRouter from "./routes/api";
import { errorHandler } from "./utils/errorHandler";
import { logger } from "./utils/logger";

const app = express();

// configuración de middlewares globales
app.use(helmet()); // seguridad de cabeceras http
app.use(cors()); // permitir peticiones desde otros dominios (frontend)
app.use(express.json({ limit: "2mb" })); // procesamiento de json en el cuerpo de la petición
app.use(express.urlencoded({ extended: false }));

// middleware de logging personalizado para rastrear cada petición
app.use((req, _res, next) => { 
  logger.info(`→ ${req.method} ${req.url}`); 
  next(); 
});

// limitación de tasa para prevenir abusos del api
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: Number(process.env.RATE_LIMIT_MAX || 100),
});
app.use(limiter);

// montaje de las rutas principales bajo el prefijo /api
app.use("/api", apiRouter);

// manejador global de errores (debe ser el último middleware)
app.use(errorHandler);

export default app;

