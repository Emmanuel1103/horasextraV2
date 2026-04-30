/**
 * system-config.service.ts — lógica de negocio para la configuración global
 *
 * este servicio gestiona la persistencia de la configuración del sistema,
 * incluyendo procesos de migración automática de datos obsoletos y
 * establecimiento de valores por defecto para notificaciones.
 */

import { SystemConfigRepository } from "./system-config.repository";
import { SystemConfigEntity, DEFAULT_SYSTEM_CONFIG } from "./system-config.model";
import { logger } from "../../utils/logger";
import { getBogotaTimestamp } from "../../utils/datetime";

/**
 * obtiene la configuración completa del sistema.
 * si no existe, inicializa una configuración por defecto.
 */
export const getConfig = async (): Promise<SystemConfigEntity> => {
    const repo = new SystemConfigRepository();
    logger.info("obteniendo configuración del sistema");
    let existing = await repo.getById("system-config");

    if (!existing) {
        logger.info("configuración no encontrada - inicializando valores por defecto");
        existing = await repo.upsert(DEFAULT_SYSTEM_CONFIG);
    }

    // limpieza automática de campos obsoletos (migración)
    if ((existing as any).emailConfig) {
        logger.info("limpiando campo emailConfig obsoleto");
        delete (existing as any).emailConfig;
        existing.updatedAt = getBogotaTimestamp();
        existing = await repo.upsert(existing);
    }

    // asegura que existan asuntos por defecto para los correos
    let subjectsUpdated = false;
    if (!existing.requestEmailSubject) {
        existing.requestEmailSubject = "nueva solicitud de horas extras";
        subjectsUpdated = true;
    }
    if (!existing.decisionEmailSubject) {
        existing.decisionEmailSubject = "estado de solicitud de horas extras";
        subjectsUpdated = true;
    }

    if (subjectsUpdated) {
        existing = await repo.upsert(existing);
        logger.info("asuntos de correo por defecto aplicados");
    }

    return existing;
};

/**
 * retorna únicamente los campos de configuración que pueden ser expuestos públicamente.
 */
export const getPublicConfig = async (): Promise<Partial<SystemConfigEntity>> => {
    const config = await getConfig();
    return {
        horarios: config.horarios,
        unidades: config.unidades,
        holidays: config.holidays,
    };
};

/**
 * actualiza la configuración del sistema realizando un merge con los datos existentes.
 */
export const updateConfig = async (
    data: Partial<SystemConfigEntity>
): Promise<SystemConfigEntity> => {
    const repo = new SystemConfigRepository();
    logger.info("actualizando configuración del sistema");

    // protección: no permitir la modificación del id único de configuración
    delete (data as any).id;

    return repo.updateConfig(data);
};

