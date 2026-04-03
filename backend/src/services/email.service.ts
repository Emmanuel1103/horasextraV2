import nodemailer from "nodemailer";
import { SystemConfigEntity } from "../modules/system-config/system-config.model";
import { RequestEntity } from "../modules/requests/requests.repository";
import { getUserById } from "../modules/users/users.service";
import { logger } from "../utils/logger";

const createTransporter = () => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpSecure = process.env.SMTP_SECURE === "true";
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
        logger.warn("⚠️ SMTP configuration missing in environment variables. Email sending disabled.");
        return null;
    }

    return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });
};

const replaceVariables = (template: string, variables: Record<string, any>): string => {
    let result = template;
    for (const key in variables) {
        const regex = new RegExp(`{{${key}}}`, "g");
        const value = variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : "";
        result = result.replace(regex, value);
    }
    return result;
};

const getCentrosCostoString = (centroCosto: any): string => {
    if (!centroCosto) return "N/A";
    if (Array.isArray(centroCosto)) {
        return centroCosto.map((cc: any) => `${cc.numero} (${cc.porcentaje || 100}%)`).join(", ");
    }
    return String(centroCosto);
};

const formatDateEs = (value: any): string => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
};

const getRequestDetailVariables = (
    request: RequestEntity,
    options?: { centrosCostosOverride?: string }
) => {
    const normalizedEntries = Array.isArray(request.dateEntries) && request.dateEntries.length > 0
        ? request.dateEntries
        : [{
            fecha: request.fecha || new Date().toISOString(),
            horaInicio: request.horaInicio,
            horaFinal: request.horaFinal || (request as any).horaFin,
            centroCosto: request.centroCosto || [],
            motivo: request.motivo,
        } as any];

    const firstEntry = normalizedEntries[0] as any;
    const isMultiDate = normalizedEntries.length > 1;

    return {
        fecha: isMultiDate ? "Múltiples fechas" : formatDateEs(firstEntry?.fecha),
        hora_inicio: isMultiDate ? "Varios horarios" : (firstEntry?.horaInicio || "N/A"),
        hora_fin: isMultiDate ? "Varios horarios" : (firstEntry?.horaFinal || firstEntry?.horaFin || "N/A"),
        descripcion_servicio: isMultiDate
            ? "Múltiples actividades"
            : (firstEntry?.motivo || request.motivo || "N/A"),
        centros_costos: options?.centrosCostosOverride
            || (isMultiDate
                ? "Múltiples centros"
                : getCentrosCostoString(Array.isArray(firstEntry?.centroCosto) ? firstEntry.centroCosto : [])),
    };
};

