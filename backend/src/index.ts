/**
 * index.ts — punto de entrada del servidor backend
 *
 * este archivo es responsable de cargar la configuración del entorno,
 * inicializar la aplicación de express y poner el servidor en escucha.
 */

import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 4000;

// inicio del servidor en el puerto configurado
app.listen(PORT, () => {
  logger.info(`servidor iniciado en http://localhost:${PORT}`);
  logger.info(`api disponible en http://localhost:${PORT}/api`);
  logger.info(`modo: ${process.env.NODE_ENV || "development"}`);
});

