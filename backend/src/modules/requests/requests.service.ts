import { RequestsRepository, RequestEntity, ApproverInfo, CentroCostoItem } from "./requests.repository";
import { calculateOvertimeHours, calculateOvertimeValue } from "../../services/overtimeCalculations";
import { overtimeFormSubmitSchema, type OvertimeFormSubmit, type DateEntry, type HorariosConfig } from "./requests.schemas";
import { getConfig } from "../system-config/system-config.service";
import { sendRequestEmail, sendDecisionEmail, sendForReviewEmail, sendReviewedEmail, sendApprovalRemovedEmail } from "../../services/email.service";
import { logger } from "../../utils/logger";
import { getBogotaTimestamp, getDayOfWeekFromDateValue, toBogotaDateStartTimestamp } from "../../utils/datetime";
import { getAllUsers } from "../users/users.service";
import { reconcileApproversByCeco, transitionState } from "./requestWorkflow";

const repo = new RequestsRepository();

/**
 * Crea una solicitud de horas extras que puede contener múltiples fechas
 */
export const createRequest = async (formData: any): Promise<RequestEntity[]> => {
  // Validar datos del formulario
  const validated = overtimeFormSubmitSchema.parse(formData);

  const {
    nombre,
    email,
    cedula,
    cargo,
    salario = 0,
    dateEntries,
    horariosConfig,
    approvers: inputApprovers = [],
    approvalMessageHtml
  } = validated;

  // Obtener configuración del sistema para resolver aprobadores, festivos y envío de correos.
  let systemConfig: any;
  try {
    systemConfig = await getConfig();
  } catch (error) {
    logger.error("Error fetching system config:", error);
  }

  const holidays = systemConfig?.holidays || [];

  // 1. Procesar cada entrada de fecha para realizar cálculos individuales
  const processedEntries = dateEntries.map(entry => {
    // Calcular día de la semana
    let diaSemanaNumero: number;
    if (typeof entry.diaSemana === "number") {
      diaSemanaNumero = entry.diaSemana;
    } else if (typeof entry.diaSemana === "string") {
      const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
      diaSemanaNumero = dias.indexOf(entry.diaSemana.toLowerCase());
      if (diaSemanaNumero === -1) {
        diaSemanaNumero = getDayOfWeekFromDateValue(entry.fecha as any);
      }
    } else {
      diaSemanaNumero = getDayOfWeekFromDateValue(entry.fecha as any);
    }

    // Verificar si la fecha es festivo (comparando solo YYYY-MM-DD)
    const fechaDate = new Date(entry.fecha);
    const fechaStr = fechaDate.toISOString().split('T')[0];
    const isHoliday = (systemConfig?.holidays || []).some((h: any) => {
      const hDate = typeof h.date === 'string' ? h.date.split('T')[0] : h.date;
      return hDate === fechaStr;
    });

    const horariosCalc = horariosConfig ? {
      diurnaStart: horariosConfig.diarnaStart,
      diurnaEnd: horariosConfig.diarnaEnd,
      nocturnaStart: horariosConfig.nocturnaStart,
      nocturnaEnd: horariosConfig.nocturnaEnd,
    } : undefined;

    const calc = calculateOvertimeHours(
      entry.horaInicio,
      entry.horaFinal,
      diaSemanaNumero,
      horariosCalc,
      isHoliday
    );

    if (calc.cantidadHoras <= 0) {
      throw new Error(`Horas inválidas para la fecha ${entry.fecha}`);
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

  // 2. Extraer todos los centros de costo involucrados únicos
  const uniqueCCs = new Set<string>();
  processedEntries.forEach(entry => {
    entry.centroCosto.forEach(cc => {
      if (cc.numero) uniqueCCs.add(cc.numero.trim());
    });
  });

  // 3. Preparar aprobadores vinculando centros de costo únicos de la solicitud.
  // Regla solicitada: 1 entrada por combinación director + centro de costo, cada una con token único.
  let approvers: ApproverInfo[] = [];
  const approverByEmailAndCeco = new Map<string, { email: string; name: string; ceco: string }>();

  const upsertApproverByCeco = (emailRaw: string, nameRaw: string | undefined, cecosRaw: string[]) => {
    const email = String(emailRaw || "").trim().toLowerCase();
    if (!email) return;

    const normalizedCecos = cecosRaw
      .map((cc) => String(cc || "").trim())
      .filter((cc) => cc && uniqueCCs.has(cc));

    normalizedCecos.forEach((ceco) => {
      const key = `${email}|${ceco}`;
      if (approverByEmailAndCeco.has(key)) return;

      approverByEmailAndCeco.set(key, {
        email,
        name: nameRaw || email,
        ceco,
      });
    });
  };

  if (systemConfig?.unidades?.length) {
    const uniqueCcList = Array.from(uniqueCCs);

    systemConfig.unidades.forEach((unidad: any) => {
      const directorEmail = String(unidad?.director?.email || "").trim().toLowerCase();
      if (!directorEmail) return;

      const matchedCecos = (unidad.centrosCosto || [])
        .map((cc: any) => String(cc?.numero || "").trim())
        .filter((numero: string) => numero && uniqueCcList.includes(numero));

      upsertApproverByCeco(directorEmail, unidad?.director?.nombre, matchedCecos);
    });
  }

  // Merge con aprobadores enviados por frontend como respaldo para no perder CeCos/directores.
  if (inputApprovers && inputApprovers.length > 0) {
    inputApprovers.forEach((a: any) => {
      upsertApproverByCeco(a?.email, a?.name, a?.centrosCosto || []);
    });
  }

  approvers = Array.from(approverByEmailAndCeco.values()).map((a) => ({
    email: a.email,
    name: a.name,
    estado: "pendiente",
    token: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`,
    centrosCosto: [a.ceco],
  }));

  // 4. Totales acumulados para la solicitud principal
  const totales = {
    cantidadHoras: processedEntries.reduce((acc, curr) => acc + curr.cantidadHoras, 0),
    horasExtraDiurna: processedEntries.reduce((acc, curr) => acc + curr.horasExtraDiurna, 0),
    horasExtraNocturna: processedEntries.reduce((acc, curr) => acc + curr.horasExtraNocturna, 0),
    recargosDominicalFestivo: processedEntries.reduce((acc, curr) => acc + curr.recargosDominicalFestivo, 0),
    valorTotal: processedEntries.reduce((acc, curr) => acc + curr.valorHorasExtra, 0),
    centrosCostoInvolucrados: Array.from(uniqueCCs)
  };

  // 5. Crear la solicitud única con la nueva estructura
  const requestData: Partial<RequestEntity> = {
    submissionId: Math.random().toString(36).substring(2, 11),
    empleado: {
      id: cedula || "unknown",
      nombre,
      email,
      cedula,
      cargo,
      salario,
    },
    totales,
    dateEntries: processedEntries as any,
    estado: approvers.length > 0 ? "pendiente" : "pendiente_nomina",
    approvers: approvers.length > 0 ? approvers : undefined,
    approvalMessageHtml,
  };

  const created = await repo.createNew(requestData);
  
  if (created && systemConfig && created.estado === "pendiente") {
    sendRequestEmail(created, systemConfig).catch(err =>
      logger.error(`Error sending email for request ${created.id}:`, err)
    );
  }

  return created ? [created] : [];
};

/**
 * Crea una solicitud individual (método legacy para compatibilidad)
 */
export const createSingleRequest = async (data: Partial<RequestEntity>) => {
  const calc = calculateOvertimeHours(
    data.horaInicio || "00:00",
    data.horaFinal || "00:00",
    Number(data.diaSemana || 0)
  );
  if (calc.cantidadHoras <= 0) throw new Error("Horas inválidas");
  const valor = calculateOvertimeValue(
    data.salario || 0,
    calc.horasExtraDiurna,
    calc.horasExtraNocturna,
    calc.recargosDominicalFestivo
  );
  return repo.createNew({ ...data, ...calc, valorHorasExtra: valor });
};

export const calculateRequestEntry = async (input: {
  fecha: string | Date;
  horaInicio: string;
  horaFinal: string;
  salario: number;
  horariosConfig?: {
    diarnaStart?: number;
    diarnaEnd?: number;
    nocturnaStart?: number;
    nocturnaEnd?: number;
  };
}) => {
  const systemConfig = await getConfig().catch(() => null as any);

  const fechaValue = toBogotaDateStartTimestamp(input.fecha as any);
  const fechaStr = new Date(fechaValue).toISOString().split("T")[0];
  const diaSemanaNumero = getDayOfWeekFromDateValue(fechaValue);

  const holidays = systemConfig?.holidays || [];
  const isHoliday = holidays.some((h: any) => {
    const hDate = h?.date instanceof Date
      ? h.date.toISOString().split("T")[0]
      : String(h?.date || "").split("T")[0];
    return hDate === fechaStr;
  });

  const effectiveSchedule = {
    diurnaStart: input.horariosConfig?.diarnaStart ?? systemConfig?.horarios?.diarnaStart ?? 6,
    diurnaEnd: input.horariosConfig?.diarnaEnd ?? systemConfig?.horarios?.diarnaEnd ?? 22,
    nocturnaStart: input.horariosConfig?.nocturnaStart ?? systemConfig?.horarios?.nocturnaStart ?? 22,
    nocturnaEnd: input.horariosConfig?.nocturnaEnd ?? systemConfig?.horarios?.nocturnaEnd ?? 6,
  };

  const calc = calculateOvertimeHours(
    input.horaInicio,
    input.horaFinal,
    diaSemanaNumero,
    effectiveSchedule,
    isHoliday
  );

  const valor = calculateOvertimeValue(
    Number(input.salario || 0),
    calc.horasExtraDiurna,
    calc.horasExtraNocturna,
    calc.recargosDominicalFestivo,
    systemConfig?.overtimeRates
  );

  return {
    ...calc,
    diaSemana: diaSemanaNumero,
    valorHorasExtra: valor,
    fecha: fechaValue,
  };
};

export const getRequests = async (estado?: string, q?: string, page = 1, pageSize = 20) => {
  let sql = "SELECT * FROM c WHERE true";
  const params: any[] = [];

  // Si el estado es "pendiente", en el dashboard de gestión a veces queremos ver tanto 
  // "pendiente" como "pendiente_nomina". Pero para mayor precisión, filtramos aquí.
  if (estado) {
    params.push({ name: "@estado", value: estado });
    sql += " AND c.estado = @estado";
  }

  if (q) {
    params.push({ name: "@q", value: `%${q}%` });
    sql += " AND (CONTAINS(c.nombre,@q) OR CONTAINS(c.cargo,@q) OR CONTAINS(c.motivo,@q))";
  }

  sql += " ORDER BY c.createdAt DESC"; // Ordenar por fecha de creación desc
  sql += " OFFSET @offset LIMIT @limit";
  params.push({ name: "@offset", value: (page - 1) * pageSize });
  params.push({ name: "@limit", value: pageSize });

  const requests = await repo.query(sql, params);

  let systemConfig: any;
  try {
    systemConfig = await getConfig();
  } catch (error) {
    logger.error("Error obteniendo configuración para normalizar solicitudes:", error);
  }

  const holidays = systemConfig?.holidays || [];
  const rates = systemConfig?.overtimeRates;
  const horarios = systemConfig?.horarios || {};
  const horariosCalc = {
    diurnaStart: horarios?.diarnaStart ?? horarios?.diurnaStart ?? 6,
    diurnaEnd: horarios?.diarnaEnd ?? horarios?.diurnaEnd ?? 22,
    nocturnaStart: horarios?.nocturnaStart ?? 22,
    nocturnaEnd: horarios?.nocturnaEnd ?? 6,
  };

  const normalized = requests.map((req: any) => {
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

    const totalCantidadHoras = dateEntries.reduce((acc: number, e: any) => acc + Number(e?.cantidadHoras || 0), 0);
    const totalDiurnas = dateEntries.reduce((acc: number, e: any) => acc + Number(e?.horasExtraDiurna || 0), 0);
    const totalNocturnas = dateEntries.reduce((acc: number, e: any) => acc + Number(e?.horasExtraNocturna || 0), 0);
    const totalRecargos = dateEntries.reduce((acc: number, e: any) => acc + Number(e?.recargosDominicalFestivo || 0), 0);
    const totalValor = dateEntries.reduce((acc: number, e: any) => acc + Number(e?.valorHorasExtra || 0), 0);
    const cecosInvolucrados = Array.from(new Set(
      dateEntries.flatMap((e: any) => (e?.centroCosto || []).map((cc: any) => String(cc?.numero || cc || "").trim()).filter(Boolean))
    ));

    return {
      ...req,
      dateEntries,
      totales: {
        ...(req?.totales || {}),
        cantidadHoras: Math.round(totalCantidadHoras * 100) / 100,
        horasExtraDiurna: Math.round(totalDiurnas * 100) / 100,
        horasExtraNocturna: Math.round(totalNocturnas * 100) / 100,
        recargosDominicalFestivo: Math.round(totalRecargos * 100) / 100,
        valorTotal: Math.round(totalValor * 100) / 100,
        centrosCostoInvolucrados: cecosInvolucrados,
      },
      salario: safeSalary,
      valorHorasExtra: Math.round(totalValor * 100) / 100,
      cantidadHoras: Math.round(totalCantidadHoras * 100) / 100,
      horasExtraDiurna: Math.round(totalDiurnas * 100) / 100,
      horasExtraNocturna: Math.round(totalNocturnas * 100) / 100,
      recargosDominicalFestivo: Math.round(totalRecargos * 100) / 100,
    };
  });

  return normalized;
};

export const updateRequest = async (id: string, updates: Partial<RequestEntity>) => {
  const existing = await repo.getById(id);
  if (!existing) throw new Error("Not found");

  const normalizeCecos = (value: any): string[] => {
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

  const areSameStringSets = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  };

  const normalizeCecoDistribution = (value: any): Array<{ numero: string; porcentaje: number | null }> => {
    if (!Array.isArray(value)) return [];

    const byNumero = new Map<string, number | null>();
    value.forEach((cc: any) => {
      const numero = String(cc?.numero || cc || "").trim();
      if (!numero) return;

      const porcentajeRaw = Number(cc?.porcentaje);
      const porcentaje = Number.isFinite(porcentajeRaw) ? porcentajeRaw : null;

      // Si existe un porcentaje numérico, priorizarlo sobre null.
      if (!byNumero.has(numero) || porcentaje !== null) {
        byNumero.set(numero, porcentaje);
      }
    });

    return Array.from(byNumero.entries())
      .map(([numero, porcentaje]) => ({ numero, porcentaje }))
      .sort((a, b) => a.numero.localeCompare(b.numero));
  };

  const areSameCecoDistribution = (
    a: Array<{ numero: string; porcentaje: number | null }>,
    b: Array<{ numero: string; porcentaje: number | null }>
  ) => {
    if (a.length !== b.length) return false;
    return a.every((item, idx) => item.numero === b[idx].numero && item.porcentaje === b[idx].porcentaje);
  };

  const getRequestCecos = (record: Partial<RequestEntity>) => {
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

    // Preferir datos operativos (dateEntries/centroCosto) y usar totales solo como respaldo.
    const preferred = [...fromDateEntries, ...fromCentroCosto].filter(Boolean);
    const source = preferred.length > 0 ? preferred : fromTotales;

    return normalizeCecos(source);
  };

  const normalizedUpdates = {
    ...updates,
    fecha: updates.fecha ? toBogotaDateStartTimestamp(updates.fecha as any) : updates.fecha,
  };

  const merged: RequestEntity = {
    ...existing,
    ...normalizedUpdates,
    empleado: {
      ...(existing.empleado || { id: existing.cedula || "unknown" }),
      ...((normalizedUpdates as any).empleado || {}),
    },
    updatedAt: getBogotaTimestamp(),
  };

  const hasSalaryUpdate =
    normalizedUpdates.salario !== undefined ||
    (normalizedUpdates as any).empleado?.salario !== undefined;
  const forceRecalculateTotals = (normalizedUpdates as any).recalculateTotals === true;
  const hasCecoUpdate = Array.isArray((normalizedUpdates as any).centroCosto);

  const existingSalary = Number(existing.empleado?.salario ?? existing.salario ?? 0);
  const incomingSalary = Number(
    (normalizedUpdates as any).empleado?.salario ?? normalizedUpdates.salario ?? existingSalary
  );
  const salaryChanged = hasSalaryUpdate && Number.isFinite(incomingSalary) && incomingSalary !== existingSalary;

  const existingCecos = getRequestCecos(existing);
  const incomingCecos = normalizeCecos((normalizedUpdates as any).centroCosto);
  const cecoChanged = incomingCecos.length > 0 && !areSameStringSets(incomingCecos, existingCecos);
  const removedCecosInUpdate = hasCecoUpdate
    ? existingCecos.filter((cc) => !incomingCecos.includes(cc))
    : [];

  if (hasCecoUpdate) {
    const removedCecos = removedCecosInUpdate;
    if (removedCecos.length > 0 && existing.estado === "en_revision") {
      const cecosEnRevision = new Set(
        (existing.approvers || [])
          .filter((a) => a.estado === "en_revision")
          .flatMap((a) => (a.centrosCosto || []).map((cc) => String(cc || "").trim()))
          .filter(Boolean)
      );

      const removedInReview = removedCecos.filter((cc) => cecosEnRevision.has(cc));
      if (removedInReview.length > 0) {
        throw new Error(`No se permite eliminar centros de costo en revisión (${removedInReview.join(", ")}).`);
      }
    }
  }

  const existingCecoDistribution = normalizeCecoDistribution(
    Array.isArray(existing.centroCosto)
      ? existing.centroCosto
      : existing.dateEntries?.[0]?.centroCosto
  );
  const incomingCecoDistribution = normalizeCecoDistribution((normalizedUpdates as any).centroCosto);
  const porcentajeChanged =
    incomingCecoDistribution.length > 0 && !areSameCecoDistribution(incomingCecoDistribution, existingCecoDistribution);

  let shouldResendApprovalFlow = false;
  let removedApproverNotifications: Array<{ email: string; cecos: string[] }> = [];
  let newApproversToNotify: ApproverInfo[] = [];

  const mergeRemovedApproverNotifications = (
    base: Array<{ email: string; cecos: string[] }>,
    additions: Array<{ email: string; cecos: string[] }>
  ) => {
    const byEmail = new Map<string, Set<string>>();

    [...base, ...additions].forEach((item) => {
      const email = String(item.email || "").trim().toLowerCase();
      if (!email) return;
      if (!byEmail.has(email)) {
        byEmail.set(email, new Set<string>());
      }
      (item.cecos || [])
        .map((cc) => String(cc || "").trim())
        .filter(Boolean)
        .forEach((cc) => byEmail.get(email)!.add(cc));
    });

    return Array.from(byEmail.entries()).map(([email, cecos]) => ({
      email,
      cecos: Array.from(cecos),
    }));
  };

  if (hasCecoUpdate) {
    const incomingCentroCosto = ((normalizedUpdates as any).centroCosto || [])
      .map((cc: any) => ({
        numero: String(cc?.numero || cc || "").trim(),
        porcentaje: cc?.porcentaje !== undefined ? Number(cc.porcentaje) : undefined,
      }))
      .filter((cc: any) => cc.numero);

    // Persistir el cambio de CeCo en cada fecha, ya que la UI lee dateEntries primero.
    if (Array.isArray(merged.dateEntries) && merged.dateEntries.length > 0) {
      merged.dateEntries = merged.dateEntries.map((entry: any) => ({
        ...entry,
        centroCosto: incomingCentroCosto.map((cc: any) => ({
          numero: cc.numero,
          porcentaje: cc.porcentaje,
        })),
      }));
    }

    merged.totales = {
      ...(merged.totales || {
        cantidadHoras: 0,
        horasExtraDiurna: 0,
        horasExtraNocturna: 0,
        recargosDominicalFestivo: 0,
        valorTotal: 0,
        centrosCostoInvolucrados: [],
      }),
      centrosCostoInvolucrados: Array.from(
        new Set(incomingCentroCosto.map((cc: any) => cc.numero).filter(Boolean))
      ),
    };

    // Compatibilidad legacy
    (merged as any).centroCosto = incomingCentroCosto;

    // Mantener consistencia: si se elimina un CeCo de la solicitud,
    // también se elimina ese CeCo de los aprobadores persistidos.
    // Si un aprobador queda sin CeCos asociados, se remueve del registro.
    const incomingCecoSet = new Set(incomingCecos);
    const currentApprovers = merged.approvers || existing.approvers || [];
    const cleanedApprovers = currentApprovers
      .map((approver) => {
        const normalizedApproverCecos = Array.from(
          new Set(
            (approver.centrosCosto || [])
              .map((cc) => String(cc || "").trim())
              .filter((cc) => cc && incomingCecoSet.has(cc))
          )
        ).sort();

        if (normalizedApproverCecos.length === 0) {
          return null;
        }

        return {
          ...approver,
          centrosCosto: normalizedApproverCecos,
        };
      })
      .filter((approver): approver is ApproverInfo => Boolean(approver));

    merged.approvers = cleanedApprovers.length > 0 ? cleanedApprovers : undefined;

    const addedCecos = incomingCecos.filter((cc) => !existingCecos.includes(cc));
    const shouldNotifyAddedCecos =
      addedCecos.length > 0 &&
      (normalizedUpdates as any).triggerReapproval !== true &&
      (existing.estado === "pendiente" || existing.estado === "en_revision");

    if (shouldNotifyAddedCecos) {
      try {
        const config = await getConfig();
        const mergedApprovers = [...(merged.approvers || existing.approvers || [])];
        const existingApproverKeys = new Set<string>();

        mergedApprovers.forEach((a) => {
          const email = String(a.email || "").trim().toLowerCase();
          (a.centrosCosto || []).map((cc) => String(cc || "").trim()).filter(Boolean).forEach((cc) => {
            existingApproverKeys.add(`${email}|${cc}`);
          });
        });

        (config?.unidades || []).forEach((unidad: any) => {
          const email = String(unidad?.director?.email || "").trim().toLowerCase();
          if (!email) return;

          (unidad.centrosCosto || [])
            .map((cc: any) => String(cc?.numero || "").trim())
            .filter((cc: string) => cc && addedCecos.includes(cc))
            .forEach((cc: string) => {
              const key = `${email}|${cc}`;
              if (existingApproverKeys.has(key)) return;

              const approver: ApproverInfo = {
                email,
                name: unidad?.director?.nombre || email,
                estado: "pendiente",
                token: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`,
                centrosCosto: [cc],
              };

              mergedApprovers.push(approver);
              newApproversToNotify.push(approver);
              existingApproverKeys.add(key);
            });
        });

        if (mergedApprovers.length > 0) {
          merged.approvers = mergedApprovers;
        }

        const coveredAddedCecos = new Set<string>();
        mergedApprovers.forEach((a) => {
          (a.centrosCosto || [])
            .map((cc) => String(cc || "").trim())
            .filter(Boolean)
            .forEach((cc) => {
              if (addedCecos.includes(cc)) {
                coveredAddedCecos.add(cc);
              }
            });
        });

        const unresolvedAddedCecos = addedCecos.filter((cc) => !coveredAddedCecos.has(cc));

        if (unresolvedAddedCecos.length > 0) {
          throw new Error(
            `No se encontró director configurado para los nuevos centros de costo (${unresolvedAddedCecos.join(", ")}). ` +
            `Configura esos centros en Unidades antes de guardar para poder notificar.`
          );
        }

        // Notificar SIEMPRE a los aprobadores asociados a los CeCo nuevos,
        // incluso cuando ya existían en el arreglo de aprobadores por datos previos.
        const notifyKeys = new Set<string>();
        newApproversToNotify = mergedApprovers.filter((a) => {
          const email = String(a.email || "").trim().toLowerCase();
          const relatedCecos = (a.centrosCosto || [])
            .map((cc) => String(cc || "").trim())
            .filter((cc) => cc && addedCecos.includes(cc));
          if (!email || relatedCecos.length === 0) return false;

          const key = `${email}|${relatedCecos.sort().join(",")}`;
          if (notifyKeys.has(key)) return false;
          notifyKeys.add(key);
          return true;
        });
      } catch (e) {
        logger.error("Error preparando notificación para nuevos centros de costo:", e);
        throw e;
      }
    }
  }

  // Notificar remoción de aprobación cuando se elimina CeCo y no estamos en flujo de revalidación explícita.
  if (
    hasCecoUpdate &&
    removedCecosInUpdate.length > 0 &&
    (normalizedUpdates as any).triggerReapproval !== true
  ) {
    const removedByEmail = new Map<string, Set<string>>();
    (existing.approvers || []).forEach((a) => {
      const email = String(a.email || "").trim().toLowerCase();
      if (!email) return;
      (a.centrosCosto || [])
        .map((cc) => String(cc || "").trim())
        .filter((cc) => cc && removedCecosInUpdate.includes(cc))
        .forEach((cc) => {
          if (!removedByEmail.has(email)) {
            removedByEmail.set(email, new Set<string>());
          }
          removedByEmail.get(email)!.add(cc);
        });
    });

    const removedList = Array.from(removedByEmail.entries()).map(([email, cecos]) => ({
      email,
      cecos: Array.from(cecos),
    }));

    removedApproverNotifications = mergeRemovedApproverNotifications(
      removedApproverNotifications,
      removedList
    );
  }

  if (hasSalaryUpdate || forceRecalculateTotals) {
    const salarioActualizado = Number(
      (normalizedUpdates as any).empleado?.salario ?? normalizedUpdates.salario ?? merged.empleado?.salario ?? 0
    );

    const salarioSeguro = Number.isFinite(salarioActualizado) ? salarioActualizado : 0;
    merged.empleado = {
      ...(merged.empleado || { id: existing.cedula || "unknown" }),
      salario: salarioSeguro,
    };
    // Compatibilidad con estructura legacy
    (merged as any).salario = salarioSeguro;

    if (Array.isArray(merged.dateEntries) && merged.dateEntries.length > 0) {
      let systemConfig: any;
      try {
        systemConfig = await getConfig();
      } catch (error) {
        logger.error("Error obteniendo configuración para recálculo:", error);
      }

      const holidays = systemConfig?.holidays || [];
      const horarios = systemConfig?.horarios || {};
      const horariosCalc = {
        diurnaStart: horarios?.diarnaStart ?? horarios?.diurnaStart,
        diurnaEnd: horarios?.diarnaEnd ?? horarios?.diurnaEnd,
        nocturnaStart: horarios?.nocturnaStart,
        nocturnaEnd: horarios?.nocturnaEnd,
      };

      merged.dateEntries = merged.dateEntries.map((entry: any) => {
        let diaSemanaNumero: number;
        if (typeof entry?.diaSemana === "number") {
          diaSemanaNumero = entry.diaSemana;
        } else if (typeof entry?.diaSemana === "string") {
          const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
          diaSemanaNumero = dias.indexOf(entry.diaSemana.toLowerCase());
          if (diaSemanaNumero === -1) {
            diaSemanaNumero = getDayOfWeekFromDateValue(entry.fecha as any);
          }
        } else {
          diaSemanaNumero = getDayOfWeekFromDateValue(entry.fecha as any);
        }

        const fechaStr = new Date(entry.fecha).toISOString().split("T")[0];
        const isHoliday = holidays.some((h: any) => {
          const hDate = h?.date instanceof Date
            ? h.date.toISOString().split("T")[0]
            : String(h?.date || "").split("T")[0];
          return hDate === fechaStr;
        });

        const calc = calculateOvertimeHours(
          entry?.horaInicio || "00:00",
          entry?.horaFinal || "00:00",
          diaSemanaNumero,
          horariosCalc,
          isHoliday
        );

        const valorRecalculado = calculateOvertimeValue(
          salarioSeguro,
          calc.horasExtraDiurna,
          calc.horasExtraNocturna,
          calc.recargosDominicalFestivo,
          systemConfig?.overtimeRates
        );

        return {
          ...entry,
          ...calc,
          diaSemana: diaSemanaNumero,
          valorHorasExtra: valorRecalculado,
        };
      });

      const totalCantidadHoras = merged.dateEntries.reduce((acc: number, e: any) => acc + Number(e?.cantidadHoras || 0), 0);
      const totalDiurnas = merged.dateEntries.reduce((acc: number, e: any) => acc + Number(e?.horasExtraDiurna || 0), 0);
      const totalNocturnas = merged.dateEntries.reduce((acc: number, e: any) => acc + Number(e?.horasExtraNocturna || 0), 0);
      const totalRecargos = merged.dateEntries.reduce((acc: number, e: any) => acc + Number(e?.recargosDominicalFestivo || 0), 0);
      const totalValor = merged.dateEntries.reduce((acc: number, e: any) => acc + Number(e?.valorHorasExtra || 0), 0);

      const cecosInvolucrados = Array.from(new Set(
        merged.dateEntries.flatMap((e: any) =>
          (e?.centroCosto || []).map((cc: any) => String(cc?.numero || cc || "").trim()).filter(Boolean)
        )
      ));

      merged.totales = {
        ...(merged.totales || {
          cantidadHoras: 0,
          horasExtraDiurna: 0,
          horasExtraNocturna: 0,
          recargosDominicalFestivo: 0,
          valorTotal: 0,
          centrosCostoInvolucrados: [],
        }),
        cantidadHoras: totalCantidadHoras,
        horasExtraDiurna: totalDiurnas,
        horasExtraNocturna: totalNocturnas,
        recargosDominicalFestivo: totalRecargos,
        valorTotal: totalValor,
        centrosCostoInvolucrados: cecosInvolucrados,
      };
      // Compatibilidad legacy para reportes que aún lean este campo
      (merged as any).valorHorasExtra = totalValor;
      (merged as any).cantidadHoras = totalCantidadHoras;
    }
  }

  // Normalizar estado después de ajustes de CeCo/aprobadores para evitar quedar en "pendiente"
  // cuando ya no hay aprobaciones por esperar.
  if (hasCecoUpdate && (normalizedUpdates as any).triggerReapproval !== true) {
    const currentApprovers = merged.approvers || [];
    const hasApprovers = currentApprovers.length > 0;
    const allApproversApproved = hasApprovers && currentApprovers.every((a) => a.estado === "aprobado");

    if (merged.estado === "pendiente" && (!hasApprovers || allApproversApproved)) {
      merged.estado = "pendiente_nomina";
    }
  }

  // Si hubo ajustes relevantes durante revisión, solo reiniciar flujo si se solicita explícitamente.
  // Esto evita enviar correos al dar "Guardar cambios" y deja ese disparo para "Marcar revisado".
  if (
    existing.estado === "en_revision" &&
    (salaryChanged || cecoChanged || porcentajeChanged) &&
    (normalizedUpdates as any).triggerReapproval === true &&
    existing.approvers &&
    existing.approvers.length > 0
  ) {
    const targetCecos = incomingCecos.length > 0
      ? incomingCecos
      : normalizeCecos(merged.totales?.centrosCostoInvolucrados || existing.totales?.centrosCostoInvolucrados || []);

    try {
      const config = await getConfig();
      const reconciled = reconcileApproversByCeco({
        existingApprovers: existing.approvers || [],
        targetCecos,
        unidades: config?.unidades || [],
      });

      const removedByEmail = new Map<string, Set<string>>();
      reconciled.removed.forEach(({ email, ceco }) => {
        if (!removedByEmail.has(email)) {
          removedByEmail.set(email, new Set<string>());
        }
        removedByEmail.get(email)!.add(ceco);
      });

      const removedFromReapproval = Array.from(removedByEmail.entries()).map(([email, cecos]) => ({
        email,
        cecos: Array.from(cecos),
      }));

      removedApproverNotifications = mergeRemovedApproverNotifications(
        removedApproverNotifications,
        removedFromReapproval
      );

      merged.approvers = reconciled.approvers;
    } catch (e) {
      logger.error("Error reconstruyendo aprobadores para revalidación:", e);
      merged.approvers = (existing.approvers || []).map((a) => ({
        ...a,
        estado: "pendiente",
        fechaAprobacion: undefined,
        motivoRechazo: undefined,
        motivoRevision: undefined,
        fechaRevisionSolicitada: undefined,
        fechaRevisionCompletada: undefined,
      }));
      removedApproverNotifications = [];
    }

    merged.estado = "pendiente";
    merged.motivoRechazo = undefined;
    merged.motivoRevision = undefined;
    shouldResendApprovalFlow = true;
  }

  const updated = await repo.upsert(merged);

  if (updated && shouldResendApprovalFlow) {
    try {
      const config = await getConfig();
      if (config) {
        await sendRequestEmail(updated as RequestEntity, config, { useResendTemplate: true });
        for (const removed of removedApproverNotifications) {
          for (const ceco of removed.cecos || []) {
            await sendApprovalRemovedEmail(
              updated as RequestEntity,
              config,
              removed.email,
              [ceco],
              "Nómina"
            );
          }
        }
      }
    } catch (e) {
      logger.error("Error reenviando correos de aprobación tras cambios en revisión:", e);
    }
  }

  if (updated && !shouldResendApprovalFlow && removedApproverNotifications.length > 0) {
    try {
      const config = await getConfig();
      if (config) {
        for (const removed of removedApproverNotifications) {
          for (const ceco of removed.cecos || []) {
            await sendApprovalRemovedEmail(
              updated as RequestEntity,
              config,
              removed.email,
              [ceco],
              "Nómina"
            );
          }
        }
      }
    } catch (e) {
      logger.error("Error enviando aviso por aprobaciones removidas tras ajuste de CeCo:", e);
    }
  }

  if (updated && newApproversToNotify.length > 0) {
    try {
      const config = await getConfig();
      if (config) {
        logger.info(
          `[requests] Notificando nuevos CeCo para ${updated.id}. Aprobadores nuevos: ${newApproversToNotify
            .map((a) => `${a.email}(${(a.centrosCosto || []).join(",")})`)
            .join("; ")}`
        );
        await sendRequestEmail(
          { ...(updated as RequestEntity), approvers: newApproversToNotify },
          config
        );
      }
    } catch (e) {
      logger.error("Error enviando correos a nuevos centros de costo agregados:", e);
    }
  }

  // Enviar correo de decisión si el estado cambió a aprobado/rechazado final
  if (updated && (updated.estado === "aprobado" || updated.estado === "rechazado") && existing.estado !== updated.estado) {
    try {
      const config = await getConfig();
      if (config) {
        await sendDecisionEmail(updated as RequestEntity, config);
      }
    } catch (e) {
      logger.error("Error enviando email de decisión:", e);
    }
  }

  return updated;
};

