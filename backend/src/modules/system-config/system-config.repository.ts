import { RepositoryBase } from "../../db/cosmos/repositoryBase";
import { SystemConfigEntity, DEFAULT_SYSTEM_CONFIG } from "./system-config.model";
import { getBogotaTimestamp } from "../../utils/datetime";

const CONFIG_ID = "system-config";

export class SystemConfigRepository extends RepositoryBase<SystemConfigEntity> {
    constructor() {
        super("system-config");
    }

    /**
     * Obtiene la configuración del sistema.
     * Si no existe, crea una con los valores por defecto y la retorna.
     */
    async getConfig(): Promise<SystemConfigEntity> {
        const existing = await this.getById(CONFIG_ID);
        if (existing) return existing;

        // Crear documento con valores por defecto
        const created = await this.create({
            ...DEFAULT_SYSTEM_CONFIG,
            updatedAt: getBogotaTimestamp(),
        });
        return created as SystemConfigEntity;
    }

    /**
     * Actualiza la configuración del sistema (upsert).
     */
    async updateConfig(config: Partial<SystemConfigEntity>): Promise<SystemConfigEntity> {
        const current = await this.getConfig();
        const updated: SystemConfigEntity = {
            ...current,
            ...config,
            id: CONFIG_ID, // Siempre mantener el mismo ID
            updatedAt: getBogotaTimestamp(),
        };
        return await this.upsert(updated);
    }
}
