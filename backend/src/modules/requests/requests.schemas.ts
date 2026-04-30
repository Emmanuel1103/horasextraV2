/**
 * requests.schemas.ts — esquemas de validación para solicitudes
 *
 * utiliza zod para asegurar que los datos recibidos en el backend
 * cumplan con los formatos y tipos esperados antes de ser procesados.
 */

import { z } from "zod";
import { toBogotaDateStartTimestamp } from "../../utils/datetime";

// esquema para centro de costo con porcentaje de participación
export const centroCostoSchema = z.object({
  numero: z.string().min(1, "el número de centro de costo es requerido"),
  porcentaje: z.number().min(0).max(100).optional(),
});

// esquema para cada reporte diario de horas extras
export const dateEntrySchema = z.object({
  fecha: z.union([z.string(), z.date()]).transform((val: string | Date) => {
    return toBogotaDateStartTimestamp(val);
  }),
  diaSemana: z.union([z.string(), z.number()]).optional(),
  horaInicio: z.string().min(1, "la hora de inicio es requerida")
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "formato de hora inválido (hh:mm)"),
  horaFinal: z.string().min(1, "la hora final es requerida")
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "formato de hora inválido (hh:mm)"),
  motivo: z.string().min(1, "el motivo es requerido"),
  centroCosto: z.array(centroCostoSchema).min(1, "debe seleccionar al menos un centro de costo"),
});

// esquema para configuración personalizada de horarios diurnos/nocturnos
export const horariosConfigSchema = z.object({
  diarnaStart: z.number().min(0).max(23),
  diarnaEnd: z.number().min(0).max(23),
  nocturnaStart: z.number().min(0).max(23),
  nocturnaEnd: z.number().min(0).max(23),
}).optional();

// esquema principal para el envío del formulario de horas extras
export const overtimeFormSubmitSchema = z.object({
  nombre: z.string().min(1, "el nombre es requerido"),
  email: z.string().email("el correo es inválido"),
  cedula: z.string().optional(),
  cargo: z.string().min(1, "el cargo es requerido"),
  salario: z.number()
    .min(0, "el salario debe ser mayor o igual a 0")
    .optional(),
  centroCosto: z.string().optional(), 
  dateEntries: z.array(dateEntrySchema).min(1, "debe agregar al menos una fecha"),
  horariosConfig: horariosConfigSchema,
  approvers: z.array(z.object({
    name: z.string().optional(),
    email: z.string().email("email de aprobador inválido"),
    centrosCosto: z.array(z.string()).optional(),
  })).optional(),
  approverEmails: z.array(z.string().email("email de aprobador inválido")).optional(), 
  approvalMessageHtml: z.string().optional(),
});

// esquema para la acción de aprobar una solicitud
export const approveRequestSchema = z.object({
  approverEmail: z.string().email("email del aprobador inválido"),
  comentarios: z.string().optional(),
});

// esquema para actualizaciones parciales de una solicitud
export const updateRequestSchema = z.object({
  nombre: z.string().optional(),
  email: z.string().email("el correo es inválido").optional(),
  cedula: z.string().optional(),
  cargo: z.string().optional(),
  salario: z.number().min(0).optional(),
  fecha: z.string().optional(),
  horaInicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  horaFinal: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  motivo: z.string().optional(),
  centroCosto: z.union([
    z.string(),
    z.array(centroCostoSchema)
  ]).optional(),
  estado: z.enum(["pendiente", "aprobado", "rechazado", "cancelado"]).optional(),
  recalculateTotals: z.boolean().optional(),
  updatedAt: z.string().optional(),
});

// exportación de tipos inferidos
export type CentroCostoItem = z.infer<typeof centroCostoSchema>;
export type DateEntry = z.infer<typeof dateEntrySchema>;
export type HorariosConfig = z.infer<typeof horariosConfigSchema>;
export type OvertimeFormSubmit = z.infer<typeof overtimeFormSubmitSchema>;
export type ApproveRequest = z.infer<typeof approveRequestSchema>;
export type UpdateRequest = z.infer<typeof updateRequestSchema>;

