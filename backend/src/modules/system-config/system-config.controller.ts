/**
 * system-config.controller.ts — controladores para la configuración del sistema
 *
 * permite la gestión centralizada de parámetros operativos como horarios,
 * centros de costo, unidades de negocio y plantillas de correo.
 */

import { Router } from "express";
import { getConfig, updateConfig } from "./system-config.service";
import { logger } from "../../utils/logger";

const router = Router();

/**
 * GET /api/config
 * obtiene la configuración completa del sistema (requiere privilegios de administrador).
 */
router.get("/", async (req, res, next) => {
    try {
        const config = await getConfig();
        res.json(config);
    } catch (err) {
        logger.error("error al obtener configuración", err);
        next(err);
    }
});

/**
 * PUT /api/config
 * actualiza los parámetros globales del sistema.
 */
router.put("/", async (req, res, next) => {
    try {
        const updateData = req.body;
        const updated = await updateConfig(updateData);
        res.json(updated);
    } catch (err) {
        logger.error("error al actualizar configuración");
        next(err);
    }
});

/**
 * DELETE /api/config/emailConfig
 * endpoint de mantenimiento para limpiar configuraciones obsoletas.
 */
router.delete("/emailConfig", async (req, res, next) => {
    try {
        const config = await getConfig();

        if (!(config as any).emailConfig) {
            return res.json({ message: "emailConfig no existe en la base de datos", removed: false });
        }

        logger.info("eliminando emailConfig antiguo de la base de datos");
        delete (config as any).emailConfig;

        const updated = await updateConfig(config);
        res.json({ message: "emailConfig eliminado exitosamente", removed: true, config: updated });
    } catch (err) {
        logger.error("error al eliminar emailConfig", err);
        next(err);
    }
});

/**
 * POST /api/config/test-email
 * permite enviar correos de prueba para validar el diseño de las plantillas y la conexión smtp.
 */
router.post("/test-email", async (req, res, next) => {
    try {
        const { templateType, recipientEmail, subject } = req.body;

        if (!templateType || !recipientEmail) {
            return res.status(400).json({ error: "template_type y recipient_email son requeridos" });
        }

        const validTypes = ["request", "decision", "resend", "forReview", "reviewed", "approvalRemoved"];
        if (!validTypes.includes(templateType)) {
            return res.status(400).json({ error: `el tipo de plantilla debe ser uno de: ${validTypes.join(", ")}` });
        }

        const config = await getConfig();
        let template = "";
        
        // selección dinámica de la plantilla basándose en el tipo solicitado
        switch (templateType) {
            case "request": template = config.requestEmailTemplate; break;
            case "decision": template = config.decisionEmailTemplate; break;
            case "resend": template = config.resendEmailTemplate || ""; break;
            case "forReview": template = config.forReviewEmailTemplate || ""; break;
            case "reviewed": template = config.reviewedEmailTemplate || ""; break;
            case "approvalRemoved": template = config.approvalRemovedEmailTemplate || ""; break;
        }

        if (!template) {
            return res.status(400).json({ error: `no hay plantilla configurada para ${templateType}` });
        }

        const { sendTestEmail } = await import("../../services/email.service");
        await sendTestEmail(recipientEmail, template, templateType, subject);

        res.json({ success: true, message: `correo de prueba enviado a ${recipientEmail}` });
    } catch (err: any) {
        logger.error("error al enviar correo de prueba", err);
        res.status(500).json({ error: err.message || "error al enviar correo de prueba" });
    }
});

const publicRouter = Router();

/**
 * GET /api/public-config
 * obtiene los parámetros necesarios para la operación del formulario público (unidades, feriados, etc).
 */
publicRouter.get("/", async (req, res, next) => {
    try {
        const { getPublicConfig } = await import("./system-config.service");
        const config = await getPublicConfig();
        res.json(config);
    } catch (err) {
        logger.error("error al obtener configuración pública", err);
        next(err);
    }
});

export { publicRouter };
export default router;