export const sendRequestEmail = async (
    request: RequestEntity,
    config: SystemConfigEntity,
    options?: { useResendTemplate?: boolean }
) => {
    const approvers = request.approvers || [];
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const fechaActual = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const normalizedEntries = Array.isArray(request.dateEntries) && request.dateEntries.length > 0
        ? request.dateEntries
        : [{
            fecha: request.fecha || new Date().toISOString(),
            horaInicio: request.horaInicio,
            horaFinal: request.horaFinal || (request as any).horaFin,
            centroCosto: request.centroCosto || [],
            motivo: request.motivo,
        } as any];

    // Datos del empleado (compatibilidad con nuevo esquema)
    const empNombre = request.empleado?.nombre || request.nombre || "Colaborador";
    const empCedula = request.empleado?.cedula || request.cedula || request.empleadoId || "N/A";
    const empCargo = request.empleado?.cargo || request.cargo || "N/A";

    // Para cada aprobador, construir email con sus fechas específicas
    for (const approver of approvers) {
        if (!approver.email) continue;

        const normalizedApproverCCs = (approver.centrosCosto || [])
            .map((cc) => String(cc || "").trim())
            .filter(Boolean);

        const getEntryCecosForApprover = (entry: any) => {
            const entryCCs = Array.isArray(entry?.centroCosto) ? entry.centroCosto : [];
            const filtered = entryCCs.filter((cc: any) => {
                if (normalizedApproverCCs.length === 0) return true;
                const num = String(cc?.numero || cc || "").trim();
                return normalizedApproverCCs.includes(num);
            });

            return filtered.map((cc: any) => ({
                numero: String(cc?.numero || cc || "").trim(),
                porcentaje: cc?.porcentaje,
            })).filter((cc: any) => cc.numero);
        };
        
        // NUEVO: Filtrar fechas por centros de costo del aprobador
        // RE-AJUSTE: Solo mostramos las fechas que le pertenecen estrictamente a sus centros de costo
        let relevantEntries = normalizedEntries.filter(entry => {
            if (!approver.centrosCosto || approver.centrosCosto.length === 0) return true; // Si no tiene centros, ve todo
            const entryCCs = Array.isArray(entry.centroCosto) ? entry.centroCosto : [];
            
            return entryCCs.some((cc: any) => {
                const num = String(cc.numero || cc).trim();
                return normalizedApproverCCs.includes(num);
            });
        });
        
        // LOGS DE DEPURACIÓN CRÍTICOS
        logger.info(`[EMAIL] Preparando correo para aprobador: ${approver.email} | Centros: ${JSON.stringify(approver.centrosCosto)}`);
        logger.info(`[EMAIL] Mostrando ${relevantEntries.length} de ${normalizedEntries.length} fechas.`);

        if (relevantEntries.length === 0) {
            logger.info(`[EMAIL] Saltando envío a ${approver.email} - No tiene fechas bajo su supervisión.`);
            continue;
        }

        // Construir HTML de tabla solo con fechas filtradas
        let rowsHtml = relevantEntries.map(entry => {
                const fechaFmt = new Date(entry.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                const filteredCecos = getEntryCecosForApprover(entry);
                const ccFmt = filteredCecos.length > 0
                    ? filteredCecos.map((cc: any) => `${cc.numero} (${cc.porcentaje || 100}%)`).join(", ")
                    : "N/A";

                return `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px;">${fechaFmt}</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">${entry.horaInicio || "N/A"}</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">${entry.horaFinal || (entry as any).horaFin || "N/A"}</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">${ccFmt}</td>
                        <td style="border: 1px solid #ddd; padding: 12px;">${entry.motivo || request.motivo || "N/A"}</td>
                    </tr>
                `;
            }).join("");
        
        const firstRelevantEntry = relevantEntries[0];
        const approvalToken = approver.token || "TOKEN_ERROR";
        const approvalLink = `${frontendUrl}/aprobar-horas/${approvalToken}`;
        const anioActual = new Date().getFullYear().toString();

        const isMultiDate = relevantEntries.length > 1;
        const variables: Record<string, string> = {
            fecha_correo: fechaActual,
            link_sistema: approvalLink,
            anio_actual: anioActual,
            nombre: empNombre,
            cedula: empCedula,
            cargo: empCargo,
            fecha: isMultiDate ? "Múltiples fechas" : (firstRelevantEntry ? new Date(firstRelevantEntry.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A"),
            hora_inicio: isMultiDate ? "Varios horarios" : (firstRelevantEntry?.horaInicio || "N/A"),
            hora_fin: isMultiDate ? "Varios horarios" : (firstRelevantEntry?.horaFinal || (firstRelevantEntry as any)?.horaFin || "N/A"),
            centros_costos: isMultiDate
                ? "Múltiples centros"
                : getCentrosCostoString(getEntryCecosForApprover(firstRelevantEntry)),
            descripcion_servicio: isMultiDate ? "Múltiples actividades" : (firstRelevantEntry?.motivo || request.motivo || "N/A"),
            filas_tabla_horas_extras: rowsHtml,
            tabla_horas_extras: `
                <div style="margin-top: 20px; font-family: sans-serif;">
                    <p style="font-weight: bold; color: #333;">Detalle de fechas para su aprobación:</p>
                    <table style="width:100%; border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr style="background-color: #26bc58; color: white;">
                                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Fecha</th>
                                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Hora inicio</th>
                                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Hora fin</th>
                                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Centros de costo</th>
                                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Descripción</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                    <p style="font-size: 11px; color: #666; margin-top: 10px;">
                        * Esta tabla muestra únicamente las fechas que corresponden a los centros de costo bajo su supervisión.
                    </p>
                </div>`
        };

        const transporter = createTransporter();
        const htmlTemplate = config.requestEmailTemplate;
        const baseSubjectTemplate = config.requestEmailSubject || "Nueva Solicitud de Horas Extras";

        const subjectTemplate = options?.useResendTemplate
            ? (() => {
                const normalized = String(baseSubjectTemplate || "").trim();
                if (!normalized) return "Reenvio: Solicitud de Horas Extras";
                if (/^reenv[ií]o\s*:/i.test(normalized)) return normalized;
                return `Reenvio: ${normalized}`;
            })()
            : baseSubjectTemplate;

        if (!transporter || !htmlTemplate) continue;

        const html = replaceVariables(htmlTemplate, variables);
        const subject = replaceVariables(subjectTemplate, variables);

        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: approver.email,
                subject: subject,
                html: html,
                attachments: [{
                    filename: 'logoFSD-Verde.png',
                    path: __dirname + '/../assets/logoFSD-Verde.png',
                    cid: 'logoFSD'
                }]
            });
        } catch (error) {
            logger.error(`❌ Error sending email:`, error);
        }
    }
};

