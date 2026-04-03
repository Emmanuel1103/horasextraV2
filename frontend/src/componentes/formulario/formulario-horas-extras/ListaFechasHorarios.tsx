import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { DateEntry } from "@/types";
import { EntradaFechaHorario } from "./EntradaFechaHorario";

interface ListaFechasHorariosProps {
  dateEntries: DateEntry[];
  showErrors: boolean;
  allCentroCostos: Array<{ numero: string; nombre: string }>;
  isFormValid: () => boolean;
  onAddDateEntry: () => void;
  onRemoveEntry: (index: number) => void;
  onUpdateEntry: (index: number, field: keyof DateEntry, value: any) => void;
}

export const ListaFechasHorarios = ({
  dateEntries,
  showErrors,
  allCentroCostos,
  isFormValid,
  onAddDateEntry,
  onRemoveEntry,
  onUpdateEntry
}: ListaFechasHorariosProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(Math.max(0, dateEntries.length - 1));

  useEffect(() => {
    setExpandedIndex(Math.max(0, dateEntries.length - 1));
  }, [dateEntries.length]);

  const isEntryComplete = (entry: DateEntry) => {
    const hasRequiredFields = Boolean(entry.fecha && entry.horaInicio && entry.horaFinal && entry.motivo && entry.centroCosto.length > 0);
    if (!hasRequiredFields) return false;

    const total = (entry.centroCosto || []).reduce((acc, curr) => acc + (curr.porcentaje || 0), 0);
    return total === 100;
  };

  const lastEntry = dateEntries[dateEntries.length - 1];
  const canAddDate = Boolean(lastEntry && isEntryComplete(lastEntry));

  const handleAddDateEntry = () => {
    if (!canAddDate) return;
    onAddDateEntry();
  };

  const handleToggleExpand = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="space-y-4">
      <div className="border-b pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Fechas y horarios</h3>
            {!isFormValid() && (
              <p className="text-xs text-green-600 font-medium">
                La sumatoria de los centros de costos debe ser 100%.
              </p>
            )}
          </div>
          <Button
            type="button"
            onClick={handleAddDateEntry}
            variant="outline"
            size="sm"
            disabled={!canAddDate}
            className="gap-2 border-gray-100 text-green-700 hover:bg-green-50 hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Agregar fecha
          </Button>
        </div>
      </div>

      {dateEntries.map((entry, index) => (
        <EntradaFechaHorario
          key={index}
          entry={entry}
          index={index}
          canRemove={dateEntries.length > 1}
          isExpanded={expandedIndex === index}
          isComplete={isEntryComplete(entry)}
          showErrors={showErrors}
          allCentroCostos={allCentroCostos}
          onToggleExpand={handleToggleExpand}
          onUpdateEntry={onUpdateEntry}
          onRemoveEntry={onRemoveEntry}
        />
      ))}
    </div>
  );
};