export const approveRequest = async (id: string, approverEmail: string) => {
  const r = await repo.getById(id);
  if (!r) throw new Error("Not found");

  const oldEstado = r.estado;

  const isJefe = r.approvers?.some(a => a.email.toLowerCase() === approverEmail.toLowerCase());

  if (isJefe) {
    // Lógica de aprobación de Jefe
    r.approvers = r.approvers!.map(a =>
      a.email.toLowerCase() === approverEmail.toLowerCase()
        ? { ...a, estado: "aprobado", fechaAprobacion: getBogotaTimestamp() }
        : a
    );

    // Si todos los jefes aprobaron, pasa a revisión de nómina
    const allJefesApproved = r.approvers?.every(a => a.estado === "aprobado") ?? true;
    if (allJefesApproved) {
      r.estado = transitionState(r.estado, "APPROVE_ALL");
    }
  } else {
    // Lógica de aprobación de Admin/Nómina
    const allApproversApproved = (r.approvers || []).every((a) => a.estado === "aprobado");

    // Fallback defensivo: en algunos casos legacy el estado puede quedar en "pendiente"
    // aun cuando todos los aprobadores ya aprobaron.
    if (r.estado === "pendiente" && allApproversApproved) {
      r.estado = transitionState(r.estado, "APPROVE_ALL");
    }

    r.estado = transitionState(r.estado, "FINAL_APPROVE");
  }
  r.updatedAt = getBogotaTimestamp();

  const updated = await repo.upsert(r);

  // Enviar correo de decisión solo si el estado cambió a aprobado final
  if (updated && updated.estado === "aprobado" && oldEstado !== "aprobado") {
    try {
      const config = await getConfig();
      if (config) {
        await sendDecisionEmail(updated as RequestEntity, config);
      }
    } catch (e) {
      logger.error("Error enviando email de decisión:", e);
    }
  }

  return updated;
};

