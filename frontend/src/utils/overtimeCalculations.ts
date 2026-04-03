import { OVERTIME_RATES, STANDARD_MONTHLY_HOURS } from "@/constants";
import type { OvertimeCalculationResult, HorariosConfig } from "@/types";

export interface DetailedOvertimeResult {
  cantidadHoras: number;
  // Entre semana
  extraDiurna: number;
  extraNocturna: number;
  // Dominicales/Festivos - Recargos (Primeras 8h)
  recargoDominicalDiurno: number;
  recargoDominicalNocturno: number;
  // Dominicales/Festivos - Extras (Después de 8h)
  extraDominicalDiurna: number;
  extraDominicalNocturna: number;
  isHoliday: boolean;
}

/**
 * Convierte una cadena de tiempo (HH:mm) a minutos desde medianoche
 */
const timeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

const toDateOnly = (value: string | Date): string => {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  return String(value).split("T")[0];
};

/**
 * Calcula si es fin de semana o festivo
 */
const isWeekendOrHoliday = (fecha: string, festivos: string[] = []): boolean => {
  const fechaOnly = toDateOnly(fecha);
  const date = new Date(fechaOnly + "T00:00:00");
  const day = date.getDay(); // 0 = Domingo, 6 = Sábado
  
  // Sábado (6) no aplica recargo dominical, solo Domingo (0)
  const isWeekend = day === 0;
  
  // Festivo (comparación de fecha YYYY-MM-DD)
  const isHoliday = festivos.some((f) => toDateOnly(f) === fechaOnly);
  
  return isWeekend || isHoliday;
};

/**
 * Calcula las horas extras desglosadas por tipo con alta precisión
 * @param horaInicio Hora de inicio en formato HH:mm
 * @param horaFinal Hora final en formato HH:mm
 * @param fecha Fecha en formato YYYY-MM-DD
 * @param config Configuración de horarios (rango diurno/nocturno)
 * @param festivos Lista de fechas festivas (ISO strings o YYYY-MM-DD)
 */
/**
 * Calcula las horas extras desglosadas por tipo con alta precisión, 
 * diferenciando entre recargos (primeras 8h) y horas extra en domingos.
 */
export const calculateOvertimeHours = (
  horaInicio: string,
  horaFinal: string,
  fecha: string,
  config: HorariosConfig,
  festivos: string[] = []
): OvertimeCalculationResult => {
  const inicioMinutes = timeToMinutes(horaInicio);
  let finalMinutes = timeToMinutes(horaFinal);

  if (finalMinutes < inicioMinutes) {
    finalMinutes += 24 * 60;
  }

  let horasExtraDiurna = 0;
  let horasExtraNocturna = 0;
  let horasExtraDiurnaDominical = 0;
  let horasExtraNocturnaDominical = 0;
  let recargoDominicalDiurno = 0;
  let recargoDominicalNocturno = 0;

  const isHoliday = isWeekendOrHoliday(fecha, festivos);
  const totalHoras = (finalMinutes - inicioMinutes) / 60;

  const step = 0.01;
  let currentAccumulatedHours = 0;

  for (let h = inicioMinutes / 60; h < finalMinutes / 60; h += step) {
    const currentHourNormalized = h % 24;
    const isDiurna = currentHourNormalized >= config.diarnaStart && currentHourNormalized < config.diarnaEnd;
    
    if (isHoliday) {
      // Regla: Primeras 8 horas son Recargo, el resto son Horas Extra
      if (currentAccumulatedHours < 8) {
        if (isDiurna) recargoDominicalDiurno += step;
        else recargoDominicalNocturno += step;
      } else {
        if (isDiurna) horasExtraDiurnaDominical += step;
        else horasExtraNocturnaDominical += step;
      }
    } else {
      if (isDiurna) horasExtraDiurna += step;
      else horasExtraNocturna += step;
    }
    
    currentAccumulatedHours += step;
  }

  return {
    cantidadHoras: Math.round(totalHoras * 100) / 100,
    horasExtraDiurna: Math.round(horasExtraDiurna * 100) / 100,
    horasExtraNocturna: Math.round(horasExtraNocturna * 100) / 100,
    horasExtraDiurnaDominical: Math.round(horasExtraDiurnaDominical * 100) / 100,
    horasExtraNocturnaDominical: Math.round(horasExtraNocturnaDominical * 100) / 100,
    recargoDominicalDiurno: Math.round(recargoDominicalDiurno * 100) / 100,
    recargoDominicalNocturno: Math.round(recargoDominicalNocturno * 100) / 100,
    recargosDominicalFestivo: isHoliday ? 1 : 0,
  };
};

