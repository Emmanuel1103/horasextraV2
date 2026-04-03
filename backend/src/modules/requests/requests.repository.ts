import { RepositoryBase } from "../../db/cosmos/repositoryBase";
import { v4 as uuidv4 } from "uuid";
import { getBogotaTimestamp } from "../../utils/datetime";

export interface CentroCostoItem {
  numero: string;
  porcentaje?: number;
}

export interface ApproverInfo {
  email: string;
  name?: string;
  estado: "pendiente" | "en_revision" | "aprobado" | "rechazado";
  fechaAprobacion?: string;
  token?: string;
  centrosCosto?: string[]; // NUEVO: centros de costo que maneja este aprobador
  motivoRechazo?: string;
  motivoRevision?: string;
  fechaRevisionSolicitada?: string;
  fechaRevisionCompletada?: string;
}

export interface RequestEntity {
  id: string;
  submissionId?: string;

  // Datos del empleado (Anidado para mayor claridad)
  empleado: {
    id: string;
    nombre?: string;
    email?: string;
    cedula?: string;
    cargo?: string;
    salario?: number;
  };

  // Totales consolidados de toda la solicitud
  totales: {
    cantidadHoras: number;
    horasExtraDiurna: number;
    horasExtraNocturna: number;
    recargosDominicalFestivo: number;
    valorTotal: number;
    centrosCostoInvolucrados: string[];
  };

  // Listado de fechas y horas reportadas
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
    centroCosto: CentroCostoItem[];
  }>;

  // Estado y aprobación
  estado: "pendiente" | "en_revision" | "pendiente_nomina" | "aprobado" | "rechazado" | "cancelado";
  approvers?: ApproverInfo[];
  approvalMessageHtml?: string;
  motivoRechazo?: string;
  motivoRevision?: string;

  // Metadata
  updatedAt?: string;
  createdAt?: string;

  // Propiedades legacy a eliminar progresivamente
  empleadoId?: string;
  nombre?: string;
  email?: string;
  cedula?: string;
  cargo?: string;
  salario?: number;
  fecha?: string;
  diaSemana?: number | string;
  horaInicio?: string;
  horaFinal?: string;
  motivo?: string;
  cantidadHoras?: number;
  horasExtraDiurna?: number;
  horasExtraNocturna?: number;
  recargosDominicalFestivo?: number;
  valorHorasExtra?: number;
  centroCosto?: string | CentroCostoItem[];
}

export class RequestsRepository extends RepositoryBase<RequestEntity> {
  constructor() {
    super("solicitudes_horas_extra");
  }

  async createNew(payload: Partial<RequestEntity>) {
    const now = getBogotaTimestamp();
    
    // Si viene la nueva estructura, usarla. Si no, inicializar con valores por defecto.
    const item: RequestEntity = {
      id: uuidv4(),
      submissionId: payload.submissionId || Math.random().toString(36).substring(2, 11),
      
      empleado: payload.empleado || {
        id: payload.cedula || "unknown",
        nombre: payload.nombre,
        email: (payload as any).email,
        cedula: payload.cedula,
        cargo: payload.cargo,
        salario: payload.salario
      },

      totales: payload.totales || {
        cantidadHoras: payload.cantidadHoras || 0,
        horasExtraDiurna: payload.horasExtraDiurna || 0,
        horasExtraNocturna: payload.horasExtraNocturna || 0,
        recargosDominicalFestivo: payload.recargosDominicalFestivo || 0,
        valorTotal: (payload as any).valorTotal || payload.valorHorasExtra || 0,
        centrosCostoInvolucrados: Array.isArray(payload.centroCosto) 
          ? payload.centroCosto.map(c => c.numero)
          : ((payload as any).totales?.centrosCostoInvolucrados || [])
      },

      dateEntries: payload.dateEntries || [],
      estado: payload.estado || "pendiente",
      approvers: payload.approvers,
      approvalMessageHtml: payload.approvalMessageHtml,
      updatedAt: now,
      createdAt: now,
    };

    return this.create(item);
  }
}