export const rejectRequest = async (id: string) => {
  const r = await repo.getById(id);
  if (!r) throw new Error("Not found");

  const oldEstado = r.estado;
  r.estado = transitionState(r.estado, "REJECT");
  r.updatedAt = getBogotaTimestamp();

  const updated = await repo.upsert(r);

  // Send decision email
  if (updated && oldEstado !== "rechazado") {
    try {
      const systemConfig = await getConfig();
      sendDecisionEmail(updated, systemConfig).catch(err => logger.error("Error sending decision email:", err));
    } catch (e) {
      logger.error("Error fetching config for email:", e);
    }
  }

  return updated;
};

/**
 * Busca una solicitud por token de aprobación
 */
export const getByToken = async (token: string): Promise<RequestEntity | null> => {
  const sql = "SELECT * FROM c WHERE EXISTS(SELECT VALUE a FROM a IN c.approvers WHERE a.token = @token)";
  const params = [{ name: "@token", value: token }];
  const results = await repo.query(sql, params);
  return results && results.length > 0 ? results[0] : null;
};

/**
 * Procesa la decisión de un aprobador por token
 */
export const approveByToken = async (token: string, decision: "aprobado" | "rechazado" | "revisar", motivo?: string) => {
  const r = await getByToken(token);
  if (!r || !r.approvers) throw new Error("Token no válido o solicitud no encontrada");

  const approver = r.approvers.find(a => a.token === token);
  if (!approver) throw new Error("Aprobador no encontrado en la solicitud");

  if (approver.estado !== "pendiente") {
    throw new Error(`Esta solicitud ya fue procesada como: ${approver.estado}`);
  }

  const motivoLimpio = String(motivo || "").trim();

  if (decision === "revisar") {
    if (!motivoLimpio) {
      throw new Error("El motivo de revisión es obligatorio");
    }

    approver.estado = "en_revision";
    approver.motivoRevision = motivoLimpio;
    approver.fechaRevisionSolicitada = getBogotaTimestamp();
    r.estado = transitionState(r.estado, "REQUEST_REVIEW");
    r.motivoRevision = motivoLimpio;
    r.updatedAt = getBogotaTimestamp();

    const updated = await repo.upsert(r);

    try {
      const config = await getConfig();
      const users = await getAllUsers();
      const nominaRecipients = users
        .filter((u) => u.role === "NOMINA" || u.role === "DEV")
        .map((u) => String(u.email || "").trim().toLowerCase())
        .filter(Boolean);

      if (config && nominaRecipients.length > 0) {
        await sendForReviewEmail(
          updated as RequestEntity,
          config,
          Array.from(new Set(nominaRecipients)),
          motivoLimpio,
          approver.name || approver.email,
          approver.email,
          approver.centrosCosto || []
        );
      }
    } catch (e) {
      logger.error("Error enviando notificación de revisión a nómina:", e);
    }

    return updated;
  }

  // Actualizar estado del aprobador
  approver.estado = decision;
  approver.fechaAprobacion = getBogotaTimestamp();
  
  if (decision === "rechazado") {
    approver.motivoRechazo = motivoLimpio || undefined;
    r.estado = transitionState(r.estado, "REJECT");
    r.motivoRechazo = motivoLimpio || `Rechazado por ${approver.name || approver.email}`;
  } else {
    approver.motivoRechazo = undefined;
    // Si aprobó, verificar si todos los demás aprobaron
    const allApproved = r.approvers.every(a => a.estado === "aprobado");
    if (allApproved) {
      r.estado = transitionState(r.estado, "APPROVE_ALL");
    }
  }

  r.updatedAt = getBogotaTimestamp();
  const updated = await repo.upsert(r);

  // No enviar correo de decisión desde aprobadores por token.
  // El correo final al colaborador se envía únicamente cuando nómina aprueba/rechaza.

  return updated;
};

