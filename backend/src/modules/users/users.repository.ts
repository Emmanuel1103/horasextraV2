import { RepositoryBase } from "../../db/cosmos/repositoryBase";
import { UserEntity, UserRole } from "./users.model";
import { v4 as uuidv4 } from "uuid";
import { getBogotaTimestamp } from "../../utils/datetime";

export class UsersRepository extends RepositoryBase<UserEntity> {
    constructor() {
        super("users");
    }

    async findByEmail(email: string): Promise<UserEntity | undefined> {
        const querySpec = "SELECT * FROM c WHERE c.email = @email";
        const parameters = [{ name: "@email", value: email }];
        const results = await this.query(querySpec, parameters);
        return results.length > 0 ? results[0] : undefined;
    }

    async createNew(email: string, name: string, role: UserRole = "COLABORADOR", id?: string): Promise<UserEntity> {
        const now = getBogotaTimestamp();
        const newUser: UserEntity = {
            id: id || uuidv4(),
            email,
            name,
            role,
            createdAt: now,
            lastLogin: now
        };
        // @ts-ignore - RepositoryBase.create returns resource which might be typed as any or Resource
        // but we know it matches T. 
        return this.create(newUser) as Promise<UserEntity>;
    }

    async findAll(): Promise<UserEntity[]> {
        const querySpec = "SELECT * FROM c";
        return this.query(querySpec);
    }

    async update(user: UserEntity): Promise<UserEntity> {
        // @ts-ignore
        return this.upsert(user);
    }
}
