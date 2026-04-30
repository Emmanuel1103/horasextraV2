/**
 * requestWorkflow.ts — motor de estados y gestión de flujo de aprobación
 *
 * define las reglas de transición entre estados (pendiente, en revisión, etc.)
 * y la lógica para reconciliar los aprobadores necesarios según los centros
 * de costo involucrados en una solicitud.
 */

import type { UnidadConfig } from "../system-config/system-config.model";
import type { ApproverInfo, RequestEntity } from "./requests.repository";

export type RequestState = RequestEntity["estado"];
export type WorkflowAction =
  | "REQUEST_REVIEW"
  | "REVIEW_COMPLETED"
  | "APPROVE_ALL"
  | "FINAL_APPROVE"
  | "REJECT"
  | "CANCEL";

// mapa de transiciones válidas para el ciclo de vida de una solicitud
const TRANSITIONS: Record<RequestState, Partial<Record<WorkflowAction, RequestState>>> = {
  pendiente: {
    REQUEST_REVIEW: "en_revision",
    APPROVE_ALL: "pendiente_nomina",
    REJECT: "rechazado",
    CANCEL: "cancelado",
  },
  en_revision: {
    REVIEW_COMPLETED: "pendiente",
    REJECT: "rechazado",
    CANCEL: "cancelado",
  },
  pendiente_nomina: {
    FINAL_APPROVE: "aprobado",
    REJECT: "rechazado",
    CANCEL: "cancelado",
  },
  aprobado: {},
  rechazado: {},
  cancelado: {},
};

/**
 * transiciona el estado de una solicitud basándose en una acción.
 * @throws {Error} si la transición no está permitida.
 */
export const transitionState = (current: RequestState, action: WorkflowAction): RequestState => {
  const next = TRANSITIONS[current]?.[action];
  if (!next) {
    throw new Error(`transición no permitida: ${current} -> ${action}`);
  }
  return next;
};

const approverKey = (email: string, ceco: string) => `${email.toLowerCase()}|${ceco}`;

const normalizeCecos = (cecos?: string[]) =>
  Array.from(new Set((cecos || []).map((cc) => String(cc || "").trim()).filter(Boolean))).sort();

const generateToken = () => `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;

export interface ReconcileApproversResult {
  approvers: ApproverInfo[];
  added: Array<{ email: string; ceco: string }>;
  removed: Array<{ email: string; ceco: string }>;
}

interface ReconcileApproversParams {
  existingApprovers: ApproverInfo[];
  targetCecos: string[];
  unidades: UnidadConfig[];
}

/**
 * sincroniza la lista de aprobadores de una solicitud con la configuración actual
 * de las unidades de negocio y los centros de costo involucrados.
 */
export const reconcileApproversByCeco = ({
  existingApprovers,
  targetCecos,
  unidades,
}: ReconcileApproversParams): ReconcileApproversResult => {
  const target = normalizeCecos(targetCecos);

  const existingByKey = new Map<string, ApproverInfo>();
  existingApprovers.forEach((a) => {
    const email = String(a.email || "").trim().toLowerCase();
    normalizeCecos(a.centrosCosto).forEach((cc) => {
      existingByKey.set(approverKey(email, cc), a);
    });
  });

  const nextApprovers: ApproverInfo[] = [];
  const added: Array<{ email: string; ceco: string }> = [];
  const seen = new Set<string>();

  (unidades || []).forEach((unidad) => {
    const email = String(unidad?.director?.email || "").trim().toLowerCase();
    if (!email) return;

    (unidad.centrosCosto || [])
      .map((cc) => String(cc?.numero || "").trim())
      .filter((cc) => cc && target.includes(cc))
      .forEach((cc) => {
        const key = approverKey(email, cc);
        if (seen.has(key)) return;
        seen.add(key);

        const previous = existingByKey.get(key);
        if (!previous) {
          added.push({ email, ceco: cc });
        }

        nextApprovers.push({
          email,
          name: unidad?.director?.nombre || previous?.name || email,
          estado: "pendiente" as const,
          token: previous?.token || generateToken(),
          centrosCosto: [cc],
          fechaAprobacion: undefined,
          motivoRechazo: undefined,
          motivoRevision: undefined,
          fechaRevisionSolicitada: undefined,
          fechaRevisionCompletada: undefined,
        });
      });
  });

  // fallback: si no hay directores configurados, conserva lo existente que sea relevante
  const resolvedApprovers = nextApprovers.length > 0
    ? nextApprovers
    : existingApprovers
        .filter((a) => normalizeCecos(a.centrosCosto).some((cc) => target.includes(cc)))
        .map((a) => ({
          ...a,
          estado: "pendiente" as const,
          fechaAprobacion: undefined,
          motivoRechazo: undefined,
          motivoRevision: undefined,
          fechaRevisionSolicitada: undefined,
          fechaRevisionCompletada: undefined,
        }));

  const nextKeys = new Set<string>();
  resolvedApprovers.forEach((a) => {
    const email = String(a.email || "").trim().toLowerCase();
    normalizeCecos(a.centrosCosto).forEach((cc) => {
      nextKeys.add(approverKey(email, cc));
    });
  });

  const removed: Array<{ email: string; ceco: string }> = [];
  existingByKey.forEach((_approver, key) => {
    if (nextKeys.has(key)) return;
    const [email, ceco] = key.split("|");
    if (email && ceco) {
      removed.push({ email, ceco });
    }
  });

  return {
    approvers: resolvedApprovers,
    added,
    removed,
  };
};