export const markRequestAsReviewed = async (id: string, reviewedByEmail?: string, reviewedApproverSelector?: string) => {
  const r = await repo.getById(id);
  if (!r) throw new Error("Not found");
  if (!r.approvers || r.approvers.length === 0) throw new Error("La solicitud no tiene aprobadores");

  const inReviewApprovers = r.approvers.filter(a => a.estado === "en_revision");
  if (inReviewApprovers.length === 0) {
    // Si ya quedó en pendiente por una revalidación previa, no romper el flujo en frontend.
    if (r.estado === "pendiente") {
      return r;
    }
    throw new Error("La solicitud no está en estado de revisión");
  }

  if (inReviewApprovers.length > 1 && !reviewedApproverSelector) {
    throw new Error("Debes seleccionar el centro de costo/aprobador a marcar como revisado");
  }

  const getApproverSelector = (a: any) => {
    const email = String(a?.email || "").trim().toLowerCase();
    const cecoKey = (a?.centrosCosto || [])
      .map((cc: any) => String(cc || "").trim())
      .filter(Boolean)
      .sort()
      .join(",");
    return a?.token || `${email}|${cecoKey}`;
  };

  const approversToReview = reviewedApproverSelector
    ? inReviewApprovers.filter(a => getApproverSelector(a) === reviewedApproverSelector)
    : inReviewApprovers;

  if (approversToReview.length === 0) {
    throw new Error("No se encontró el aprobador en revisión seleccionado");
  }

  const approversToReviewKeys = new Set(
    approversToReview.map((a) => {
      const cecoKey = (a.centrosCosto || []).map((cc) => String(cc || "").trim()).filter(Boolean).sort().join(",");
      return a.token || `${String(a.email || "").toLowerCase()}|${cecoKey}`;
    })
  );

  const now = getBogotaTimestamp();
  r.approvers = r.approvers.map(a =>
    approversToReviewKeys.has(
      a.token || `${String(a.email || "").toLowerCase()}|${(a.centrosCosto || []).map((cc) => String(cc || "").trim()).filter(Boolean).sort().join(",")}`
    )
      ? {
          ...a,
          estado: "pendiente",
          fechaRevisionCompletada: now,
        }
      : a
  );

  const stillInReview = r.approvers.some(a => a.estado === "en_revision");

  // Si ya no quedan aprobadores en revisión, quienes habían aprobado deben volver a aprobar
  // para validar los cambios realizados por nómina.
  if (!stillInReview) {
    r.approvers = r.approvers.map((a) =>
      a.estado === "aprobado"
        ? {
            ...a,
            estado: "pendiente",
            fechaAprobacion: undefined,
          }
        : a
    );
  }

  r.estado = stillInReview ? "en_revision" : transitionState(r.estado, "REVIEW_COMPLETED");
  r.updatedAt = now;

  const updated = await repo.upsert(r);

  try {
    const config = await getConfig();
    if (config) {
      for (const approver of approversToReview) {
        await sendReviewedEmail(
          updated as RequestEntity,
          config,
          {
            email: approver.email,
            token: approver.token,
            centrosCosto: approver.centrosCosto || [],
          },
          reviewedByEmail || "Nómina",
          approver.motivoRevision
        );
      }
    }
  } catch (e) {
    logger.error("Error enviando notificación de solicitud revisada:", e);
  }

  return updated;
};

