/**
 * logger.ts — configuración de registros (logs) del sistema
 *
 * utiliza la librería pino para generar logs de alto rendimiento.
 * en modo desarrollo se utiliza pino-pretty para que los mensajes sean
 * legibles y coloreados en la terminal.
 */

import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
  // define el nivel de detalle según el entorno
  level: isDevelopment ? "debug" : "info",
  
  // configuración visual para el entorno de desarrollo
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
          messageFormat: "{msg}",
          singleLine: false,
        },
      }
    : undefined,
});

