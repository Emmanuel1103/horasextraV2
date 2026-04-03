/**
 * Servicio API para solicitudes de horas extras
 */

import { API_BASE_URL, API_ENDPOINTS, getDefaultHeaders, handleApiError } from "@/config/api";
import type { OvertimeFormSubmit, OvertimeRecord } from "@/types";

/**
 * Crea una o múltiples solicitudes de horas extras
 */
export const createOvertimeRequests = async (formData: OvertimeFormSubmit): Promise<{
  success: boolean;
  message: string;
  data: any[];
  count: number;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.requests.create}`, {
      method: "POST",
      headers: getDefaultHeaders(),
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error creando solicitudes:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Obtiene la lista de solicitudes con filtros
 */
export const getOvertimeRequests = async (filters?: {
  estado?: string;
  q?: string;
  page?: number;
}): Promise<OvertimeRecord[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.estado) params.append("estado", filters.estado);
    if (filters?.q) params.append("q", filters.q);
    if (filters?.page) params.append("page", filters.page.toString());

    const url = `${API_BASE_URL}${API_ENDPOINTS.requests.list}${params.toString() ? `?${params.toString()}` : ""}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error obteniendo solicitudes:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Obtiene estadísticas de las solicitudes
 */
export const getEstadisticas = async (): Promise<{
  resumen: {
    totalSolicitudes: number;
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
  };
  mesActual: {
    nombre: string;
    totalHoras: number;
    valorTotal: number;
    solicitudes: number;
  };
  general: {
    totalHoras: number;
    valorTotal: number;
  };
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.requests.estadisticas}`, {
      method: "GET",
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error obteniendo estadísticas:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Aprueba una solicitud
 */
export const approveRequest = async (id: string, approverEmail: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.requests.approve(id)}`, {
      method: "POST",
      headers: getDefaultHeaders(),
      body: JSON.stringify({ approverEmail }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error aprobando solicitud:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Rechaza una solicitud
 */
export const rejectRequest = async (id: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.requests.reject(id)}`, {
      method: "POST",
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error rechazando solicitud:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Marca una solicitud en revisión como revisada por nómina
 */
export const markRequestReviewed = async (
  id: string,
  reviewedByEmail?: string,
  reviewedApproverToken?: string
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.requests.markReviewed(id)}`, {
      method: "POST",
      headers: getDefaultHeaders(),
      body: JSON.stringify({
        reviewedByEmail: reviewedByEmail || "",
        reviewedApproverToken: reviewedApproverToken || "",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error marcando solicitud como revisada:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Cancela una solicitud
 */
export const cancelRequest = async (id: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.requests.cancel(id)}`, {
      method: "POST",
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error cancelando solicitud:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Actualiza una solicitud
 */
export const updateRequest = async (id: string, updates: Partial<OvertimeRecord>): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.requests.update(id)}`, {
      method: "PUT",
      headers: getDefaultHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error actualizando solicitud:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * Calcula horas y valor usando la lógica central del backend
 */
export const calculateOvertimePreview = async (payload: {
  fecha: string;
  horaInicio: string;
  horaFinal: string;
  salario: number;
  horariosConfig?: {
    diarnaStart?: number;
    diarnaEnd?: number;
    nocturnaStart?: number;
    nocturnaEnd?: number;
  };
}): Promise<{
  cantidadHoras: number;
  horasExtraDiurna: number;
  horasExtraNocturna: number;
  recargosDominicalFestivo: number;
  valorHorasExtra: number;
  diaSemana: number;
  fecha: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.requests.calculate}`, {
      method: "POST",
      headers: getDefaultHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error calculando horas:", error);
    throw new Error(handleApiError(error));
  }
};