/**
 * Obtiene estadísticas de las solicitudes de horas extras
 */
export const getEstadisticas = async () => {
  // Obtener todas las solicitudes (sin filtro de paginación)
  const allRequests = await repo.query("SELECT * FROM c");

  // Calcular estadísticas
  const pendientes = allRequests.filter(r => r.estado === "pendiente" || r.estado === "en_revision").length;
  const aprobadas = allRequests.filter(r => r.estado === "aprobado").length;
  const rechazadas = allRequests.filter(r => r.estado === "rechazado").length;

  // Calcular totales de horas y valores del mes actual
  const now = new Date();
  const mesActual = now.getMonth();
  const anioActual = now.getFullYear();

  const solicitudesMesActual = allRequests.filter(r => {
    const fechaStr = r.createdAt || r.fecha || new Date().toISOString();
    const fecha = new Date(fechaStr);
    return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
  });

  const totalHorasMes = solicitudesMesActual.reduce((sum, r) => sum + (r.totales?.cantidadHoras || r.cantidadHoras || 0), 0);
  const valorTotalMes = solicitudesMesActual.reduce((sum, r) => sum + (r.totales?.valorTotal || r.valorHorasExtra || 0), 0);

  // Calcular totales generales
  const totalHoras = allRequests.reduce((sum, r) => sum + (r.totales?.cantidadHoras || r.cantidadHoras || 0), 0);
  const valorTotal = allRequests.reduce((sum, r) => sum + (r.totales?.valorTotal || r.valorHorasExtra || 0), 0);

  return {
    resumen: {
      totalSolicitudes: allRequests.length,
      pendientes,
      aprobadas,
      rechazadas,
    },
    mesActual: {
      nombre: now.toLocaleString('es', { month: 'long', year: 'numeric' }),
      totalHoras: Math.round(totalHorasMes * 100) / 100,
      valorTotal: Math.round(valorTotalMes * 100) / 100,
      solicitudes: solicitudesMesActual.length,
    },
    general: {
      totalHoras: Math.round(totalHoras * 100) / 100,
      valorTotal: Math.round(valorTotal * 100) / 100,
    },
  };
};

