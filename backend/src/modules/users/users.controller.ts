import { Request, Response } from "express";
import * as usersService from "./users.service";
import { logger } from "../../utils/logger";

export const getMe = async (req: Request, res: Response) => {
    // Let's assume the auth middleware (to be verified/created) places the user email in `res.locals.userEmail`.
    const email = res.locals.userEmail;
    logger.info(`GET /me - userEmail from token: ${email}`);
    if (!email) {
        logger.error("GET /me - No email in res.locals");
        return res.status(401).json({ error: "No autenticado" });
    }

    let user = await usersService.getUserByEmail(email);
    logger.info(`GET /me - User found in DB: ${JSON.stringify(user)}`);

    if (!user) {
        logger.warn(`GET /me - User not found in DB for email: ${email}. Attempting auto-sync.`);
        const token = res.locals.userToken || {};
        const name = token.name || email;
        const oid = token.oid; // Extract OID

        try {
            user = await usersService.syncUser(email, name, oid);
            logger.info(`GET /me - Auto-synced user: ${JSON.stringify(user)}`);
        } catch (e) {
            logger.error(`GET /me - Failed to auto-sync user: ${e}`);
            return res.status(500).json({ error: "Error sincronizando usuario" });
        }
    }

    if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user);
};

export const getAll = async (req: Request, res: Response) => {
    try {
        const users = await usersService.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
};

export const updateRole = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || (role !== "COLABORADOR" && role !== "NOMINA")) {
        return res.status(400).json({ error: "Rol inválido" });
    }

    try {
        const updatedUser = await usersService.updateUserRole(id, role);
        if (!updatedUser) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar rol" });
    }
};
