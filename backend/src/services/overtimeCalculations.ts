export interface HoursCalcResult {
  cantidadHoras: number;
  horasExtraDiurna: number;
  horasExtraNocturna: number;
  recargosDominicalFestivo: number;
}

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
  const endMin = endMinRaw <= startMin ? endMinRaw + 24 * 60 : endMinRaw;
  const durMin = endMin - startMin;

  const diurnaStart = config.diurnaStart ?? 6;
  const diurnaEnd = config.diurnaEnd ?? 22;

  let minutosDiurnos = 0;
  let minutosNocturnos = 0;

  // Clasificación por minuto para evitar errores por acumulación de punto flotante.
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

  // Se considera día especial si es Domingo o Festivo
  const esDominicalOFestivo = diaSemana === 0 || isHoliday;
  
  return {
    cantidadHoras: Math.round(dur * 100) / 100,
    horasExtraDiurna: Math.round(hDiurna * 100) / 100,
    horasExtraNocturna: Math.round(hNocturna * 100) / 100,
    recargosDominicalFestivo: esDominicalOFestivo ? 1 : 0,
  };
};

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
  const diurnaRec = recargosDominicalFestivo ? r.DOMINICAL_DIURNA : r.DIURNA;
  const nocturnaRec = recargosDominicalFestivo ? r.DOMINICAL_NOCTURNA : r.NOCTURNA;
  return Math.round((horasExtraDiurna * valorHora * diurnaRec + horasExtraNocturna * valorHora * nocturnaRec) * 100) / 100;
};