export const resendApprovalEmail = async (requestId: string, approverEmail: string) => {
  const r = await repo.getById(requestId);
  if (!r) throw new Error("La solicitud no existe.");

  const approver = r.approvers?.find(a => a.email.toLowerCase() === approverEmail.toLowerCase());
  if (!approver) throw new Error("El aprobador no está asociado a esta solicitud.");
  if (approver.estado !== "pendiente") throw new Error(`El aprobador ya ha respondido (estado: ${approver.estado}).`);

  // Si no tiene token (solicitud antigua), generar uno y guardarlo
  if (!approver.token) {
    const approverIndex = r.approvers!.findIndex(a => a.email.toLowerCase() === approverEmail.toLowerCase());
    r.approvers![approverIndex].token = Math.random().toString(36).substring(2, 9);
    await repo.upsert(r);
    approver.token = r.approvers![approverIndex].token;
  }

  // Solo reenviar al aprobador específico: clonamos el record con solo ese aprobador
  const recordConUnAprobador = { ...r, approvers: [approver] };

  const { sendRequestEmail } = await import("../../services/email.service");
  const { getConfig } = await import("../system-config/system-config.service");
  const sysConfig = await getConfig();
  await sendRequestEmail(recordConUnAprobador, sysConfig, { useResendTemplate: true });

  return { success: true, message: `Correo reenviado a ${approverEmail}` };
};

