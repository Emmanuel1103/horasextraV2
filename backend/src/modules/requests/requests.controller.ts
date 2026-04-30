/**
 * requests.controller.ts — controladores para el módulo de solicitudes
 *
 * define los puntos de entrada de la api para la gestión de horas extras.
 * incluye operaciones para crear, listar, actualizar, aprobar y rechazar solicitudes,
 * así como la lógica para la aprobación mediante enlaces públicos.
 */

import { Router } from "express";
import { authenticateJWT, requireRole } from "../../auth/jwtMiddleware";
import * as service from "./requests.service";
import { logger } from "../../utils/logger";

const router = Router();

/**
 * GET /api/requests
 * obtiene el listado de solicitudes con soporte para filtros por estado y búsqueda textual.
 */
router.get("/", /* authenticateJWT, */ async (req, res, next) => {
  try {
    const { estado, q, page } = req.query;
    const data = await service.getRequests(
      String(estado || ""),
      String(q || ""),
      Number(page || 1)
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/requests/estadisticas
 * retorna métricas consolidadas sobre el estado de las solicitudes.
 */
router.get("/estadisticas", /* authenticateJWT, */ async (req, res, next) => {
  try {
    logger.info("obteniendo estadísticas de solicitudes");
    const stats = await service.getEstadisticas();
    res.json(stats);
  } catch (err: any) {
    logger.error(`error al obtener estadísticas: ${err.message}`);
    next(err);
  }
});

/**
 * POST /api/requests
 * crea una nueva solicitud de horas extras (puede contener múltiples fechas).
 */
router.post("/", /* authenticateJWT, requireRole(["empleado","recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    logger.info(`creando solicitud de horas extras para: ${req.body.nombre || "n/a"}`);
    const created = await service.createRequest(req.body);
    
    res.status(201).json({
      success: true,
      message: `${created.length} solicitud(es) creada(s) exitosamente`,
      data: created,
      count: created.length,
    });
  } catch (err: any) {
    logger.error(`error al crear solicitud: ${err.message}`);
    next(err);
  }
});

/**
 * POST /api/requests/calculate
 * utilidad para calcular las horas y valores antes de enviar el formulario.
 */
router.post("/calculate", async (req, res, next) => {
  try {
    const { fecha, horaInicio, horaFinal, salario, horariosConfig } = req.body || {};

    if (!fecha || !horaInicio || !horaFinal) {
      return res.status(400).json({ error: "fecha, hora_inicio y hora_final son obligatorios" });
    }

    const result = await service.calculateRequestEntry({
      fecha,
      horaInicio,
      horaFinal,
      salario: Number(salario || 0),
      horariosConfig,
    });

    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

/**
 * PUT /api/requests/:id
 * actualiza los datos de una solicitud existente.
 */
router.put("/:id", /* authenticateJWT, requireRole(["recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    const updated = await service.updateRequest(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    const message = String(err?.message || "error al actualizar solicitud");
    if (/not found/i.test(message)) {
      return res.status(404).json({ error: message });
    }
    return res.status(400).json({ error: message });
  }
});

/**
 * POST /api/requests/:id/cancel
 * permite al usuario cancelar su propia solicitud.
 */
router.post("/:id/cancel", /* authenticateJWT, requireRole(["empleado","recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    const updated = await service.updateRequest(req.params.id, { estado: "cancelado" });
    res.json(updated);
  } catch (err) { next(err); }
});

/**
 * POST /api/requests/:id/approve
 * aprobación administrativa por parte de nómina o administradores.
 */
router.post("/:id/approve", /* authenticateJWT, requireRole(["recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    const approverEmail = String(req.body?.approverEmail || "nomina@system.local");
    const updated = await service.approveRequest(req.params.id, approverEmail);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "error al aprobar" });
  }
});

/**
 * POST /api/requests/:id/reject
 * rechazo de una solicitud con motivo opcional.
 */
router.post("/:id/reject", /* authenticateJWT, requireRole(["recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    const updated = await service.rejectRequest(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "error al rechazar" });
  }
});

/**
 * POST /api/requests/:id/mark-reviewed
 * marca la solicitud como revisada por el equipo de nómina.
 */
router.post("/:id/mark-reviewed", /* authenticateJWT, requireRole(["recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    const reviewedByEmail = String(req.body?.reviewedByEmail || "").trim();
    const reviewedApproverSelector =
      String(req.body?.reviewedApproverToken || req.body?.reviewedApproverSelector || "").trim() || undefined;
    const updated = await service.markRequestAsReviewed(req.params.id, reviewedByEmail, reviewedApproverSelector);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "error al marcar solicitud revisada" });
  }
});

/**
 * POST /api/requests/:id/resend-approval-email
 * reenvía el correo de notificación a un aprobador específico.
 */
router.post("/:id/resend-approval-email", /* authenticateJWT, requireRole(["recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    const approverEmail = String(req.body?.approverEmail || "").trim();
    if (!approverEmail) {
      return res.status(400).json({ error: "approver_email es obligatorio" });
    }

    const result = await service.resendApprovalEmail(req.params.id, approverEmail);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "error al reenviar correo" });
  }
});

/**
 * GET /api/requests/approve-by-link/:token
 * obtiene los detalles de la solicitud para un aprobador externo (vía link de correo).
 */
router.get("/approve-by-link/:token", async (req, res, next) => {
  try {
    const request = await service.getByToken(req.params.token);
    if (!request) {
      return res.status(404).json({ error: "token inválido o solicitud no encontrada" });
    }

    const approver = request.approvers?.find(a => a.token === req.params.token);
    const approverCecos = new Set(
      (approver?.centrosCosto || [])
        .map(cc => String(cc || "").trim())
        .filter(Boolean)
    );

    // solo mostramos las fechas que corresponden a los centros de costo del aprobador
    const filteredDateEntries = (request.dateEntries || []).filter((entry: any) => {
      if (approverCecos.size === 0) return true;
      const entryCecos = (entry.centroCosto || [])
        .map((cc: any) => String(cc?.numero || cc || "").trim())
        .filter(Boolean);
      return entryCecos.some((cc: string) => approverCecos.has(cc));
    });
    
    res.json({
      id: request.id,
      nombre: request.empleado?.nombre || request.nombre,
      cedula: request.empleado?.cedula || request.cedula,
      cargo: request.empleado?.cargo || request.cargo,
      dateEntries: filteredDateEntries,
      totales: request.totales,
      estadoAprobador: approver?.estado || "desconocido",
      nombreAprobador: approver?.name || approver?.email,
      approver: approver ? {
        name: approver.name || approver.email,
        email: approver.email || "",
        estado: approver.estado,
        centrosCosto: approver.centrosCosto || [],
      } : null
    });
  } catch (err) { next(err); }
});

/**
 * POST /api/requests/approve-by-link
 * procesa la decisión de aprobación o rechazo enviada desde el link público.
 */
router.post("/approve-by-link", async (req, res, next) => {
  try {
    const { token, decision, motivo } = req.body;
    if (!token || !decision) {
      return res.status(400).json({ error: "token y decisión son obligatorios" });
    }

    const updated = await service.approveByToken(token, decision, motivo);
    res.json({ success: true, estado: updated.estado });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

