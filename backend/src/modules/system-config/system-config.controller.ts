import { Router } from "express";
import { getConfig, updateConfig } from "./system-config.service";
import { logger } from "../../utils/logger";

const router = Router();

/**
 * GET /api/config
 * Obtener configuración del sistema
 */
router.get("/", async (req, res, next) => {
    try {
        const config = await getConfig();
        res.json(config);
    } catch (err) {
        logger.error("Error al obtener configuración", err);
        next(err);
    }
});

/**
 * PUT /api/config
 * Actualizar configuración del sistema
 */
router.put("/", async (req, res, next) => {
    try {
        const updateData = req.body;

        // Note: SMTP configuration is now managed via environment variables
        // Only templates (requestEmailTemplate, decisionEmailTemplate) are stored in DB

        const updated = await updateConfig(updateData);
        res.json(updated);
    } catch (err) {
        logger.error("Error al actualizar configuración");
        next(err);
    }
});

/**
 * DELETE /api/config/emailConfig
 * Eliminar el campo emailConfig antiguo de la base de datos (migración)
 */
router.delete("/emailConfig", async (req, res, next) => {
    try {
        const config = await getConfig();

        // Check if emailConfig exists
        if (!(config as any).emailConfig) {
            return res.json({ message: "emailConfig no existe en la base de datos", removed: false });
        }

        logger.info("🗑️ Eliminando emailConfig antiguo de la base de datos...");

        // Remove emailConfig field
        delete (config as any).emailConfig;

        const updated = await updateConfig(config);

        logger.info("✅ emailConfig eliminado exitosamente");
        res.json({ message: "emailConfig eliminado exitosamente", removed: true, config: updated });
    } catch (err) {
        logger.error("Error al eliminar emailConfig", err);
        next(err);
    }
});

/**
 * POST /api/config/test-email
 * Enviar correo de prueba con plantillas
 */
router.post("/test-email", async (req, res, next) => {
    try {
        const { templateType, recipientEmail, subject } = req.body;

        if (!templateType || !recipientEmail) {
            return res.status(400).json({ error: "templateType y recipientEmail son requeridos" });
        }

        const validTypes = ["request", "decision", "resend", "forReview", "reviewed", "approvalRemoved"];
        if (!validTypes.includes(templateType)) {
            return res.status(400).json({ error: `templateType debe ser uno de: ${validTypes.join(", ")}` });
        }

        const config = await getConfig();
        let template = "";
        
        switch (templateType) {
            case "request": template = config.requestEmailTemplate; break;
            case "decision": template = config.decisionEmailTemplate; break;
            case "resend": template = config.resendEmailTemplate || ""; break;
            case "forReview": template = config.forReviewEmailTemplate || ""; break;
            case "reviewed": template = config.reviewedEmailTemplate || ""; break;
            case "approvalRemoved": template = config.approvalRemovedEmailTemplate || ""; break;
        }

        if (!template) {
            return res.status(400).json({ error: `No hay plantilla configurada para ${templateType}` });
        }

        // Import email service
        const { sendTestEmail } = await import("../../services/email.service");

        await sendTestEmail(recipientEmail, template, templateType, subject);

        res.json({ success: true, message: `Correo de prueba enviado a ${recipientEmail}` });
    } catch (err: any) {
        logger.error("Error al enviar correo de prueba", err);
        res.status(500).json({ error: err.message || "Error al enviar correo de prueba" });
    }
});

export default router;

// Router público para configuración (sin autenticación)
const publicRouter = Router();

/**
 * GET /api/public-config
 * Obtener configuración pública (unidades, horarios, feriados)
 */
publicRouter.get("/", async (req, res, next) => {
    try {
        // Importar dinámicamente para evitar dependencias circulares si las hubiera
        const { getPublicConfig } = await import("./system-config.service");
        const config = await getPublicConfig();
        res.json(config);
    } catch (err) {
        logger.error("Error al obtener configuración pública", err);
        next(err);
    }
});

export { publicRouter };
