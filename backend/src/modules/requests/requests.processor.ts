/**
 * requests.processor.ts — procesador de datos para solicitudes
 *
 * centraliza la lógica de cálculo, transformación y combinación de datos
 * para las operaciones de creación y actualización de solicitudes.
 */

import { RequestEntity, ApproverInfo, CentroCostoItem } from "./requests.repository";
import { calculateOvertimeHours, calculateOvertimeValue } from "../../services/overtimeCalculations";
import { getDayOfWeekFromDateValue, toBogotaDateStartTimestamp, getBogotaTimestamp } from "../../utils/datetime";
import { normalizeCecos } from "./requests.helpers";

/**
 * procesa una lista de entradas de fecha realizando los cálculos de horas y valores.
 */
export const processDateEntries = (
  dateEntries: any[],
  salario: number,
  systemConfig: any,
  horariosConfig?: any
) => {
  const holidays = systemConfig?.holidays || [];
  
  return dateEntries.map(entry => {
    // calcular día de la semana
    let diaSemanaNumero: number;
    if (typeof entry.diaSemana === "number") {
      diaSemanaNumero = entry.diaSemana;
    } else {
      diaSemanaNumero = getDayOfWeekFromDateValue(entry.fecha as any);
    }

    // verificar si la fecha es festivo
    const fechaDate = new Date(entry.fecha);
    const fechaStr = fechaDate.toISOString().split('T')[0];
    const isHoliday = holidays.some((h: any) => {
      const hDate = typeof h.date === 'string' ? h.date.split('T')[0] : h.date;
      return hDate === fechaStr;
    });

    const schedules = horariosConfig || systemConfig?.horarios;
    const horariosCalc = schedules ? {
      diurnaStart: schedules.diarnaStart ?? schedules.diurnaStart,
      diurnaEnd: schedules.diarnaEnd ?? schedules.diurnaEnd,
      nocturnaStart: schedules.nocturnaStart,
      nocturnaEnd: schedules.nocturnaEnd,
    } : undefined;

    const calc = calculateOvertimeHours(
      entry.horaInicio,
      entry.horaFinal,
      diaSemanaNumero,
      horariosCalc,
      isHoliday
    );

    if (calc.cantidadHoras <= 0) {
      throw new Error(`horas inválidas para la fecha ${entry.fecha}`);
    }

    const valor = calculateOvertimeValue(
      salario,
      calc.horasExtraDiurna,
      calc.horasExtraNocturna,
      calc.recargosDominicalFestivo,
      systemConfig?.overtimeRates
    );

    return {
      ...entry,
      ...calc,
      valorHorasExtra: valor,
      diaSemana: diaSemanaNumero,
      fecha: toBogotaDateStartTimestamp(entry.fecha as any)
    };
  });
};

/**
 * calcula los totales consolidados a partir de una lista de entradas procesadas.
 */
export const calculateTotals = (processedEntries: any[]) => {
  const uniqueCCs = new Set<string>();
  processedEntries.forEach(entry => {
    (entry.centroCosto || []).forEach((cc: any) => {
      const num = String(cc?.numero || cc || "").trim();
      if (num) uniqueCCs.add(num);
    });
  });

  return {
    cantidadHoras: Math.round(processedEntries.reduce((acc, curr) => acc + curr.cantidadHoras, 0) * 100) / 100,
    horasExtraDiurna: Math.round(processedEntries.reduce((acc, curr) => acc + curr.horasExtraDiurna, 0) * 100) / 100,
    horasExtraNocturna: Math.round(processedEntries.reduce((acc, curr) => acc + curr.horasExtraNocturna, 0) * 100) / 100,
    recargosDominicalFestivo: Math.round(processedEntries.reduce((acc, curr) => acc + curr.recargosDominicalFestivo, 0) * 100) / 100,
    valorTotal: Math.round(processedEntries.reduce((acc, curr) => acc + curr.valorHorasExtra, 0) * 100) / 100,
    centrosCostoInvolucrados: Array.from(uniqueCCs)
  };
};

