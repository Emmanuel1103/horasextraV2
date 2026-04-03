import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal error" });
};
