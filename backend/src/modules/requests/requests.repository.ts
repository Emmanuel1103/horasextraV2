/**
 * requests.repository.ts — repositorio de persistencia para solicitudes
 *
 * define las interfaces de datos y la clase encargada de interactuar
 * con la colección de cosmos db para las solicitudes de horas extras.
 */

import { RepositoryBase } from "../../db/cosmos/repositoryBase";
import { v4 as uuidv4 } from "uuid";
import { getBogotaTimestamp } from "../../utils/datetime";

export interface CentroCostoItem {
  numero: string;
  porcentaje?: number;
}

/**
 * información de seguimiento para cada aprobador asignado a una solicitud.
 */
export interface ApproverInfo {
  email: string;
  name?: string;
  estado: "pendiente" | "en_revision" | "aprobado" | "rechazado";
  fechaAprobacion?: string;
  token?: string;
  centrosCosto?: string[]; // centros de costo bajo la responsabilidad de este aprobador
  motivoRechazo?: string;
  motivoRevision?: string;
  fechaRevisionSolicitada?: string;
  fechaRevisionCompletada?: string;
}

/**
 * entidad principal de la solicitud de horas extras.
 */
export interface RequestEntity {
  id: string;
  submissionId?: string;

  // datos del empleado
  empleado: {
    id: string;
    nombre?: string;
    email?: string;
    cedula?: string;
    cargo?: string;
    salario?: number;
  };

  // totales consolidados de la solicitud
  totales: {
    cantidadHoras: number;
    horasExtraDiurna: number;
    horasExtraNocturna: number;
    recargosDominicalFestivo: number;
    valorTotal: number;
    centrosCostoInvolucrados: string[];
  };

  // listado detallado de fechas y horas reportadas
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

  // gestión de estados y aprobaciones
  estado: "pendiente" | "en_revision" | "pendiente_nomina" | "aprobado" | "rechazado" | "cancelado";
  approvers?: ApproverInfo[];
  approvalMessageHtml?: string;
  motivoRechazo?: string;
  motivoRevision?: string;

  // metadatos de auditoría
  updatedAt?: string;
  createdAt?: string;

  // propiedades de compatibilidad legacy
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

  /**
   * crea un nuevo registro de solicitud inicializando metadatos y estructuras base.
   */
  async createNew(payload: Partial<RequestEntity>) {
    const now = getBogotaTimestamp();
    
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

