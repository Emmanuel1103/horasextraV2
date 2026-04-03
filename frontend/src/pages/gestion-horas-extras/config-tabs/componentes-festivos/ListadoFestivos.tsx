import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { Holiday } from "@/types";

interface ListadoFestivosProps {
  festivos: Holiday[];
  onFestivosChange: (festivos: Holiday[]) => void;
}

export const ListadoFestivos = ({
  festivos,
  onFestivosChange
}: ListadoFestivosProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");

  const toDateObject = (value: Date | string): Date => {
    return value instanceof Date ? value : new Date(value);
  };

  const toInputDate = (value: Date | string): string => {
    const date = toDateObject(value);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleIniciarEdicion = (index: number) => {
    const festivo = festivos[index];
    setEditingIndex(index);
    setEditName(festivo.name);
    setEditDate(toInputDate(festivo.date));
  };

  const handleCancelarEdicion = () => {
    setEditingIndex(null);
    setEditName("");
    setEditDate("");
  };

  const handleGuardarEdicion = () => {
    if (editingIndex === null) return;

    if (!editName.trim() || !editDate) {
      toast.error("Completa el nombre y la fecha del festivo");
      return;
    }

    const newDate = new Date(editDate);
    const userTimezoneOffset = newDate.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(newDate.getTime() + userTimezoneOffset);

    if (Number.isNaN(adjustedDate.getTime())) {
      toast.error("La fecha no es valida");
      return;
    }

    const festivosActualizados = festivos
      .map((festivo, index) =>
        index === editingIndex
          ? { ...festivo, name: editName.trim(), date: adjustedDate }
          : festivo
      )
      .sort((a, b) => toDateObject(a.date).getTime() - toDateObject(b.date).getTime());

    onFestivosChange(festivosActualizados);
    handleCancelarEdicion();
    toast.success("Día festivo actualizado");
  };
  
  const handleEliminarFestivo = (index: number) => {
    const festivosActualizados = festivos.filter((_, i) => i !== index);
    onFestivosChange(festivosActualizados);
    toast.success("Día festivo eliminado");

    if (editingIndex === index) {
      handleCancelarEdicion();
    }
  };

  if (!festivos || festivos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No hay días festivos configurados
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {festivos.map((festivo, index) => (
        <div 
          key={index} 
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          {editingIndex === index ? (
            <div className="flex w-full flex-col gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nombre del festivo"
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="max-w-[220px]"
                />
                <Button size="sm" onClick={handleGuardarEdicion} className="gap-1">
                  <Check className="h-4 w-4" />
                  Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelarEdicion} className="gap-1">
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{festivo.name}</span>
                <span className="text-xs text-muted-foreground">
                  {toDateObject(festivo.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleIniciarEdicion(index)}
                  className="h-8 w-8 p-0"
                  title="Editar festivo"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminarFestivo(index)}
                  className="h-8 w-8 p-0"
                  title="Eliminar festivo"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};