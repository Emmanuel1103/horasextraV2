/**
 * jwtMiddleware.ts — middleware para la validación de tokens de microsoft entra id
 *
 * este archivo implementa la validación de firmas rs256 utilizando jwks (json web key sets),
 * asegurando que los tokens recibidos sean auténticos y emitidos por microsoft.
 */

import { Request, Response, NextFunction } from "express";
import jwksRsa from "jwks-rsa";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

const JWKS_URI = process.env.JWKS_URI || "";
const ALLOWED_AUDIENCE = process.env.ALLOWED_AUDIENCE || process.env.CLIENT_ID || "";
const ISSUER = process.env.JWT_ISSUER || "";

// cliente para obtener las llaves públicas de microsoft con soporte de caché
const client = JWKS_URI ? jwksRsa({ jwksUri: JWKS_URI, cache: true, rateLimit: true }) : null;

/**
 * obtiene la llave pública necesaria para verificar la firma del token.
 */
function getKey(header: any, callback: any) {
  if (!client) return callback(new Error("jwks_uri no está configurada"));
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = (key as any).getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * middleware principal que valida el token jwt presente en la cabecera authorization.
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "no autorizado" });
  
  const token = auth.split(" ")[1];
  
  // verificación del token contra los parámetros de microsoft
  jwt.verify(token, getKey as any, { 
    audience: ALLOWED_AUDIENCE, 
    issuer: ISSUER, 
    algorithms: ["RS256"] 
  }, (err, payload) => {
    if (err) {
      logger.warn({ err: err.message }, "falló la verificación del jwt");
      return res.status(401).json({ error: "token inválido", details: err.message });
    }
    // inyecta el contenido del token en el objeto request para uso posterior
    (req as any).user = payload;
    next();
  });
};

/**
 * middleware para restringir el acceso a rutas basado en los roles/grupos del usuario.
 * @param roles lista de roles permitidos para acceder a la ruta.
 */
export const requireRole = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  // busca roles en los claims estándar de microsoft y grupos de entra id
  const userRoles = (user && (user.roles || user.role || user['http://schemas.microsoft.com/identity/claims/groups'])) || [];
  
  const has = roles.some(r => {
    if (Array.isArray(userRoles)) return userRoles.includes(r);
    return String(userRoles) === r;
  });
  
  if (!has) return res.status(403).json({ error: "prohibido: no tienes el rol necesario" });
  next();
};

