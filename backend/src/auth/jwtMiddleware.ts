import { Request, Response, NextFunction } from "express";
import jwksRsa from "jwks-rsa";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

const JWKS_URI = process.env.JWKS_URI || "";
const ALLOWED_AUDIENCE = process.env.ALLOWED_AUDIENCE || process.env.CLIENT_ID || "";
const ISSUER = process.env.JWT_ISSUER || "";

const client = JWKS_URI ? jwksRsa({ jwksUri: JWKS_URI, cache: true, rateLimit: true }) : null;

function getKey(header: any, callback: any) {
  if (!client) return callback(new Error("JWKS_URI not configured"));
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = (key as any).getPublicKey();
    callback(null, signingKey);
  });
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.split(" ")[1];
  jwt.verify(token, getKey as any, { audience: ALLOWED_AUDIENCE, issuer: ISSUER, algorithms: ["RS256"] }, (err, payload) => {
    if (err) {
      logger.warn({ err: err.message }, "JWT verification failed");
      return res.status(401).json({ error: "Invalid token", details: err.message });
    }
    (req as any).user = payload;
    next();
  });
};

export const requireRole = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const userRoles = (user && (user.roles || user.role || user['http://schemas.microsoft.com/identity/claims/groups'])) || [];
  const has = roles.some(r => {
    if (Array.isArray(userRoles)) return userRoles.includes(r);
    return String(userRoles) === r;
  });
  if (!has) return res.status(403).json({ error: "Forbidden" });
  next();
};
