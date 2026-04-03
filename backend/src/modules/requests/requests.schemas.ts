import { z } from "zod";
import { toBogotaDateStartTimestamp } from "../../utils/datetime";

// Schema para centro de costo con porcentaje
export const centroCostoSchema = z.object({
  numero: z.string().min(1, "El número de centro de costo es requerido"),
  porcentaje: z.number().min(0).max(100).optional(),
});

// Schema para cada entrada de fecha
export const dateEntrySchema = z.object({
  fecha: z.union([z.string(), z.date()]).transform((val: string | Date) => {
    return toBogotaDateStartTimestamp(val);
  }),
  diaSemana: z.union([z.string(), z.number()]).optional(),
  horaInicio: z.string().min(1, "La hora de inicio es requerida")
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)"),
  horaFinal: z.string().min(1, "La hora final es requerida")
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)"),
  motivo: z.string().min(1, "El motivo es requerido"),
  centroCosto: z.array(centroCostoSchema).min(1, "Debe seleccionar al menos un centro de costo"),
});

// Schema para configuración de horarios
export const horariosConfigSchema = z.object({
  diarnaStart: z.number().min(0).max(23),
  diarnaEnd: z.number().min(0).max(23),
  nocturnaStart: z.number().min(0).max(23),
  nocturnaEnd: z.number().min(0).max(23),
}).optional();

// Schema para el formulario completo de horas extras
export const overtimeFormSubmitSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("El correo es inválido"),
  cedula: z.string().optional(),
  cargo: z.string().min(1, "El cargo es requerido"),
  salario: z.number()
    .min(0, "El salario debe ser mayor o igual a 0")
    .optional(),
  centroCosto: z.string().optional(), // Centro de costo general (legacy)
  dateEntries: z.array(dateEntrySchema).min(1, "Debe agregar al menos una fecha"),
  horariosConfig: horariosConfigSchema,
  approvers: z.array(z.object({
    name: z.string().optional(),
    email: z.string().email("Email de aprobador inválido"),
    centrosCosto: z.array(z.string()).optional(),
  })).optional(),
  approverEmails: z.array(z.string().email("Email de aprobador inválido")).optional(), // Legacy support
  approvalMessageHtml: z.string().optional(),
});

// Schema para aprobar una solicitud
export const approveRequestSchema = z.object({
  approverEmail: z.string().email("Email del aprobador inválido"),
  comentarios: z.string().optional(),
});

// Schema para actualizar una solicitud (parcial)
export const updateRequestSchema = z.object({
  nombre: z.string().optional(),
  email: z.string().email("El correo es inválido").optional(),
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

// Tipos inferidos de los schemas
export type CentroCostoItem = z.infer<typeof centroCostoSchema>;
export type DateEntry = z.infer<typeof dateEntrySchema>;
export type HorariosConfig = z.infer<typeof horariosConfigSchema>;
export type OvertimeFormSubmit = z.infer<typeof overtimeFormSubmitSchema>;
export type ApproveRequest = z.infer<typeof approveRequestSchema>;
export type UpdateRequest = z.infer<typeof updateRequestSchema>;
