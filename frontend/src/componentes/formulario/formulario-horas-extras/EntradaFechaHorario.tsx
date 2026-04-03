import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronDown, ChevronUp, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { DateEntry } from "@/types";
import { CostCenterSection } from "../components/CostCenterSection";

interface EntradaFechaHorarioProps {
  entry: DateEntry;
  index: number;
  canRemove: boolean;
  isExpanded: boolean;
  isComplete: boolean;
  showErrors: boolean;
  allCentroCostos: Array<{ numero: string; nombre: string }>;
  onToggleExpand: (index: number) => void;
  onUpdateEntry: (index: number, field: keyof DateEntry, value: any) => void;
  onRemoveEntry: (index: number) => void;
}

export const EntradaFechaHorario = ({
  entry,
  index,
  canRemove,
  isExpanded,
  isComplete,
  showErrors,
  allCentroCostos,
  onToggleExpand,
  onUpdateEntry,
  onRemoveEntry
}: EntradaFechaHorarioProps) => {
  const labelBaseClass = "text-xs font-semibold uppercase tracking-wider";
  const total = (entry.centroCosto || []).reduce((acc: number, curr: any) => acc + (curr.porcentaje || 0), 0);
  const hasInvalidPercentage = entry.centroCosto.length > 0 && total !== 100;

  return (
    <Card 
      className={cn(
        "p-4 border-border/50 transition-all",
        hasInvalidPercentage ? "border-green-200 bg-green-50/5" : ""
      )}
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => onToggleExpand(index)}
          className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">Fecha {index + 1}</p>
            <p className="text-xs text-slate-600">
              {entry.fecha ? format(entry.fecha, "dd/MM/yyyy", { locale: es }) : "Sin fecha seleccionada"}
              {entry.horaInicio && entry.horaFinal ? ` | ${entry.horaInicio} - ${entry.horaFinal}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              isComplete ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            )}>
              {isComplete ? "Completa" : "Pendiente"}
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </div>
        </button>

        {isExpanded && (
          <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fecha */}
          <div className="space-y-2">
            <Label className={cn(labelBaseClass, "text-slate-500")}>Fecha *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "group h-10 w-full justify-start text-left font-normal hover:bg-green-600 hover:text-white",
                    !entry.fecha && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-green-600 transition-colors group-hover:text-white" />
                  {entry.fecha ? (
                    <div className="flex flex-col leading-tight">
                      <span className="font-semibold text-slate-900 transition-colors group-hover:text-white">
                        {format(entry.fecha, "dd/MM/yyyy", { locale: es })}
                      </span>
                      <span className="text-[10px] text-slate-500 transition-colors group-hover:text-white/90">
                        {format(entry.fecha, "EEEE", { locale: es })}
                      </span>
                    </div>
                  ) : (
                    <span className="font-semibold text-slate-500 transition-colors group-hover:text-white">
                      Selecciona una fecha
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={entry.fecha}
                  onSelect={(date) => date && onUpdateEntry(index, "fecha", date)}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Hora Inicio */}
          <div className="space-y-2">
            <Label className={cn(
              labelBaseClass,
              showErrors && !entry.horaInicio && "text-red-500",
              !showErrors && "text-slate-500"
            )}>
              Hora inicio *
            </Label>
            <Input
              type="time"
              value={entry.horaInicio}
              onChange={(e) => onUpdateEntry(index, "horaInicio", e.target.value)}
              className={cn(
                "border-input focus-visible:ring-green-500 h-10",
                showErrors && !entry.horaInicio && "border-red-500 bg-red-50/50"
              )}
            />
            {showErrors && !entry.horaInicio && (
              <p className="text-[10px] text-red-500 font-medium">Requerido</p>
            )}
          </div>

          {/* Hora Final */}
          <div className="space-y-2">
            <Label className={cn(
              labelBaseClass,
              showErrors && !entry.horaFinal && "text-red-500",
              !showErrors && "text-slate-500"
            )}>
              Hora final *
            </Label>
            <div className="flex gap-2">
              <Input
                type="time"
                value={entry.horaFinal}
                onChange={(e) => onUpdateEntry(index, "horaFinal", e.target.value)}
                className={cn(
                  "border-input focus-visible:ring-green-500 h-10",
                  showErrors && !entry.horaFinal && "border-red-500 bg-red-50/50"
                )}
              />
              {canRemove && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onRemoveEntry(index)}
                  className="text-red-600 border-red-600/20 hover:bg-red-50 h-10 w-10 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {showErrors && !entry.horaFinal && (
              <p className="text-[10px] text-red-500 font-medium">Requerido</p>
            )}
          </div>
        </div>

        {/* Centro de Costo */}
        <div className="py-2 border-y border-slate-100/50">
          <CostCenterSection
            index={index}
            selectedCeCos={entry.centroCosto as any}
            allCentroCostos={allCentroCostos}
            onUpdate={(idx, cecos) => onUpdateEntry(idx, "centroCosto", cecos)}
            showErrors={showErrors}
          />
        </div>

        {/* Descripción del servicio */}
        <div className="space-y-2">
          <Label className={cn(
            labelBaseClass,
            showErrors && !entry.motivo && "text-red-500",
            !showErrors && "text-slate-500"
          )} htmlFor={`motivo-${index}`}>
            Descripción del servicio *
          </Label>
          <Textarea
            id={`motivo-${index}`}
            value={entry.motivo}
            onChange={(e) => onUpdateEntry(index, "motivo", e.target.value)}
            placeholder="Describe detalladamente el servicio prestado para estas horas extras..."
            className={cn(
              "min-h-[80px] border-input focus-visible:ring-green-500 resize-none",
              showErrors && !entry.motivo && "border-red-500 bg-red-50/50"
            )}
          />
          {showErrors && !entry.motivo && (
            <p className="text-[10px] text-red-500 font-medium">Este campo es obligatorio</p>
          )}
        </div>
            </>
          )}
      </div>
    </Card>
  );
};