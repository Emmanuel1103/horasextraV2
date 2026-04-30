/**
 * requestsApi.ts — servicio de comunicación con la api de solicitudes
 *
 * centraliza todas las peticiones fetch relacionadas con las solicitudes de horas extras,
 * incluyendo creación, consulta, aprobación y cálculos de previsualización.
 */

import { API_BASE_URL, API_ENDPOINTS, getDefaultHeaders, handleApiError } from "@/config/api";
import type { OvertimeFormSubmit, OvertimeRecord } from "@/types";

/**
 * envía los datos del formulario para crear una o múltiples solicitudes de horas extras.
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
      throw new Error(errorData.message || errorData.error || `error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("error creando solicitudes:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * recupera el listado de solicitudes aplicando filtros de búsqueda y paginación.
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
      throw new Error(errorData.message || errorData.error || `error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("error obteniendo solicitudes:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * obtiene métricas de gestión y resúmenes estadísticos del sistema.
 */
export const getEstadisticas = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.requests.estadisticas}`, {
      method: "GET",
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("error obteniendo estadísticas:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * ejecuta la acción de aprobación administrativa para una solicitud específica.
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
      throw new Error(errorData.message || errorData.error || `error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("error aprobando solicitud:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * marca una solicitud como rechazada en el sistema.
 */
export const rejectRequest = async (id: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.requests.reject(id)}`, {
      method: "POST",
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("error rechazando solicitud:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * sincroniza el estado de revisión de una solicitud por parte del equipo de nómina.
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
      throw new Error(errorData.message || errorData.error || `error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("error marcando solicitud como revisada:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * permite al usuario retirar una solicitud enviada previamente.
 */
export const cancelRequest = async (id: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.requests.cancel(id)}`, {
      method: "POST",
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("error cancelando solicitud:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * actualiza campos específicos de una solicitud existente.
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
      throw new Error(errorData.message || errorData.error || `error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("error actualizando solicitud:", error);
    throw new Error(handleApiError(error));
  }
};

/**
 * solicita al backend el cálculo de horas y valores para una entrada de tiempo antes de su envío.
 */
export const calculateOvertimePreview = async (payload: any): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.requests.calculate}`, {
      method: "POST",
      headers: getDefaultHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("error calculando horas:", error);
    throw new Error(handleApiError(error));
  }
};

