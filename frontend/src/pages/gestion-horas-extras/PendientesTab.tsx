import { OvertimeRequestsTable } from "@/componentes/tablas/OvertimeRequestsTable";
import { PageContainer } from "@/componentes/diseno/PageContainer";
import { SectionHeader } from "@/componentes/diseno/SectionHeader";
import type { OvertimeRecord, Unidad } from "@/types";

interface PendientesTabProps {
  records: OvertimeRecord[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMarkReviewed: (id: string, reviewedApproverToken?: string) => void;
  onEdit: (id: string, updatedData: Partial<OvertimeRecord>) => void;
  overtimeRates: {
    DIURNA: number;
    NOCTURNA: number;
    DOMINICAL_DIURNA: number;
    DOMINICAL_NOCTURNA: number;
  };
  unidades?: Unidad[];
  holidays?: any[];
}

export const PendientesTab = ({
  records,
  onApprove,
  onReject,
  onMarkReviewed,
  onEdit,
  overtimeRates,
  unidades,
  holidays
}: PendientesTabProps) => {
  const pendingRecords = records.filter(record => 
    record.estado === "pendiente" || record.estado === "en_revision" || record.estado === "pendiente_nomina"
  );

  return (
    <PageContainer>
      <SectionHeader
        title="Registros en revisión"
        description={
          pendingRecords.length === 0
            ? "No hay registros en revisión"
            : `Mostrando ${pendingRecords.length} registro${pendingRecords.length !== 1 ? 's' : ''} esperando aprobación`
        }
      />

      <OvertimeRequestsTable
        records={pendingRecords}
        allRecords={records}
        onApprove={onApprove}
        onReject={onReject}
        onMarkReviewed={onMarkReviewed}
        onEdit={onEdit}
        overtimeRates={overtimeRates}
        unidades={unidades}
        holidays={holidays}
      />
    </PageContainer>
  );
};
