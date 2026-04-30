/**
 * requests.helpers.ts — utilidades auxiliares para el procesamiento de solicitudes
 *
 * contiene funciones de normalización de datos, comparaciones de arreglos de centros
 * de costo y selectores de información comunes.
 */

import { RequestEntity, CentroCostoItem } from "./requests.repository";

/**
 * normaliza una entrada de centros de costo a un arreglo de strings (números de CeCo).
 */
export const normalizeCecos = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((cc: any) => String(cc?.numero || cc || "").trim())
          .filter(Boolean)
      )
    ).sort();
  }
  const single = String(value || "").trim();
  return single ? [single] : [];
};

/**
 * compara dos arreglos de strings de forma exacta.
 */
export const areSameStringSets = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
};

/**
 * normaliza la distribución de centros de costo (número + porcentaje).
 */
export const normalizeCecoDistribution = (value: any): Array<{ numero: string; porcentaje: number | null }> => {
  if (!Array.isArray(value)) return [];

  const byNumero = new Map<string, number | null>();
  value.forEach((cc: any) => {
    const numero = String(cc?.numero || cc || "").trim();
    if (!numero) return;

    const porcentajeRaw = Number(cc?.porcentaje);
    const porcentaje = Number.isFinite(porcentajeRaw) ? porcentajeRaw : null;

    if (!byNumero.has(numero) || porcentaje !== null) {
      byNumero.set(numero, porcentaje);
    }
  });

  return Array.from(byNumero.entries())
    .map(([numero, porcentaje]) => ({ numero, porcentaje }))
    .sort((a, b) => a.numero.localeCompare(b.numero));
};

/**
 * compara dos distribuciones de centros de costo incluyendo porcentajes.
 */
export const areSameCecoDistribution = (
  a: Array<{ numero: string; porcentaje: number | null }>,
  b: Array<{ numero: string; porcentaje: number | null }>
) => {
  if (a.length !== b.length) return false;
  return a.every((item, idx) => item.numero === b[idx].numero && item.porcentaje === b[idx].porcentaje);
};

/**
 * extrae todos los números de centros de costo presentes en una entidad de solicitud.
 */
export const getRequestCecos = (record: Partial<RequestEntity>) => {
  const fromDateEntries = Array.isArray((record as any).dateEntries)
    ? (record as any).dateEntries.flatMap((entry: any) =>
        (entry?.centroCosto || []).map((cc: any) => String(cc?.numero || cc || "").trim())
      )
    : [];

  const fromCentroCosto = Array.isArray((record as any).centroCosto)
    ? (record as any).centroCosto.map((cc: any) => String(cc?.numero || cc || "").trim())
    : [];

  const fromTotales = Array.isArray((record as any).totales?.centrosCostoInvolucrados)
    ? (record as any).totales.centrosCostoInvolucrados.map((cc: any) => String(cc || "").trim())
    : [];

  const preferred = [...fromDateEntries, ...fromCentroCosto].filter(Boolean);
  const source = preferred.length > 0 ? preferred : fromTotales;

  return normalizeCecos(source);
};
