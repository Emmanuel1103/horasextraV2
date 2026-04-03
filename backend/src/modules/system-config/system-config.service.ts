import { SystemConfigRepository } from "./system-config.repository";
import { SystemConfigEntity, DEFAULT_SYSTEM_CONFIG } from "./system-config.model";
import { logger } from "../../utils/logger";
import { getBogotaTimestamp } from "../../utils/datetime";

/**
 * Obtiene la configuración completa del sistema
 */
export const getConfig = async (): Promise<SystemConfigEntity> => {
    const repo = new SystemConfigRepository();
    logger.info("⚙️ Obteniendo configuración del sistema");
    let existing = await repo.getById("system-config");

    if (!existing) {
        logger.info("⚙️ Configuración no encontrada - creando configuración por defecto");
        existing = await repo.upsert(DEFAULT_SYSTEM_CONFIG);
    }

    // Auto-cleanup: Remove old emailConfig field if it exists (migration)
    if ((existing as any).emailConfig) {
        logger.info("🗑️ Limpiando emailConfig antiguo de la base de datos...");
        delete (existing as any).emailConfig;
        existing.updatedAt = getBogotaTimestamp();
        existing = await repo.upsert(existing);
        logger.info("✅ emailConfig eliminado automáticamente");
    }

    // Auto-cleanup: Remove old approvalMessageHtml field if it exists (migration)
    if ((existing as any).approvalMessageHtml) {
        logger.info("🗑️ Limpiando approvalMessageHtml antiguo de la base de datos...");

        // Migrate value if requestEmailTemplate is empty
        if (!existing.requestEmailTemplate && (existing as any).approvalMessageHtml) {
            existing.requestEmailTemplate = (existing as any).approvalMessageHtml;
            logger.info("🔄 Migrando approvalMessageHtml a requestEmailTemplate");
        }

        delete (existing as any).approvalMessageHtml;
        existing.updatedAt = getBogotaTimestamp();
        existing = await repo.upsert(existing);
        logger.info("✅ approvalMessageHtml eliminado automáticamente");
    }

    // Ensure default subjects if missing
    let subjectsUpdated = false;
    if (!existing.requestEmailSubject) {
        existing.requestEmailSubject = "Nueva solicitud de horas extras";
        subjectsUpdated = true;
    }
    if (!existing.decisionEmailSubject) {
        existing.decisionEmailSubject = "Estado de solicitud de horas extras";
        subjectsUpdated = true;
    }
    if (!existing.resendEmailSubject) {
        existing.resendEmailSubject = "Reenvío: Solicitud de horas extras pendiente";
        subjectsUpdated = true;
    }
    if (!existing.forReviewEmailSubject) {
        existing.forReviewEmailSubject = "Solicitud de horas extras para revisión";
        subjectsUpdated = true;
    }
    if (!existing.reviewedEmailSubject) {
        existing.reviewedEmailSubject = "Solicitud de horas extras revisada";
        subjectsUpdated = true;
    }
    if (!existing.approvalRemovedEmailSubject) {
        existing.approvalRemovedEmailSubject = "Actualización de solicitud: aprobación ya no requerida";
        subjectsUpdated = true;
    }

    if (subjectsUpdated) {
        existing = await repo.upsert(existing);
        logger.info("✅ Asuntos de correo por defecto aplicados");
    }

    return existing;
};

/**
 * Obtiene la configuración pública del sistema (sin datos sensibles)
 * Usado para el formulario público de solicitud
 */
export const getPublicConfig = async (): Promise<Partial<SystemConfigEntity>> => {
    const config = await getConfig();
    return {
        horarios: config.horarios,
        unidades: config.unidades,
        holidays: config.holidays,
        // No devolver authorizedUsers, templates, subjects, etc.
    };
};

/**
 * Actualiza la configuración del sistema (merge parcial)
 */
export const updateConfig = async (
    data: Partial<SystemConfigEntity>
): Promise<SystemConfigEntity> => {
    const repo = new SystemConfigRepository(); // Instantiate repo locally for consistency
    logger.info("⚙️ Actualizando configuración del sistema");

    // No permitir cambiar el ID
    delete (data as any).id;

    return repo.updateConfig(data);
};
