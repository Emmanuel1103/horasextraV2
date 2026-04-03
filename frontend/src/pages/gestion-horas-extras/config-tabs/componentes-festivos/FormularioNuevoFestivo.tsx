import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Holiday } from "@/types";

interface FormularioNuevoFestivoProps {
  festivos: Holiday[];
  onFestivosChange: (festivos: Holiday[]) => void;
}

export const FormularioNuevoFestivo = ({
  festivos,
  onFestivosChange
}: FormularioNuevoFestivoProps) => {
  const [nombreFestivo, setNombreFestivo] = useState("");
  const [fechaFestivo, setFechaFestivo] = useState("");
  const hasActiveInputs = nombreFestivo.trim() !== "" || fechaFestivo !== "";

  const handleLimpiarCampos = () => {
    setNombreFestivo("");
    setFechaFestivo("");
  };

  const handleAgregarFestivo = () => {
    if (!fechaFestivo || !nombreFestivo) {
      if (!nombreFestivo) toast.error("Ingresa el nombre del festivo");
      if (!fechaFestivo) toast.error("Selecciona la fecha del festivo");
      return;
    }
    
    const newDate = new Date(fechaFestivo);
    // Adjust for timezone offset to keep the selected date
    const userTimezoneOffset = newDate.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(newDate.getTime() + userTimezoneOffset);

    const nuevoFestivo: Holiday = {
      date: adjustedDate,
      name: nombreFestivo
    };

    // Sort by date
    const festivosActualizados = [...festivos, nuevoFestivo]
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    onFestivosChange(festivosActualizados);
    setFechaFestivo("");
    setNombreFestivo("");
    toast.success("Día festivo agregado");
  };

  return (
    <div className="space-y-4">
      <Label>Agregar día festivo</Label>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Nombre del festivo (Ej: Navidad)"
            value={nombreFestivo}
            onChange={(e) => setNombreFestivo(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Input
            type="date"
            value={fechaFestivo}
            onChange={(e) => setFechaFestivo(e.target.value)}
          />
        </div>
        {hasActiveInputs && (
          <Button variant="outline" onClick={handleLimpiarCampos}>
            Limpiar
          </Button>
        )}
        <Button onClick={handleAgregarFestivo} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>
    </div>
  );
};