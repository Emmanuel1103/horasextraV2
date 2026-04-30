/**
 * datetime.ts — utilidades para la gestión de fechas y zonas horarias
 *
 * dado que el aplicativo opera en colombia, todas las fechas se normalizan
 * a la zona horaria "america/bogota" para asegurar consistencia en los reportes.
 */

const BOGOTA_TIMEZONE = "America/Bogota";

/**
 * extrae las partes de una fecha formateada según la zona horaria de bogotá.
 */
const getBogotaDateTimeParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOGOTA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "00";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
};

/**
 * convierte una entrada (string o date) en un objeto con año, mes y día.
 */
const extractYmd = (value: string | Date) => {
  if (value instanceof Date) {
    const parts = getBogotaDateTimeParts(value);
    return { year: parts.year, month: parts.month, day: parts.day };
  }

  const raw = String(value || "").trim();
  // intenta detectar formato yyyy-mm-dd directamente
  const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return { year: ymdMatch[1], month: ymdMatch[2], day: ymdMatch[3] };
  }

  // si no, intenta parsear la fecha
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const parts = getBogotaDateTimeParts(parsed);
    return { year: parts.year, month: parts.month, day: parts.day };
  }

  throw new Error(`valor de fecha inválido: ${raw}`);
};

/**
 * genera una marca de tiempo en formato iso8601 con el desfase horario de bogotá (-05:00).
 */
export const getBogotaTimestamp = (date = new Date()) => {
  const parts = getBogotaDateTimeParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}-05:00`;
};

/**
 * normaliza una fecha al inicio del día (00:00:00) en la zona horaria de bogotá.
 */
export const toBogotaDateStartTimestamp = (value: string | Date) => {
  const { year, month, day } = extractYmd(value);
  return `${year}-${month}-${day}T00:00:00-05:00`;
};

/**
 * obtiene el día de la semana (0-6) para una fecha dada, procesada en utc para evitar saltos horarios.
 */
export const getDayOfWeekFromDateValue = (value: string | Date) => {
  const { year, month, day } = extractYmd(value);
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay();
};