export const sendDecisionEmail = async (request: RequestEntity, config: SystemConfigEntity) => {
    const transporter = createTransporter();
    if (!transporter || !config.decisionEmailTemplate) return;

    // Datos del empleado (compatibilidad con nuevo esquema)
    const empNombre = request.empleado?.nombre || request.nombre || "Colaborador";
    const empCedula = request.empleado?.cedula || request.cedula || request.empleadoId || "N/A";
    const empCargo = request.empleado?.cargo || request.cargo || "N/A";

    let recipientEmail = String(request.empleado?.email || (request as any).email || "").trim().toLowerCase();
    const userId = request.empleado?.id || request.empleadoId;

    if (!recipientEmail && userId && userId !== "unknown") {
        const user = await getUserById(userId);
        if (user && user.email) recipientEmail = user.email;
    }
    
    if (!recipientEmail) {
        logger.warn(`⚠️ No se encontró email destino para notificar decisión de solicitud ${request.id}`);
        return;
    }

    const variables = {
        ...getRequestDetailVariables(request),
        nombre: empNombre,
        cedula: empCedula,
        cargo: empCargo,
        estado: request.estado?.toUpperCase() || "PROCESADO",
        comentarios: request.motivoRechazo || (request as any).observaciones || "Sin observaciones",
        fecha_correo: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        anio_actual: new Date().getFullYear().toString(),
        link_sistema: process.env.FRONTEND_URL || "http://localhost:5173",
    };

    const html = replaceVariables(config.decisionEmailTemplate, variables);
    const subject = replaceVariables(config.decisionEmailSubject || "Estado de solicitud: {{estado}}", variables);

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: recipientEmail,
            subject: subject,
            html: html,
            attachments: [{ filename: 'logoFSD-Verde.png', path: __dirname + '/../assets/logoFSD-Verde.png', cid: 'logoFSD' }]
        });
    } catch (error) { logger.error(`❌ Error enviando email de decisión:`, error); }
};

export const sendForReviewEmail = async (
    request: RequestEntity,
    config: SystemConfigEntity,
    recipients: string[],
    reviewReason: string,
    approverName: string,
    approverEmail: string,
    senderCecos?: string[]
) => {
    const transporter = createTransporter();
    if (!transporter || recipients.length === 0) return;

    const empNombre = request.empleado?.nombre || request.nombre || "Colaborador";
    const empCedula = request.empleado?.cedula || request.cedula || request.empleadoId || "N/A";
    const empCargo = request.empleado?.cargo || request.cargo || "N/A";
    const cecos = (senderCecos || [])
        .map((cc) => String(cc || "").trim())
        .filter(Boolean)
        .join(", ") || request.totales?.centrosCostoInvolucrados?.join(", ") || "N/A";

    const variables = {
        ...getRequestDetailVariables(request, { centrosCostosOverride: cecos }),
        nombre: empNombre,
        cedula: empCedula,
        cargo: empCargo,
        estado: "EN REVISION",
        comentarios: reviewReason || "Sin observaciones",
        comentario_aprobador: reviewReason || "Sin observaciones",
        motivo_revision: reviewReason || "Sin observaciones",
        solicitado_por: approverName || approverEmail,
        email_solicitante: approverEmail,
        centros_costos: cecos,
        actualizado_por: approverName || approverEmail,
        fecha_correo: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
        anio_actual: new Date().getFullYear().toString(),
        link_sistema: process.env.FRONTEND_URL || "http://localhost:5173",
    };

    const htmlTemplate = config.forReviewEmailTemplate || config.decisionEmailTemplate || "";
    const subjectTemplate = config.forReviewEmailSubject || "Solicitud de horas extras para revisión";
    const html = replaceVariables(htmlTemplate, variables);
    const subject = replaceVariables(subjectTemplate, variables);

    for (const to of recipients) {
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to,
                subject,
                html,
                attachments: [{ filename: "logoFSD-Verde.png", path: __dirname + "/../assets/logoFSD-Verde.png", cid: "logoFSD" }],
            });
        } catch (error) {
            logger.error(`❌ Error enviando email de revisión a ${to}:`, error);
        }
    }
};

