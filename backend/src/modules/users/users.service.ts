import { UsersRepository } from "./users.repository";
import { UserEntity, UserRole } from "./users.model";
import { getBogotaTimestamp } from "../../utils/datetime";

const usersRepo = new UsersRepository();

export const syncUser = async (email: string, name: string, oid?: string): Promise<UserEntity> => {
    let user = await usersRepo.findByEmail(email);
    const now = getBogotaTimestamp();

    if (!user) {
        // If we have an OID, try to find by ID first? 
        // Actually, Cosmos DB queries by ID are cheap.
        if (oid) {
            const existingById = await usersRepo.getById(oid);
            if (existingById) {
                user = existingById;
                // Update email if changed
                if (user.email !== email) user.email = email;
            }
        }
    }

    if (!user) {
        // Create new user (default role COLABORADOR)
        user = await usersRepo.createNew(email, name, "COLABORADOR", oid);
    } else {
        // Update last login
        user.lastLogin = now;
        // Optionally update name if changed in AD
        user.name = name;
        await usersRepo.update(user);
    }
    return user;
};

export const getAllUsers = async (): Promise<UserEntity[]> => {
    return await usersRepo.findAll();
};

export const getUserById = async (id: string): Promise<UserEntity | undefined> => {
    return await usersRepo.getById(id);
};

export const updateUserRole = async (id: string, newRole: UserRole): Promise<UserEntity | undefined> => {
    const user = await usersRepo.getById(id);
    if (!user) return undefined;

    user.role = newRole;
    return await usersRepo.update(user);
};

export const getUserByEmail = async (email: string): Promise<UserEntity | undefined> => {
    return await usersRepo.findByEmail(email);
};
