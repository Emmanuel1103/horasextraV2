/**
 * overtimeCalculations.ts — lógica de cálculo de horas extra y recargos
 *
 * este archivo centraliza las reglas de negocio para determinar cuántas horas
 * corresponden a cada categoría (diurna, nocturna, festiva) y su valoración económica.
 */

export interface HoursCalcResult {
  cantidadHoras: number;
  horasExtraDiurna: number;
  horasExtraNocturna: number;
  recargosDominicalFestivo: number;
}

/**
 * calcula la distribución de horas entre diurnas y nocturnas para un rango de tiempo dado.
 * @param horaInicio formato "HH:mm"
 * @param horaFinal formato "HH:mm"
 * @param diaSemana 0-6 (domingo a sábado)
 * @param config límites horarios para jornada diurna/nocturna
 * @param isHoliday flag si la fecha es festiva
 */
export const calculateOvertimeHours = (
  horaInicio: string,
  horaFinal: string,
  diaSemana: number,
  config: { diurnaStart?: number; diurnaEnd?: number; nocturnaStart?: number; nocturnaEnd?: number } = {},
  isHoliday: boolean = false
): HoursCalcResult => {
  const parseToMinutes = (t: string) => {
    const [hh, mm] = t.split(":").map(Number);
    return (hh || 0) * 60 + (mm || 0);
  };

  const startMin = parseToMinutes(horaInicio);
  const endMinRaw = parseToMinutes(horaFinal);
  
  // si el final es menor al inicio, se asume que pasó a la medianoche del día siguiente
  const endMin = endMinRaw <= startMin ? endMinRaw + 24 * 60 : endMinRaw;
  const durMin = endMin - startMin;

  const diurnaStart = config.diurnaStart ?? 6; // por defecto inicia a las 6:00
  const diurnaEnd = config.diurnaEnd ?? 22;   // por defecto termina a las 22:00

  let minutosDiurnos = 0;
  let minutosNocturnos = 0;

  // clasificación minuto a minuto para mayor precisión
  for (let m = 0; m < durMin; m++) {
    const minuteOfDay = (startMin + m) % (24 * 60);
    const currentHour = minuteOfDay / 60;

    if (currentHour >= diurnaStart && currentHour < diurnaEnd) {
      minutosDiurnos += 1;
    } else {
      minutosNocturnos += 1;
    }
  }

  const dur = durMin / 60;
  const hDiurna = minutosDiurnos / 60;
  const hNocturna = minutosNocturnos / 60;

  // se considera día especial si es domingo (0) o festivo
  const esDominicalOFestivo = diaSemana === 0 || isHoliday;
  
  return {
    cantidadHoras: Math.round(dur * 100) / 100,
    horasExtraDiurna: Math.round(hDiurna * 100) / 100,
    horasExtraNocturna: Math.round(hNocturna * 100) / 100,
    recargosDominicalFestivo: esDominicalOFestivo ? 1 : 0,
  };
};

/**
 * calcula el valor monetario de las horas extra basándose en el salario y los recargos.
 * @param salario salario base mensual
 * @param rates factores de recargo (ej: 1.25 para diurna ordinaria)
 * @param baseHoursPerMonth horas base mensuales para el cálculo de la hora ordinaria
 */
export const calculateOvertimeValue = (
  salario: number,
  horasExtraDiurna: number,
  horasExtraNocturna: number,
  recargosDominicalFestivo: number,
  rates?: { DIURNA: number; NOCTURNA: number; DOMINICAL_DIURNA: number; DOMINICAL_NOCTURNA: number },
  baseHoursPerMonth = Number(process.env.OVERTIME_WORK_HOURS_PER_MONTH || 220)
) => {
  const valorHora = salario > 0 ? salario / baseHoursPerMonth : 0;
  const r = rates ?? { DIURNA: 1.25, NOCTURNA: 1.75, DOMINICAL_DIURNA: 2.0, DOMINICAL_NOCTURNA: 2.5 };
  
  // selecciona el factor de recargo según si es día ordinario o festivo
  const diurnaRec = recargosDominicalFestivo ? r.DOMINICAL_DIURNA : r.DIURNA;
  const nocturnaRec = recargosDominicalFestivo ? r.DOMINICAL_NOCTURNA : r.NOCTURNA;
  
  const total = (horasExtraDiurna * valorHora * diurnaRec + horasExtraNocturna * valorHora * nocturnaRec);
  return Math.round(total * 100) / 100;
};