export const sendReviewedEmail = async (
    request: RequestEntity,
    config: SystemConfigEntity,
    approver: { email: string; token?: string; centrosCosto?: string[] },
    reviewerName: string,
    reviewReason?: string
) => {
    const transporter = createTransporter();
    const recipient = String(approver?.email || "").trim().toLowerCase();
    if (!transporter || !recipient) return;

    const empNombre = request.empleado?.nombre || request.nombre || "Colaborador";
    const empCedula = request.empleado?.cedula || request.cedula || request.empleadoId || "N/A";
    const empCargo = request.empleado?.cargo || request.cargo || "N/A";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const reviewLink = approver?.token
        ? `${frontendUrl}/aprobar-horas/${approver.token}`
        : frontendUrl;
    const cecos = (approver?.centrosCosto || []).map((cc) => String(cc || "").trim()).filter(Boolean).join(", ") ||
        request.totales?.centrosCostoInvolucrados?.join(", ") ||
        "N/A";

    const variables = {
        ...getRequestDetailVariables(request, { centrosCostosOverride: cecos }),
        nombre: empNombre,
        cedula: empCedula,
        cargo: empCargo,
        estado: "REVISADO",
        comentarios: reviewReason || "Solicitud revisada por nómina",
        motivo_revision: reviewReason || "Solicitud revisada por nómina",
        revisado_por: reviewerName || "Nómina",
        centros_costos: cecos,
        fecha_correo: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
        anio_actual: new Date().getFullYear().toString(),
        link_sistema: reviewLink,
    };

    const htmlTemplate = config.reviewedEmailTemplate || config.decisionEmailTemplate || "";
    const subjectTemplate = config.reviewedEmailSubject || "Solicitud de horas extras revisada";
    const html = replaceVariables(htmlTemplate, variables);
    const subject = replaceVariables(subjectTemplate, variables);

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: recipient,
            subject,
            html,
            attachments: [{ filename: "logoFSD-Verde.png", path: __dirname + "/../assets/logoFSD-Verde.png", cid: "logoFSD" }],
        });
    } catch (error) {
        logger.error(`❌ Error enviando email de revisado a ${recipient}:`, error);
    }
};

export const sendApprovalRemovedEmail = async (
    request: RequestEntity,
    config: SystemConfigEntity,
    recipient: string,
    removedCecos: string[],
    updatedBy?: string
) => {
    const transporter = createTransporter();
    const to = String(recipient || "").trim().toLowerCase();
    if (!transporter || !to) return;

    const empNombre = request.empleado?.nombre || request.nombre || "Colaborador";
    const empCedula = request.empleado?.cedula || request.cedula || request.empleadoId || "N/A";
    const empCargo = request.empleado?.cargo || request.cargo || "N/A";
    const cecos = (removedCecos || []).map((cc) => String(cc || "").trim()).filter(Boolean).join(", ") || "N/A";

    const variables = {
        ...getRequestDetailVariables(request, { centrosCostosOverride: cecos }),
        nombre: empNombre,
        cedula: empCedula,
        cargo: empCargo,
        estado: "ACTUALIZADO",
        comentarios: "La solicitud fue ajustada y estos centros de costo ya no requieren tu aprobación.",
        actualizado_por: updatedBy || "Nómina",
        fecha_correo: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
        anio_actual: new Date().getFullYear().toString(),
        link_sistema: process.env.FRONTEND_URL || "http://localhost:5173",
    };
    const htmlTemplate = config.approvalRemovedEmailTemplate || "";
    if (!htmlTemplate) {
        logger.warn("⚠️ approvalRemovedEmailTemplate no configurada. Se omite envío de notificación de aprobación removida.");
        return;
    }

    const subjectTemplate = config.approvalRemovedEmailSubject || "Actualización de solicitud: aprobación ya no requerida";
    const html = replaceVariables(htmlTemplate, variables);
    const subject = replaceVariables(subjectTemplate, variables);

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            html,
            attachments: [{ filename: "logoFSD-Verde.png", path: __dirname + "/../assets/logoFSD-Verde.png", cid: "logoFSD" }],
        });
    } catch (error) {
        logger.error(`❌ Error enviando email de aprobación removida a ${to}:`, error);
    }
};

