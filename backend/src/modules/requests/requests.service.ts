/**
 * requests.service.ts — orquestación de la lógica de negocio para solicitudes
 *
 * este archivo centraliza la comunicación entre los procesadores, las acciones
 * y el repositorio de datos.
 */

import { RequestsRepository, RequestEntity, ApproverInfo } from "./requests.repository";
import { overtimeFormSubmitSchema } from "./requests.schemas";
import { getConfig } from "../system-config/system-config.service";
import { sendRequestEmail, sendDecisionEmail } from "../../services/email.service";
import { logger } from "../../utils/logger";
import { getBogotaTimestamp, toBogotaDateStartTimestamp } from "../../utils/datetime";
import { transitionState } from "./requestWorkflow";
import { processDateEntries, calculateTotals, resolveApprovers, normalizeRequestList } from "./requests.processor";
import { 
  getRequestCecos, 
  areSameStringSets, 
  normalizeCecoDistribution, 
  areSameCecoDistribution,
  normalizeCecos 
} from "./requests.helpers";

const repo = new RequestsRepository();

// Re-exportar acciones transaccionales para que el controlador siga usando este servicio como punto de entrada
export * from "./requests.actions";

/**
 * crea una nueva solicitud de horas extras procesando múltiples fechas y asignando aprobadores.
 */
export const createRequest = async (formData: any): Promise<RequestEntity[]> => {
  const validated = overtimeFormSubmitSchema.parse(formData);
  const {
    nombre, email, cedula, cargo, salario = 0,
    dateEntries, horariosConfig, approvers: inputApprovers = [],
    approvalMessageHtml
  } = validated;

  let systemConfig: any;
  try {
    systemConfig = await getConfig();
  } catch (error) {
    logger.error("error obteniendo configuración:", error);
  }

  const processedEntries = processDateEntries(dateEntries, salario, systemConfig, horariosConfig);
  const totales = calculateTotals(processedEntries);
  const uniqueCCs = new Set(totales.centrosCostoInvolucrados);
  const approvers = resolveApprovers(uniqueCCs, systemConfig, inputApprovers);

  const requestData: Partial<RequestEntity> = {
    submissionId: Math.random().toString(36).substring(2, 11),
    empleado: { id: cedula || "unknown", nombre, email, cedula, cargo, salario },
    totales,
    dateEntries: processedEntries as any,
    estado: approvers.length > 0 ? "pendiente" : "pendiente_nomina",
    approvers: approvers.length > 0 ? approvers : undefined,
    approvalMessageHtml,
  };

  const created = await repo.createNew(requestData);
  
  if (created && systemConfig && created.estado === "pendiente") {
    sendRequestEmail(created, systemConfig).catch(err =>
      logger.error(`error enviando correo para solicitud ${created.id}:`, err)
    );
  }

  return created ? [created] : [];
};

/**
 * obtiene el listado de solicitudes filtrado por estado o búsqueda textual.
 */
export const getRequests = async (estado?: string, q?: string, page = 1, pageSize = 20) => {
  let sql = "SELECT * FROM c WHERE true";
  const params: any[] = [];

  if (estado) {
    params.push({ name: "@estado", value: estado });
    sql += " AND c.estado = @estado";
  }

  if (q) {
    params.push({ name: "@q", value: `%${q}%` });
    sql += " AND (CONTAINS(c.nombre,@q) OR CONTAINS(c.cargo,@q) OR CONTAINS(c.motivo,@q))";
  }

  sql += " ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit";
  params.push({ name: "@offset", value: (page - 1) * pageSize });
  params.push({ name: "@limit", value: pageSize });

  const requests = await repo.query(sql, params);
  const systemConfig = await getConfig().catch(() => null);

  return normalizeRequestList(requests, systemConfig);
};

/**
 * actualiza los datos de una solicitud y sincroniza cambios en centros de costo o salario.
 */
