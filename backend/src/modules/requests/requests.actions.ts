/**
 * requests.actions.ts — acciones transaccionales de solicitudes
 *
 * contiene las funciones que modifican el estado de las solicitudes, como
 * aprobaciones, rechazos y gestión de tokens.
 */

import { RequestsRepository, RequestEntity, ApproverInfo } from "./requests.repository";
import { transitionState } from "./requestWorkflow";
import { getBogotaTimestamp } from "../../utils/datetime";
import { getConfig } from "../system-config/system-config.service";
import { sendDecisionEmail, sendForReviewEmail, sendReviewedEmail } from "../../services/email.service";
import { logger } from "../../utils/logger";
import { getAllUsers } from "../users/users.service";

const repo = new RequestsRepository();

/**
 * procesa la aprobación de una solicitud por parte de un jefe o administrador.
 */
export const approveRequest = async (id: string, approverEmail: string) => {
  const r = await repo.getById(id);
  if (!r) throw new Error("solicitud no encontrada");

  const oldEstado = r.estado;
  const isJefe = r.approvers?.some(a => a.email.toLowerCase() === approverEmail.toLowerCase());

  if (isJefe) {
    r.approvers = r.approvers!.map(a =>
      a.email.toLowerCase() === approverEmail.toLowerCase()
        ? { ...a, estado: "aprobado", fechaAprobacion: getBogotaTimestamp() }
        : a
    );

    const allJefesApproved = r.approvers?.every(a => a.estado === "aprobado") ?? true;
    if (allJefesApproved) {
      r.estado = transitionState(r.estado, "APPROVE_ALL");
    }
  } else {
    const allApproversApproved = (r.approvers || []).every((a) => a.estado === "aprobado");
    if (r.estado === "pendiente" && allApproversApproved) {
      r.estado = transitionState(r.estado, "APPROVE_ALL");
    }
    r.estado = transitionState(r.estado, "FINAL_APPROVE");
  }

  r.updatedAt = getBogotaTimestamp();
  const updated = await repo.upsert(r);

  if (updated && updated.estado === "aprobado" && oldEstado !== "aprobado") {
    try {
      const config = await getConfig();
      if (config) await sendDecisionEmail(updated as RequestEntity, config);
    } catch (e) {
      logger.error("error enviando email de decisión:", e);
    }
  }

  return updated;
};

/**
 * rechaza una solicitud de forma global.
 */
export const rejectRequest = async (id: string) => {
  const r = await repo.getById(id);
  if (!r) throw new Error("solicitud no encontrada");

  const oldEstado = r.estado;
  r.estado = transitionState(r.estado, "REJECT");
  r.updatedAt = getBogotaTimestamp();

  const updated = await repo.upsert(r);

  if (updated && oldEstado !== "rechazado") {
    try {
      const systemConfig = await getConfig();
      sendDecisionEmail(updated, systemConfig).catch(err => logger.error("error enviando correo de decisión:", err));
    } catch (e) {
      logger.error("error obteniendo configuración para correo:", e);
    }
  }

  return updated;
};

/**
 * busca una solicitud mediante un token de aprobador.
 */
export const getByToken = async (token: string): Promise<RequestEntity | null> => {
  const sql = "SELECT * FROM c WHERE EXISTS(SELECT VALUE a FROM a IN c.approvers WHERE a.token = @token)";
  const params = [{ name: "@token", value: token }];
  const results = await repo.query(sql, params);
  return results && results.length > 0 ? results[0] : null;
};

/**
 * procesa la decisión (aprobación/rechazo/revisión) de un aprobador externo mediante token.
 */
export const approveByToken = async (token: string, decision: "aprobado" | "rechazado" | "revisar", motivo?: string) => {
  const r = await getByToken(token);
  if (!r || !r.approvers) throw new Error("token no válido o solicitud no encontrada");

  const approver = r.approvers.find(a => a.token === token);
  if (!approver) throw new Error("aprobador no encontrado en la solicitud");

  if (approver.estado !== "pendiente") {
    throw new Error(`esta solicitud ya fue procesada como: ${approver.estado}`);
  }

  const motivoLimpio = String(motivo || "").trim();

  if (decision === "revisar") {
    if (!motivoLimpio) throw new Error("el motivo de revisión es obligatorio");

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
      logger.error("error enviando notificación de revisión a nómina:", e);
    }

    return updated;
  }

  approver.estado = decision;
  approver.fechaAprobacion = getBogotaTimestamp();
  
  if (decision === "rechazado") {
    approver.motivoRechazo = motivoLimpio || undefined;
    r.estado = transitionState(r.estado, "REJECT");
    r.motivoRechazo = motivoLimpio || `rechazado por ${approver.name || approver.email}`;
  } else {
    approver.motivoRechazo = undefined;
    if (r.approvers.every(a => a.estado === "aprobado")) {
      r.estado = transitionState(r.estado, "APPROVE_ALL");
    }
  }

  r.updatedAt = getBogotaTimestamp();
  return repo.upsert(r);
};

/**
 * marca una solicitud como revisada por nómina, devolviéndola al flujo de aprobación.
 */
export const markRequestAsReviewed = async (id: string, reviewedByEmail?: string, reviewedApproverSelector?: string) => {
  const r = await repo.getById(id);
  if (!r) throw new Error("solicitud no encontrada");
  if (!r.approvers || r.approvers.length === 0) throw new Error("la solicitud no tiene aprobadores");

  const inReviewApprovers = r.approvers.filter(a => a.estado === "en_revision");
  if (inReviewApprovers.length === 0) {
    if (r.estado === "pendiente") return r;
    throw new Error("la solicitud no está en estado de revisión");
  }

  if (inReviewApprovers.length > 1 && !reviewedApproverSelector) {
    throw new Error("debes seleccionar el centro de costo a marcar como revisado");
  }

  const getApproverSelector = (a: any) => {
    const email = String(a?.email || "").trim().toLowerCase();
    const cecoKey = (a?.centrosCosto || []).map((cc: any) => String(cc || "").trim()).filter(Boolean).sort().join(",");
    return a?.token || `${email}|${cecoKey}`;
  };

  const approversToReview = reviewedApproverSelector
    ? inReviewApprovers.filter(a => getApproverSelector(a) === reviewedApproverSelector)
    : inReviewApprovers;

  if (approversToReview.length === 0) throw new Error("no se encontró el aprobador seleccionado");

  const now = getBogotaTimestamp();
  const approversToReviewTokens = new Set(approversToReview.map(a => a.token));

  r.approvers = r.approvers.map(a =>
    approversToReviewTokens.has(a.token)
      ? { ...a, estado: "pendiente", fechaRevisionCompletada: now }
      : a
  );

  const stillInReview = r.approvers.some(a => a.estado === "en_revision");
  if (!stillInReview) {
    r.approvers = r.approvers.map((a) =>
      a.estado === "aprobado" ? { ...a, estado: "pendiente", fechaAprobacion: undefined } : a
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
          { email: approver.email, token: approver.token, centrosCosto: approver.centrosCosto || [] },
          reviewedByEmail || "nómina",
          approver.motivoRevision
        );
      }
    }
  } catch (e) {
    logger.error("error enviando notificación de solicitud revisada:", e);
  }

  return updated;
};
