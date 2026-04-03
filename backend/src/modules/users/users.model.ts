export type UserRole = "COLABORADOR" | "NOMINA" | "DEV";

export interface UserEntity {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    lastLogin: string;
}
