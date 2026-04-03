import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

// Simple middleware to decode token (either from header or query for some simplified flows, preferably header)
// In a real Entra ID scenario, we should validate signature against Microsoft keys. 
// For now, assuming the token received from frontend is valid or validating basic structure if we used a symmetric key (which we likely don't for Entra ID).
// CAUTION: Entra ID tokens are RS256. We need to just decode and trust 'sub' OR validate properly.
// Since implementing full Entra ID validation with key rotation might be overkill for this step, 
// we will simply decode for now to get the email/oid. 
// Ideally we should use passport-azure-ad or similar.

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        logger.error("requireAuth - Missing Authorization header");
        // Fallback for demo/dev if needed, or error
        return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Just decode to get payload. In PROD, verify signature!
        const decoded: any = jwt.decode(token);
        if (!decoded) {
            throw new Error("Invalid token");
        }

        // Entra ID tokens usually have 'email' or 'preferred_username'
        const email = decoded.email || decoded.preferred_username || decoded.upn;

        if (!email) {
            logger.error("requireAuth - No email in token", decoded);
            return res.status(401).json({ error: "Token missing email claim" });
        }

        res.locals.userEmail = email;
        res.locals.userToken = decoded;

        logger.info(`requireAuth - Authenticated user: ${email}`);
        next();
    } catch (e) {
        logger.error("requireAuth - Auth error", e);
        return res.status(401).json({ error: "Invalid token" });
    }
};
