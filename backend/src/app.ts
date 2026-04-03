import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import apiRouter from "./routes/api";
import { errorHandler } from "./utils/errorHandler";
import { logger } from "./utils/logger";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));

// Middleware de logging más legible
app.use((req, _res, next) => { 
  logger.info(`→ ${req.method} ${req.url}`); 
  next(); 
});

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: Number(process.env.RATE_LIMIT_MAX || 100),
});
app.use(limiter);

app.use("/api", apiRouter);

app.use(errorHandler);

export default app;
