/**
 * users.service.ts — lógica de negocio para la gestión de usuarios
 *
 * este servicio maneja la sincronización de perfiles de usuario provenientes
 * de microsoft entra id y el control de roles dentro del sistema.
 */

import { UsersRepository } from "./users.repository";
import { UserEntity, UserRole } from "./users.model";
import { getBogotaTimestamp } from "../../utils/datetime";

const usersRepo = new UsersRepository();

/**
 * sincroniza un usuario tras un inicio de sesión exitoso.
 * si el usuario no existe, se crea con el rol por defecto (colaborador).
 */
export const syncUser = async (email: string, name: string, oid?: string): Promise<UserEntity> => {
    let user = await usersRepo.findByEmail(email);
    const now = getBogotaTimestamp();

    if (!user && oid) {
        // intenta buscar por oid si el correo cambió o no está disponible
        const existingById = await usersRepo.getById(oid);
        if (existingById) {
            user = existingById;
            if (user.email !== email) user.email = email;
        }
    }

    if (!user) {
        // creación de nuevo perfil en la base de datos local
        user = await usersRepo.createNew(email, name, "COLABORADOR", oid);
    } else {
        // actualización de metadatos de última conexión y nombre
        user.lastLogin = now;
        user.name = name;
        await usersRepo.update(user);
    }
    return user;
};

/**
 * obtiene la lista completa de usuarios registrados.
 */
export const getAllUsers = async (): Promise<UserEntity[]> => {
    return await usersRepo.findAll();
};

/**
 * busca un usuario específico por su identificador único.
 */
export const getUserById = async (id: string): Promise<UserEntity | undefined> => {
    return await usersRepo.getById(id);
};

/**
 * actualiza el rol administrativo de un usuario.
 */
export const updateUserRole = async (id: string, newRole: UserRole): Promise<UserEntity | undefined> => {
    const user = await usersRepo.getById(id);
    if (!user) return undefined;

    user.role = newRole;
    return await usersRepo.update(user);
};

/**
 * busca un usuario basándose en su dirección de correo electrónico.
 */
export const getUserByEmail = async (email: string): Promise<UserEntity | undefined> => {
    return await usersRepo.findByEmail(email);
};

