/**
 * requireAuth.ts — middleware de autenticación simplificado
 *
 * este archivo extrae la identidad del usuario a partir del token de entra id.
 * nota: en esta implementación se decodifica el token para obtener el email.
 * para producción, se debe validar la firma contra las llaves públicas de microsoft
 * (ver jwtMiddleware.ts para una implementación más robusta).
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        logger.error("requireAuth — falta la cabecera de autorización");
        return res.status(401).json({ error: "falta la cabecera de autorización" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // decodifica el token para extraer los claims de identidad
        const decoded: any = jwt.decode(token);
        if (!decoded) {
            throw new Error("token inválido");
        }

        // los tokens de microsoft suelen incluir 'email', 'preferred_username' o 'upn'
        const email = decoded.email || decoded.preferred_username || decoded.upn;

        if (!email) {
            logger.error("requireAuth — el token no contiene el claim de correo electrónico", decoded);
            return res.status(401).json({ error: "el token no contiene la identidad del usuario" });
        }

        // almacena la identidad del usuario en res.locals para que esté disponible en los controladores
        res.locals.userEmail = email;
        res.locals.userToken = decoded;

        logger.info(`requireAuth — usuario autenticado: ${email}`);
        next();
    } catch (e) {
        logger.error("requireAuth — error de autenticación", e);
        return res.status(401).json({ error: "token inválido" });
    }
};

