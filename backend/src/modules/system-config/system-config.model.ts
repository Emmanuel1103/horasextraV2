/**
 * Modelo de configuración del sistema
 * Documento único en Cosmos DB que almacena toda la configuración
 */

import { getBogotaTimestamp } from "../../utils/datetime";

export interface HorariosConfig {
    diarnaStart: number;  // 0-23
    diarnaEnd: number;
    nocturnaStart: number;
    nocturnaEnd: number;
}

export interface OvertimeRatesConfig {
    DIURNA: number;
    NOCTURNA: number;
    DOMINICAL_DIURNA: number;
    DOMINICAL_NOCTURNA: number;
}

export interface DirectorConfig {
    id: string;
    nombre: string;
    email: string;
}

export interface CentroCostoConfig {
    id: string;
    numero: string;
    nombre: string;
}

export interface UnidadConfig {
    id: string;
    nombre: string;
    director: DirectorConfig;
    centrosCosto: CentroCostoConfig[];
}

export interface AuthorizedUserConfig {
    email: string;
    password: string; // hash en producción
}

export interface HolidayConfig {
    date: string; // ISO date string YYYY-MM-DD
    name: string;
}

// EmailConfig removed - SMTP configuration is now managed via environment variables
// See backend/.env for SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_FROM

export interface SystemConfigEntity {
    id: string; // Siempre "system-config" (documento único)
    horarios: HorariosConfig;
    overtimeRates: OvertimeRatesConfig;
    unidades: UnidadConfig[];
    authorizedUsers: AuthorizedUserConfig[];
    holidays: HolidayConfig[];
    requestEmailTemplate: string;
    requestEmailSubject: string;
    decisionEmailTemplate: string;
    decisionEmailSubject: string;
    
    // Nuevas plantillas solicitadas
    resendEmailTemplate?: string;
    resendEmailSubject?: string;
    forReviewEmailTemplate?: string;
    forReviewEmailSubject?: string;
    reviewedEmailTemplate?: string;
    reviewedEmailSubject?: string;
    approvalRemovedEmailTemplate?: string;
    approvalRemovedEmailSubject?: string;

    // emailConfig and approvalMessageHtml removed
    updatedAt: string;
}

/** Valores por defecto para la configuración inicial */
export const DEFAULT_SYSTEM_CONFIG: SystemConfigEntity = {
    id: "system-config",
    horarios: {
        diarnaStart: 6,
        diarnaEnd: 22,
        nocturnaStart: 22,
        nocturnaEnd: 6,
    },
    overtimeRates: {
        DIURNA: 1.25,
        NOCTURNA: 1.75,
        DOMINICAL_DIURNA: 2.0,
        DOMINICAL_NOCTURNA: 2.5,
    },
    unidades: [],
    authorizedUsers: [],
    holidays: [],
    requestEmailTemplate: "",
    requestEmailSubject: "Nueva solicitud de horas extras",
    decisionEmailTemplate: "",
    decisionEmailSubject: "Estado de solicitud de horas extras",
    
    // Valores por defecto para las nuevas plantillas
    resendEmailTemplate: "",
    resendEmailSubject: "Reenvío: Solicitud de horas extras pendiente",
    forReviewEmailTemplate: "",
    forReviewEmailSubject: "Solicitud de horas extras para revisión",
    reviewedEmailTemplate: "",
    reviewedEmailSubject: "Solicitud de horas extras revisada",
    approvalRemovedEmailTemplate: "",
    approvalRemovedEmailSubject: "Actualización de solicitud: aprobación ya no requerida",

    updatedAt: getBogotaTimestamp(),
};
