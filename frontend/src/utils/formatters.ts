/**
 * Utility functions for formatting data across the application
 */

/**
 * Formats centroCosto field to a readable string
 * Handles both string and array formats
 */
export const formatCentroCosto = (
  centroCosto: string | Array<{ numero: string; porcentaje?: number }> | undefined | null
): string => {
  if (!centroCosto) return "N/A";
  
  if (typeof centroCosto === "string") {
    return centroCosto;
  }
  
  if (Array.isArray(centroCosto)) {
    return centroCosto
      .map(cc => `${cc.numero} (${cc.porcentaje || 100}%)`)
      .join(", ");
  }
  
  return "N/A";
};

/**
 * Converts centroCosto array to string for editing forms
 */
export const centroCostoToString = (
  centroCosto: string | Array<{ numero: string; porcentaje?: number }> | undefined | null
): string => {
  return formatCentroCosto(centroCosto);
};