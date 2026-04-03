import { OvertimeRequestsTable } from "@/componentes/tablas/OvertimeRequestsTable";
import { ReportFilters } from "@/componentes/tablas/ReportFilters";
import { StatCards } from "@/componentes/estadisticas/StatCards";
import { SectionHeader } from "@/componentes/diseno/SectionHeader";
import { PageContainer } from "@/componentes/diseno/PageContainer";
import type { OvertimeRecord, Unidad, HorariosConfig } from "@/types";
import { getRecordHours, getRecordAmount } from "@/utils/reportUtils";
import { useReportExport } from "@/hooks/useReportExport";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ReportesTabProps {
  records: OvertimeRecord[];
  filteredRecords: OvertimeRecord[];
  onEdit: (id: string, updatedData: Partial<OvertimeRecord>) => void;
  onApprove: (id: string) => void;
  filterName: string;
  onFilterNameChange: (value: string) => void;
  filterStatus: "todos" | "aprobado" | "rechazado";
  onFilterStatusChange: (value: "todos" | "aprobado" | "rechazado") => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  onClearFilters: () => void;
  overtimeRates: {
    DIURNA: number;
    NOCTURNA: number;
    DOMINICAL_DIURNA: number;
    DOMINICAL_NOCTURNA: number;
  };
  unidades?: Unidad[];
  holidays?: any[];
  horariosConfig?: HorariosConfig;
}

export const ReportesTab = ({
  records,
  filteredRecords,
  filterName,
  onFilterNameChange,
  filterStatus,
  onFilterStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClearFilters,
  overtimeRates,
  unidades,
  holidays,
  horariosConfig
}: ReportesTabProps) => {
  const historyRecords = records.filter(record => record.estado === "aprobado" || record.estado === "rechazado");

  // Si hay filtros activos, usar filteredRecords (incluso si está vacío).
  // Si no hay filtros, usar historyRecords.
  const hasActiveFilters =
    filterName.trim() !== "" ||
    filterStatus !== "todos" ||
    startDate !== "" ||
    endDate !== "";
  
  const displayRecords = hasActiveFilters ? filteredRecords : historyRecords;
  const approvedRecords = displayRecords.filter(record => record.estado === "aprobado");

  const totalHours = approvedRecords.reduce((sum, record) => sum + getRecordHours(record), 0);
  const totalAmount = approvedRecords.reduce((sum, record) => sum + getRecordAmount(record), 0);

  const { handleExportRealesTrabajadas, handleExportRealesPagadas } = useReportExport({
    records,
    filteredRecords,
    displayRecords,
    historyRecords,
    overtimeRates,
    holidays,
    horariosConfig
  });

  return (
    <PageContainer>
      <SectionHeader
        title="Estadísticas de horas extras"
        description="Resumen de los registros aprobados y procesados"
      />

      <StatCards
        totalRecords={approvedRecords.length}
        totalHours={totalHours}
        totalAmount={totalAmount}
      />

      <SectionHeader
        title="Reporte de horas extras"
        description={
          displayRecords.length === 0
            ? "No hay registros para mostrar"
            : `Mostrando ${displayRecords.length} registro${displayRecords.length !== 1 ? 's' : ''}`
        }
        actions={
          <div className="flex gap-2">
            <Button onClick={handleExportRealesTrabajadas} variant="outline" className="text-green-700 border-green-200 hover:bg-green-50">
              <Download className="mr-2 h-4 w-4" />
              Horas Totales Trabajadas
            </Button>
            <Button onClick={handleExportRealesPagadas} className="bg-green-600 hover:bg-green-700">
              <Download className="mr-2 h-4 w-4" />
              Horas Reales a Pagar
            </Button>
          </div>
        }
      />

      <ReportFilters
        filterName={filterName}
        onFilterNameChange={onFilterNameChange}
        filterStatus={filterStatus}
        onFilterStatusChange={onFilterStatusChange}
        startDate={startDate}
        onStartDateChange={onStartDateChange}
        endDate={endDate}
        onEndDateChange={onEndDateChange}
        onClearFilters={onClearFilters}
      />

      <OvertimeRequestsTable
        records={displayRecords}
        allRecords={records}
        readOnly={true}
        overtimeRates={overtimeRates}
        unidades={unidades}
        holidays={holidays}
      />
    </PageContainer>
  );
};