/**
 * resuelve la lista de aprobadores basada en la configuración de unidades y centros de costo.
 */
export const resolveApprovers = (
  uniqueCecos: Set<string>,
  systemConfig: any,
  inputApprovers: any[] = []
): ApproverInfo[] => {
  const approverByEmailAndCeco = new Map<string, { email: string; name: string; ceco: string }>();

  const upsertApprover = (emailRaw: string, nameRaw: string | undefined, cecosRaw: string[]) => {
    const email = String(emailRaw || "").trim().toLowerCase();
    if (!email) return;

    cecosRaw
      .map(cc => String(cc || "").trim())
      .filter(cc => cc && uniqueCecos.has(cc))
      .forEach(ceco => {
        const key = `${email}|${ceco}`;
        if (!approverByEmailAndCeco.has(key)) {
          approverByEmailAndCeco.set(key, { email, name: nameRaw || email, ceco });
        }
      });
  };

  if (systemConfig?.unidades?.length) {
    const uniqueCcList = Array.from(uniqueCecos);
    systemConfig.unidades.forEach((unidad: any) => {
      const directorEmail = String(unidad?.director?.email || "").trim().toLowerCase();
      if (!directorEmail) return;

      const matchedCecos = (unidad.centrosCosto || [])
        .map((cc: any) => String(cc?.numero || "").trim())
        .filter((num: string) => num && uniqueCcList.includes(num));

      upsertApprover(directorEmail, unidad?.director?.nombre, matchedCecos);
    });
  }

  inputApprovers.forEach((a: any) => {
    upsertApprover(a?.email, a?.name, a?.centrosCosto || []);
  });

  return Array.from(approverByEmailAndCeco.values()).map(a => ({
    email: a.email,
    name: a.name,
    estado: "pendiente",
    token: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`,
    centrosCosto: [a.ceco],
  }));
};

/**
 * normaliza una lista de solicitudes obtenidas de la base de datos, recalculando totales si es necesario.
 */
export const normalizeRequestList = (requests: any[], systemConfig: any) => {
  const holidays = systemConfig?.holidays || [];
  const rates = systemConfig?.overtimeRates;
  const horarios = systemConfig?.horarios || {};
  const horariosCalc = {
    diurnaStart: horarios?.diarnaStart ?? horarios?.diurnaStart ?? 6,
    diurnaEnd: horarios?.diarnaEnd ?? horarios?.diurnaEnd ?? 22,
    nocturnaStart: horarios?.nocturnaStart ?? 22,
    nocturnaEnd: horarios?.nocturnaEnd ?? 6,
  };

  return requests.map((req: any) => {
    if (!Array.isArray(req?.dateEntries) || req.dateEntries.length === 0) {
      return req;
    }

    const salario = Number(req?.empleado?.salario ?? req?.salario ?? 0);
    const safeSalary = Number.isFinite(salario) ? salario : 0;

    const dateEntries = req.dateEntries.map((entry: any) => {
      const fecha = entry?.fecha || req?.fecha;
      const fechaStr = new Date(fecha).toISOString().split("T")[0];
      const diaSemana = getDayOfWeekFromDateValue(fecha as any);

      const isHoliday = holidays.some((h: any) => {
        const hDate = h?.date instanceof Date
          ? h.date.toISOString().split("T")[0]
          : String(h?.date || "").split("T")[0];
        return hDate === fechaStr;
      });

      const calc = calculateOvertimeHours(
        entry?.horaInicio || "00:00",
        entry?.horaFinal || "00:00",
        diaSemana,
        horariosCalc,
        isHoliday
      );

      const valor = calculateOvertimeValue(
        safeSalary,
        calc.horasExtraDiurna,
        calc.horasExtraNocturna,
        calc.recargosDominicalFestivo,
        rates
      );

      return {
        ...entry,
        ...calc,
        diaSemana,
        valorHorasExtra: valor,
      };
    });

    const totals = calculateTotals(dateEntries);

    return {
      ...req,
      dateEntries,
      totales: {
        ...(req?.totales || {}),
        ...totals,
      },
    };
  });
};
