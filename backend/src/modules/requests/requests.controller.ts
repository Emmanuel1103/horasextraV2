import { Router } from "express";
import { authenticateJWT, requireRole } from "../../auth/jwtMiddleware";
import * as service from "./requests.service";
import { logger } from "../../utils/logger";

const router = Router();

// NOTA: Autenticación temporalmente deshabilitada para desarrollo
// En producción, descomentar authenticateJWT y requireRole

// GET /api/requests - Obtener todas las solicitudes con filtros
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

// GET /api/requests/estadisticas - Obtener estadísticas
router.get("/estadisticas", /* authenticateJWT, */ async (req, res, next) => {
  try {
    logger.info("📊 Obteniendo estadísticas...");
    const stats = await service.getEstadisticas();
    res.json(stats);
  } catch (err: any) {
    logger.error(`❌ Error al obtener estadísticas: ${err.message}`);
    next(err);
  }
});

// POST /api/requests - Crear solicitud(es) de horas extras
router.post("/", /* authenticateJWT, requireRole(["empleado","recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    logger.info(`📝 Creando solicitud de horas extras para: ${req.body.nombre || "N/A"}`);
    logger.debug(`   → ${req.body.dateEntries?.length || 0} fecha(s) a procesar`);

    // El servicio ahora retorna un array de solicitudes creadas
    const created = await service.createRequest(req.body);

    logger.info(`✅ ${created.length} solicitud(es) creada(s) exitosamente`);

    res.status(201).json({
      success: true,
      message: `${created.length} solicitud(es) creada(s) exitosamente`,
      data: created,
      count: created.length,
    });
  } catch (err: any) {
    logger.error(`❌ Error al crear solicitud: ${err.message}`);
    next(err);
  }
});

// POST /api/requests/calculate - Calcular horas/valor usando lógica central de backend
router.post("/calculate", async (req, res, next) => {
  try {
    const { fecha, horaInicio, horaFinal, salario, horariosConfig } = req.body || {};

    if (!fecha || !horaInicio || !horaFinal) {
      return res.status(400).json({ error: "fecha, horaInicio y horaFinal son obligatorios" });
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

// PUT /api/requests/:id - Actualizar solicitud
router.put("/:id", /* authenticateJWT, requireRole(["recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    const updated = await service.updateRequest(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    const message = String(err?.message || "Error al actualizar solicitud");
    if (/not found/i.test(message)) {
      return res.status(404).json({ error: message });
    }
    return res.status(400).json({ error: message });
  }
});

// POST /api/requests/:id/cancel - Cancelar solicitud
router.post("/:id/cancel", /* authenticateJWT, requireRole(["empleado","recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    const updated = await service.updateRequest(req.params.id, { estado: "cancelado" });
    res.json(updated);
  } catch (err) { next(err); }
});

// POST /api/requests/:id/approve - Aprobar solicitud (jefe o nómina)
router.post("/:id/approve", /* authenticateJWT, requireRole(["recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    const approverEmail = String(req.body?.approverEmail || "nomina@system.local");
    const updated = await service.approveRequest(req.params.id, approverEmail);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Error al aprobar" });
  }
});

// POST /api/requests/:id/reject - Rechazar solicitud
router.post("/:id/reject", /* authenticateJWT, requireRole(["recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    const updated = await service.rejectRequest(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Error al rechazar" });
  }
});

// POST /api/requests/:id/mark-reviewed - Marcar solicitud revisada por nómina
router.post("/:id/mark-reviewed", /* authenticateJWT, requireRole(["recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    const reviewedByEmail = String(req.body?.reviewedByEmail || "").trim();
    const reviewedApproverSelector =
      String(req.body?.reviewedApproverToken || req.body?.reviewedApproverSelector || "").trim() || undefined;
    const updated = await service.markRequestAsReviewed(req.params.id, reviewedByEmail, reviewedApproverSelector);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Error al marcar solicitud revisada" });
  }
});

// POST /api/requests/:id/resend-approval-email - Reenviar correo de aprobación a un aprobador pendiente
router.post("/:id/resend-approval-email", /* authenticateJWT, requireRole(["recursos_humanos","admin"]), */ async (req, res, next) => {
  try {
    const approverEmail = String(req.body?.approverEmail || "").trim();
    if (!approverEmail) {
      return res.status(400).json({ error: "approverEmail es obligatorio" });
    }

    const result = await service.resendApprovalEmail(req.params.id, approverEmail);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Error al reenviar correo" });
  }
});

// NUEVOS ENDPOINTS PÚBLICOS PARA APROBACIÓN POR LINK

// GET /api/requests/approve-by-link/:token - Obtener detalles básicos para el jefe
router.get("/approve-by-link/:token", async (req, res, next) => {
  try {
    const request = await service.getByToken(req.params.token);
    if (!request) {
      return res.status(404).json({ error: "Token inválido o solicitud no encontrada" });
    }

    // Retornamos solo lo necesario para la vista pública (seguridad)
    const approver = request.approvers?.find(a => a.token === req.params.token);

    const approverCecos = new Set(
      (approver?.centrosCosto || [])
        .map(cc => String(cc || "").trim())
        .filter(Boolean)
    );

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
      motivoRespuestaAprobador: approver?.motivoRechazo || request.motivoRechazo || "",
      motivoRevisionAprobador: approver?.motivoRevision || request.motivoRevision || "",
      nombreAprobador: approver?.name || approver?.email,
      emailAprobador: approver?.email || "",
      approverEmail: approver?.email || "",
      approver: approver ? {
        name: approver.name || approver.email,
        email: approver.email || "",
        estado: approver.estado,
        centrosCosto: approver.centrosCosto || [],
        motivoRechazo: approver.motivoRechazo || "",
        motivoRevision: approver.motivoRevision || ""
      } : null
    });
  } catch (err) { next(err); }
});

// POST /api/requests/approve-by-link - Procesar decisión (Aprobar/Rechazar)
router.post("/approve-by-link", async (req, res, next) => {
  try {
    const { token, decision, motivo } = req.body;
    if (!token || !decision) {
      return res.status(400).json({ error: "Token y decisión son obligatorios" });
    }

    const updated = await service.approveByToken(token, decision, motivo);
    res.json({ success: true, estado: updated.estado });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
