import { isValid, parse, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import type { OvertimeRecord } from "@/types";

export const toSafeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const parseDateValue = (value: unknown): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  if (typeof value === "number") {
    const asDate = new Date(value);
    return isValid(asDate) ? asDate : null;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const isoDate = parseISO(raw);
  if (isValid(isoDate)) return isoDate;

  const ddmmyyyy = parse(raw, "dd/MM/yyyy", new Date());
  if (isValid(ddmmyyyy)) return ddmmyyyy;

  const fallback = new Date(raw);
  return isValid(fallback) ? fallback : null;
};

export const getRecordHours = (record: OvertimeRecord): number => {
  return toSafeNumber((record as any).totales?.cantidadHoras ?? record.cantidadHoras);
};

export const getRecordAmount = (record: OvertimeRecord): number => {
  return toSafeNumber((record as any).totales?.valorTotal ?? record.valorHorasExtra);
};

export const getRecordDate = (record: OvertimeRecord): Date | null => {
  const primaryDate = parseDateValue(record.fecha);
  if (primaryDate) return primaryDate;

  return parseDateValue(record.dateEntries?.[0]?.fecha);
};

export const getRecordDay = (record: OvertimeRecord): string => {
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const rawDay = record.diaSemana ?? record.dateEntries?.[0]?.diaSemana;

  if (typeof rawDay === "number" && rawDay >= 0 && rawDay <= 6) {
    return dias[rawDay];
  }

  if (typeof rawDay === "string" && rawDay.trim() !== "") {
    return rawDay.toLowerCase();
  }

  const recordDate = getRecordDate(record);
  if (recordDate) {
    return format(recordDate, "EEEE", { locale: es }).toLowerCase();
  }

  return "";
};

export const getRecordApprovers = (record: OvertimeRecord): string => {
  const approvers = (record.approvers || [])
    .map((a) => String(a.email || "").trim().toLowerCase())
    .filter((email) => email && email !== "undefined");

  return Array.from(new Set(approvers)).join(";");
};

export const getCecoLabel = (cc: any): string => {
  if (Array.isArray(cc)) return cc.map(c => c.numero).join(", ");
  if (typeof cc === "object" && cc !== null) return cc.numero || "";
  return String(cc || "");
};

export const formatDateForExcel = (value: unknown): string => {
  const date = parseDateValue(value);
  if (!date) return "";
  return format(date, "dd/MM/yyyy");
};

export const formatCurrencyForExcel = (value: unknown): string => {
  const amount = toSafeNumber(value);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatHoursForExcel = (value: unknown): string => toSafeNumber(value).toFixed(2);
