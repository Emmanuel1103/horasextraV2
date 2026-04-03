/**
 * Configuración del API
 * El frontend SOLO se comunica con el backend vía HTTP
 * NO maneja keys, tokens ni credenciales
 */

// URL base del backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Configuración de endpoints
export const API_ENDPOINTS = {
  // Solicitudes de horas extras
  requests: {
    create: "/requests",
    calculate: "/requests/calculate",
    list: "/requests",
    getById: (id: string) => `/requests/${id}`,
    approve: (id: string) => `/requests/${id}/approve`,
    reject: (id: string) => `/requests/${id}/reject`,
    markReviewed: (id: string) => `/requests/${id}/mark-reviewed`,
    cancel: (id: string) => `/requests/${id}/cancel`,
    update: (id: string) => `/requests/${id}`,
    estadisticas: "/requests/estadisticas",
  },
};

/**
 * Headers por defecto para las peticiones
 * Solo Content-Type, sin tokens ni autenticación en el frontend
 */
export const getDefaultHeaders = (): HeadersInit => {
  const token = sessionStorage.getItem("authToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Maneja errores de la API
 */
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Error de respuesta del servidor
    return error.response.data?.message || error.response.data?.error || "Error del servidor";
  } else if (error.request) {
    // Error de red
    return "Error de conexión con el servidor. Verifica tu conexión a internet.";
  } else {
    // Otro tipo de error
    return error.message || "Error desconocido";
  }
};
