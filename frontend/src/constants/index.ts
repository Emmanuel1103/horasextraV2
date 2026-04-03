
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: "Este campo es obligatorio",
  INVALID_EMAIL: "Email inválido",
  INVALID_TIME: "Formato de hora inválido",
  INVALID_DATE: "Fecha inválida",
  MISSING_FIELDS: "Por favor complete todos los campos obligatorios",
  MISSING_DATE_FIELDS: "Cada fecha debe tener toda la información completa",
  INVALID_SALARY: "El salario debe ser un número válido mayor a 0"
};

export const DEFAULT_TIME_RANGES = {
  MORNING_START: "06:00",
  MORNING_END: "14:00",
  AFTERNOON_START: "14:00",
  AFTERNOON_END: "22:00",
  NIGHT_START: "22:00",
  NIGHT_END: "06:00",
  DIURNA_START: 6,
  DIURNA_END: 22,
  NOCTURNA_START: 22,
  NOCTURNA_END: 6
};

export const OVERTIME_RATES = {
  DIURNA: 1.25,
  NOCTURNA: 1.75,
  DOMINICAL_DIURNA: 2.0,
  DOMINICAL_NOCTURNA: 2.5,
  RECARGO_DOM_DIURNO: 1.8,
  RECARGO_DOM_NOCTURNO: 2.15
};

export const WEEKEND_DAYS = ["domingo"] as const;

export const STANDARD_MONTHLY_HOURS = 220;