/**
 * Calcula el valor en dinero de las horas extras basado en las nuevas tarifas
 */
export const calculateOvertimeValue = (
  salario: number,
  result: OvertimeCalculationResult,
  rates?: {
    DIURNA: number;
    NOCTURNA: number;
    DOMINICAL_DIURNA: number;
    DOMINICAL_NOCTURNA: number;
    RECARGO_DOM_DIURNO: number;
    RECARGO_DOM_NOCTURNO: number;
  },
  baseHoursPerMonth: number = STANDARD_MONTHLY_HOURS
): number => {
  if (salario <= 0) return 0;
  const valorHora = salario / baseHoursPerMonth;
  const r = rates ?? OVERTIME_RATES;

  const total = (
    (result.horasExtraDiurna * r.DIURNA) +
    (result.horasExtraNocturna * r.NOCTURNA) +
    (result.horasExtraDiurnaDominical * r.DOMINICAL_DIURNA) +
    (result.horasExtraNocturnaDominical * r.DOMINICAL_NOCTURNA) +
    (result.recargoDominicalDiurno * (r as any).RECARGO_DOM_DIURNO) +
    (result.recargoDominicalNocturno * (r as any).RECARGO_DOM_NOCTURNO)
  ) * valorHora;

  return Math.round(total * 100) / 100;
};

/**
 * Calcula las horas extras desglosadas detalladamente para reportes contables
 * Separa recargos (primeras 8h) de horas extras (después de 8h) en dominicales
 */
export const calculateDetailedOvertime = (
  horaInicio: string,
  horaFinal: string,
  fecha: string,
  config: HorariosConfig,
  festivos: string[] = [],
  horasPreviasDelDia: number = 0 // Para manejar el tope de 8h de recargo
): DetailedOvertimeResult => {
  const inicioMinutes = timeToMinutes(horaInicio);
  let finalMinutes = timeToMinutes(horaFinal);

  if (finalMinutes < inicioMinutes) {
    finalMinutes += 24 * 60;
  }

  const isHoliday = isWeekendOrHoliday(fecha, festivos);
  const result: DetailedOvertimeResult = {
    cantidadHoras: (finalMinutes - inicioMinutes) / 60,
    extraDiurna: 0,
    extraNocturna: 0,
    recargoDominicalDiurno: 0,
    recargoDominicalNocturno: 0,
    extraDominicalDiurna: 0,
    extraDominicalNocturna: 0,
    isHoliday,
  };

  const step = 0.01;
  let accumulatedHoursInEntry = 0;

  for (let h = inicioMinutes / 60; h < finalMinutes / 60; h += step) {
    const currentHourNormalized = h % 24;
    const isDiurna = currentHourNormalized >= config.diarnaStart && currentHourNormalized < config.diarnaEnd;
    const totalDayHoursSoFar = horasPreviasDelDia + accumulatedHoursInEntry;

    if (!isHoliday) {
      if (isDiurna) result.extraDiurna += step;
      else result.extraNocturna += step;
    } else {
      // Regla de Domingo/Festivo: Primeras 8h son Recargo, el resto son Extra
      const isRecargo = totalDayHoursSoFar < 8;

      if (isRecargo) {
        if (isDiurna) result.recargoDominicalDiurno += step;
        else result.recargoDominicalNocturno += step;
      } else {
        if (isDiurna) result.extraDominicalDiurna += step;
        else result.extraDominicalNocturna += step;
      }
    }
    accumulatedHoursInEntry += step;
  }

  // Redondeo de precisión
  result.cantidadHoras = Math.round(result.cantidadHoras * 100) / 100;
  result.extraDiurna = Math.round(result.extraDiurna * 100) / 100;
  result.extraNocturna = Math.round(result.extraNocturna * 100) / 100;
  result.recargoDominicalDiurno = Math.round(result.recargoDominicalDiurno * 100) / 100;
  result.recargoDominicalNocturno = Math.round(result.recargoDominicalNocturno * 100) / 100;
  result.extraDominicalDiurna = Math.round(result.extraDominicalDiurna * 100) / 100;
  result.extraDominicalNocturna = Math.round(result.extraDominicalNocturna * 100) / 100;

  return result;
};
