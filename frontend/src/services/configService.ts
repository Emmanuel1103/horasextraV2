/**
 * Servicio para comunicar con el backend de configuración del sistema.
 * Reemplaza el uso de localStorage para persistencia real.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface SystemConfig {
    id: string;
    horarios: {
        diarnaStart: number;
        diarnaEnd: number;
        nocturnaStart: number;
        nocturnaEnd: number;
    };
    overtimeRates: {
        DIURNA: number;
        NOCTURNA: number;
        DOMINICAL_DIURNA: number;
        DOMINICAL_NOCTURNA: number;
    };
    unidades: Array<{
        id: string;
        nombre: string;
        director: { id: string; nombre: string; email: string };
        centrosCosto: Array<{ id: string; numero: string; nombre: string }>;
    }>;
    authorizedUsers: Array<{ email: string; password: string }>;
    holidays: Array<{ date: string; name: string }>;

    // Email templates
    requestEmailTemplate?: string;
    requestEmailSubject?: string;
    decisionEmailTemplate?: string;
    decisionEmailSubject?: string;
    resendEmailTemplate?: string;
    resendEmailSubject?: string;
    forReviewEmailTemplate?: string;
    forReviewEmailSubject?: string;
    reviewedEmailTemplate?: string;
    reviewedEmailSubject?: string;
    approvalRemovedEmailTemplate?: string;
    approvalRemovedEmailSubject?: string;

    // Deprecated fields (kept for type safety during migration if needed)
    approvalMessageHtml?: string;
    emailConfig?: any;
    updatedAt: string;
}

/**
 * Obtiene la configuración completa del sistema desde el backend.
 */
export const getSystemConfig = async (): Promise<SystemConfig> => {
    const token = sessionStorage.getItem("authToken");
    const headers: HeadersInit = {
        "Content-Type": "application/json"
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/config`, { headers });
    if (!response.ok) {
        throw new Error(`Error al obtener configuración: ${response.statusText}`);
    }
    return response.json();
};

/**
 * Obtiene la configuración pública del sistema (sin autenticación).
 * Usado para el formulario de solicitud pública.
 */
export const getPublicSystemConfig = async (): Promise<Partial<SystemConfig>> => {
    const response = await fetch(`${API_URL}/public-config`);
    if (!response.ok) {
        throw new Error(`Error al obtener configuración pública: ${response.statusText}`);
    }
    return response.json();
};

/**
 * Actualiza la configuración del sistema en el backend (merge parcial).
 */
export const updateSystemConfig = async (
    data: Partial<SystemConfig>
): Promise<SystemConfig> => {
    const token = sessionStorage.getItem("authToken");
    const headers: HeadersInit = {
        "Content-Type": "application/json"
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/config`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`Error al actualizar configuración: ${response.statusText}`);
    }
    return response.json();
};