export const sendTestEmail = async (recipientEmail: string, template: string, type: string, subjectTemplate?: string) => {
    const transporter = createTransporter();
    if (!transporter) throw new Error("SMTP not configured");
    const fechaActual = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const baseVariables = {
        fecha_correo: fechaActual,
        link_sistema: frontendUrl,
        anio_actual: new Date().getFullYear().toString(),
        nombre: "Emmanuel Morales (Ejemplo)",
        cedula: "1043660018",
        cargo: "Profesional (Ejemplo)",
        fecha: "Múltiples fechas",
        hora_inicio: "Varios horarios",
        hora_fin: "Varios horarios",
        centros_costos: "99% Tecnología / 1% Administración",
        descripcion_servicio: "Mantenimiento preventivo",
        filas_tabla_horas_extras: `
            <tr>
                <td style="border: 1px solid #ddd; padding: 10px;">${fechaActual}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">08:00 AM</td>
                <td style="border: 1px solid #ddd; padding: 10px;">05:00 PM</td>
                <td style="border: 1px solid #ddd; padding: 10px;">99% Tecnología</td>
                <td style="border: 1px solid #ddd; padding: 10px;">Mantenimiento preventivo</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
                <td style="border: 1px solid #ddd; padding: 10px;">06/03/2026</td>
                <td style="border: 1px solid #ddd; padding: 10px;">09:00 AM</td>
                <td style="border: 1px solid #ddd; padding: 10px;">11:00 AM</td>
                <td style="border: 1px solid #ddd; padding: 10px;">1% Administración</td>
                <td style="border: 1px solid #ddd; padding: 10px;">Revisión de backups</td>
            </tr>`,
        tabla_horas_extras: `
            <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px; margin-top: 10px;">
                <thead>
                    <tr style="background-color: #00b050; color: white;">
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Fecha</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Hora inicio</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Hora fin</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Centros de costo (porcentaje)</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Descripción del servicio</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="border: 1px solid #ddd; padding: 10px;">${fechaActual}</td><td style="border: 1px solid #ddd; padding: 10px;">08:00 AM</td><td style="border: 1px solid #ddd; padding: 10px;">05:00 PM</td><td style="border: 1px solid #ddd; padding: 10px;">99% Tecnología</td><td style="border: 1px solid #ddd; padding: 10px;">Mantenimiento preventivo</td></tr>
                    <tr style="background-color: #f9f9f9;"><td style="border: 1px solid #ddd; padding: 10px;">06/03/2026</td><td style="border: 1px solid #ddd; padding: 10px;">09:00 AM</td><td style="border: 1px solid #ddd; padding: 10px;">11:00 AM</td><td style="border: 1px solid #ddd; padding: 10px;">1% Administración</td><td style="border: 1px solid #ddd; padding: 10px;">Revisión de backups</td></tr>
                </tbody>
            </table>`
    };

    const isDecisionLikeTemplate = type === "decision" || type === "reviewed" || type === "forReview" || type === "approvalRemoved";
    const variables = isDecisionLikeTemplate
        ? {
            ...baseVariables,
            estado: "EN REVISION",
            comentarios: "Comentario de prueba del aprobador",
            comentario_aprobador: "Comentario de prueba del aprobador",
            motivo_revision: "Motivo de revisión de prueba",
            solicitado_por: "Aprobador Ejemplo",
            email_solicitante: "aprobador@empresa.com",
            actualizado_por: "Aprobador Ejemplo",
        }
        : baseVariables;
    const html = replaceVariables(template, variables);
    const subject = subjectTemplate ? replaceVariables(subjectTemplate, variables) : "Prueba";
    await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: recipientEmail, subject: `TEST: ${subject}`, html, attachments: [{ filename: 'logoFSD-Verde.png', path: __dirname + '/../assets/logoFSD-Verde.png', cid: 'logoFSD' }] });
};
