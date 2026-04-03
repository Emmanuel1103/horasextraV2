export type OvertimeStatus = "pendiente" | "en_revision" | "pendiente_nomina" | "aprobado" | "rechazado" | "cancelado";

export interface ApproverInfo {
  email: string;
  name?: string;
  estado: "pendiente" | "en_revision" | "aprobado" | "rechazado";
  fechaAprobacion?: string;
  token?: string;
  centrosCosto?: string[];
  motivoRechazo?: string;
  motivoRevision?: string;
  fechaRevisionSolicitada?: string;
  fechaRevisionCompletada?: string;
}

export interface OvertimeRecord {
  id: string;
  submissionId?: string;
  
  // Datos del empleado
  empleado: {
    id: string;
    nombre?: string;
    email?: string;
    cedula?: string;
    cargo?: string;
    salario?: number;
  };

  // Totales consolidados
  totales: {
    cantidadHoras: number;
    horasExtraDiurna: number;
    horasExtraNocturna: number;
    recargosDominicalFestivo: number;
    valorTotal: number;
    centrosCostoInvolucrados: string[];
  };

  // Detalle de fechas
  dateEntries: Array<{
    fecha: string;
    diaSemana?: number | string;
    horaInicio: string;
    horaFinal: string;
    motivo: string;
    cantidadHoras: number;
    horasExtraDiurna: number;
    horasExtraNocturna: number;
    recargosDominicalFestivo: number;
    valorHorasExtra: number;
    centroCosto: Array<{ numero: string; porcentaje?: number }>;
  }>;

  estado: OvertimeStatus;
  approvers?: ApproverInfo[];
  approvalMessageHtml?: string;
  updatedAt?: string;
  createdAt?: string;
  motivoRechazo?: string;
  motivoRevision?: string;

  // Legacy (para evitar errores inmediatos de tipos)
  nombre?: string;
  cedula?: string;
  cargo?: string;
  salario?: number;
  fecha?: Date | string;
  diaSemana?: string | number;
  centroCosto?: string | Array<{ numero: string; porcentaje?: number }>;
  horaInicio?: string;
  horaFinal?: string;
  cantidadHoras?: number;
  horasExtraDiurna?: number;
  horasExtraNocturna?: number;
  recargosDominicalFestivo?: number;
  valorHorasExtra?: number;
  motivo?: string;
}

export type ViewMode = "colaborador" | "admin";

export interface OvertimeCalculationResult {
  cantidadHoras: number;
  horasExtraDiurna: number;
  horasExtraNocturna: number;
  recargosDominicalFestivo: number;
  // Detalle para reportes
  horasExtraDiurnaDominical?: number;
  horasExtraNocturnaDominical?: number;
  recargoDominicalDiurno?: number;
  recargoDominicalNocturno?: number;
}

export interface DateEntry {
  fecha?: Date;
  diaSemana?: string;
  horaInicio: string;
  horaFinal: string;
  motivo: string;
  centroCosto: Array<{ numero: string; porcentaje?: number }>;
}

export interface FormDataInput {
  nombre: string;
  cargo: string;
  salario: string;
  centroCosto: string;
}

export interface OvertimeFormSubmit {
  nombre: string;
  email: string;
  cedula?: string;
  cargo: string;
  salario: number;
  centroCosto?: string;
  dateEntries: DateEntry[];
  overtimeRates?: {
    DIURNA: number;
    NOCTURNA: number;
    DOMINICAL_DIURNA: number;
    DOMINICAL_NOCTURNA: number;
    RECARGO_DOM_DIURNO: number;
    RECARGO_DOM_NOCTURNO: number;
  };
  approvers?: Array<{
    name?: string;
    email: string;
    centrosCosto?: string[];
  }>;
  approverEmails?: string[];
  approvalMessageHtml?: string;
}

export interface HorariosConfig {
  diarnaStart: number; // Hora de inicio del turno diurno (0-23)
  diarnaEnd: number;   // Hora de fin del turno diurno (0-23)
  nocturnaStart: number; // Hora de inicio del turno nocturno (0-23)
  nocturnaEnd: number;   // Hora de fin del turno nocturno (0-23)
}

export interface Director {
  id: string;
  nombre: string;
  email: string;
}

export interface CentroCosto {
  id: string;
  numero: string;
  nombre: string;
}

export interface Unidad {
  id: string;
  nombre: string;
  director: Director;
  centrosCosto: CentroCosto[];
}

export interface Holiday {
  date: Date;
  name: string;
}

export type UserRole = "COLABORADOR" | "NOMINA" | "DEV";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
}

// EmailConfig removed - SMTP configuration is now managed via backend environment variables
