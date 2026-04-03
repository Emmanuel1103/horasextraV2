import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  logger.info(`🚀 Servidor iniciado en http://localhost:${PORT}`);
  logger.info(`📡 API disponible en http://localhost:${PORT}/api`);
  logger.info(`⚙️  Modo: ${process.env.NODE_ENV || "development"}`);
});