export const updateRequest = async (id: string, updates: Partial<RequestEntity>) => {
  const existing = await repo.getById(id);
  if (!existing) throw new Error("not found");

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

  const hasCecoUpdate = Array.isArray((normalizedUpdates as any).centroCosto);
  const existingCecos = getRequestCecos(existing);
  const incomingCecos = normalizeCecos((normalizedUpdates as any).centroCosto);

  if (hasCecoUpdate) {
    const removedCecos = existingCecos.filter((cc) => !incomingCecos.includes(cc));
    if (removedCecos.length > 0 && existing.estado === "en_revision") {
      const cecosEnRevision = new Set(
        (existing.approvers || [])
          .filter((a) => a.estado === "en_revision")
          .flatMap((a) => (a.centrosCosto || []).map((cc) => String(cc || "").trim()))
          .filter(Boolean)
      );
      if (removedCecos.some((cc) => cecosEnRevision.has(cc))) {
        throw new Error("no se permite eliminar centros de costo en revisión.");
      }
    }

    const incomingCentroCosto = ((normalizedUpdates as any).centroCosto || [])
      .map((cc: any) => ({
        numero: String(cc?.numero || cc || "").trim(),
        porcentaje: cc?.porcentaje !== undefined ? Number(cc.porcentaje) : undefined,
      }))
      .filter((cc: any) => cc.numero);

    if (Array.isArray(merged.dateEntries) && merged.dateEntries.length > 0) {
      merged.dateEntries = merged.dateEntries.map((entry: any) => ({
        ...entry,
        centroCosto: incomingCentroCosto.map((cc: any) => ({ numero: cc.numero, porcentaje: cc.porcentaje })),
      }));
    }

    merged.totales = { ...(merged.totales || {}), ...calculateTotals(merged.dateEntries || []) };
    (merged as any).centroCosto = incomingCentroCosto;

    const incomingCecoSet = new Set(incomingCecos);
    const finalApprovers: ApproverInfo[] = [];
    const sourceApprovers = merged.approvers || existing.approvers || [];
    for (const approver of sourceApprovers) {
      const normalizedCecos = (approver.centrosCosto || []).filter((cc) => incomingCecoSet.has(cc));
      if (normalizedCecos.length > 0) {
        finalApprovers.push({ ...approver, centrosCosto: normalizedCecos });
      }
    }
    merged.approvers = finalApprovers.length > 0 ? finalApprovers : undefined;

    const addedCecos = incomingCecos.filter((cc) => !existingCecos.includes(cc));
    if (addedCecos.length > 0 && (existing.estado === "pendiente" || existing.estado === "en_revision")) {
      try {
        const config = await getConfig();
        const mergedApprovers = [...(merged.approvers || [])];
        const existingKeys = new Set(mergedApprovers.flatMap(a => (a.centrosCosto || []).map(cc => `${a.email}|${cc}`)));

        let newApproversToNotify: ApproverInfo[] = [];
        (config?.unidades || []).forEach((unidad: any) => {
          const email = String(unidad?.director?.email || "").trim().toLowerCase();
          if (!email) return;
          (unidad.centrosCosto || []).forEach((cc: any) => {
            const num = String(cc?.numero || "").trim();
            if (num && addedCecos.includes(num) && !existingKeys.has(`${email}|${num}`)) {
              const approver: ApproverInfo = {
                email, name: unidad?.director?.nombre || email, estado: "pendiente",
                token: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`, centrosCosto: [num],
              };
              mergedApprovers.push(approver);
              newApproversToNotify.push(approver);
              existingKeys.add(`${email}|${num}`);
            }
          });
        });
        merged.approvers = mergedApprovers;

        if (newApproversToNotify.length > 0) {
          await sendRequestEmail({ ...(merged as RequestEntity), approvers: newApproversToNotify }, config);
        }
      } catch (e) {
        logger.error("error sincronizando nuevos centros de costo:", e);
      }
    }
  }

  const removedApproverNotifications: Array<{ email: string; cecos: string[] }> = [];
  if (hasCecoUpdate) {
    const removedCecosInUpdate = existingCecos.filter((cc) => !incomingCecos.includes(cc));
    if (removedCecosInUpdate.length > 0) {
      const removedByEmail = new Map<string, Set<string>>();
      (existing.approvers || []).forEach((a) => {
        const email = String(a.email || "").trim().toLowerCase();
        (a.centrosCosto || []).filter((cc) => removedCecosInUpdate.includes(cc)).forEach((cc) => {
          if (!removedByEmail.has(email)) removedByEmail.set(email, new Set<string>());
          removedByEmail.get(email)!.add(cc);
        });
      });
      removedByEmail.forEach((cecos, email) => removedApproverNotifications.push({ email, cecos: Array.from(cecos) }));
    }
  }

  const updated = await repo.upsert(merged);

  if (updated && removedApproverNotifications.length > 0) {
    try {
      const config = await getConfig();
      const { sendApprovalRemovedEmail } = await import("../../services/email.service");
      for (const note of removedApproverNotifications) {
        await sendApprovalRemovedEmail(updated as RequestEntity, config, note.email, note.cecos).catch(() => null);
      }
    } catch (e) {
      logger.error("error enviando correos de remoción:", e);
    }
  }

  if (updated && (updated.estado === "aprobado" || updated.estado === "rechazado") && existing.estado !== updated.estado) {
    const config = await getConfig().catch(() => null);
    if (config) await sendDecisionEmail(updated as RequestEntity, config).catch(() => null);
  }

  return updated;
};



/**
 * obtiene estadísticas generales del sistema de solicitudes.
 */
export const getEstadisticas = async () => {
  const allRequests = await repo.query("SELECT * FROM c");
  const pendientes = allRequests.filter(r => r.estado === "pendiente" || r.estado === "en_revision").length;
  const aprobadas = allRequests.filter(r => r.estado === "aprobado").length;
  const rechazadas = allRequests.filter(r => r.estado === "rechazado").length;

  const now = new Date();
  const mesActual = now.getMonth();
  const anioActual = now.getFullYear();

  const solicitudesMes = allRequests.filter(r => {
    const fecha = new Date(r.createdAt || r.fecha || Date.now());
    return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
  });

  const totalHorasMes = solicitudesMes.reduce((sum, r) => sum + (r.totales?.cantidadHoras || 0), 0);
  const valorTotalMes = solicitudesMes.reduce((sum, r) => sum + (r.totales?.valorTotal || 0), 0);

  return {
    resumen: { totalSolicitudes: allRequests.length, pendientes, aprobadas, rechazadas },
    mesActual: {
      nombre: now.toLocaleString('es', { month: 'long', year: 'numeric' }),
      totalHoras: Math.round(totalHorasMes * 100) / 100,
      valorTotal: Math.round(valorTotalMes * 100) / 100,
      solicitudes: solicitudesMes.length,
    },
    general: {
      totalHoras: Math.round(allRequests.reduce((sum, r) => sum + (r.totales?.cantidadHoras || 0), 0) * 100) / 100,
      valorTotal: Math.round(allRequests.reduce((sum, r) => sum + (r.totales?.valorTotal || 0), 0) * 100) / 100,
    },
  };
};

/**
 * reenvía el correo de solicitud de aprobación a un director específico.
 */
export const resendApprovalEmail = async (requestId: string, approverEmail: string) => {
  const r = await repo.getById(requestId);
  if (!r) throw new Error("la solicitud no existe");

  const approver = r.approvers?.find(a => a.email.toLowerCase() === approverEmail.toLowerCase());
  if (!approver) throw new Error("aprobador no encontrado");
  if (approver.estado !== "pendiente") throw new Error(`el aprobador ya respondió: ${approver.estado}`);

  if (!approver.token) {
    approver.token = Math.random().toString(36).substring(2, 9);
    await repo.upsert(r);
  }

  const sysConfig = await getConfig().catch(() => null);
  if (sysConfig) {
    await sendRequestEmail({ ...r, approvers: [approver] }, sysConfig, { useResendTemplate: true });
  }

  return { success: true, message: `correo reenviado a ${approverEmail}` };
};
