import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Unidad } from "@/types";
import { ItemUnidadExpandible } from "./ItemUnidadExpandible";

interface ListadoUnidadesProps {
  unidades: Unidad[];
  onUnidadesChange: (unidades: Unidad[]) => void;
  searchUnidad?: string;
  onSearchUnidadChange?: (value: string) => void;
  showSearch?: boolean;
}

export const ListadoUnidades = ({
  unidades,
  onUnidadesChange,
  searchUnidad,
  onSearchUnidadChange,
  showSearch = true,
}: ListadoUnidadesProps) => {
  const [expandedUnidades, setExpandedUnidades] = useState<Set<string>>(new Set());
  const [internalSearchUnidad, setInternalSearchUnidad] = useState("");

  const filtro = searchUnidad ?? internalSearchUnidad;
  const setFiltro = onSearchUnidadChange ?? setInternalSearchUnidad;

  const toggleExpandUnidad = (id: string) => {
    setExpandedUnidades(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteUnidad = (index: number) => {
    const updated = unidades.filter((_, i) => i !== index);
    onUnidadesChange(updated);
    toast.success("Unidad eliminada");
  };

  const handleUpdateUnidad = (index: number, unidadActualizada: Unidad) => {
    const updated = unidades.map((unidad, i) =>
      i === index ? unidadActualizada : unidad
    );
    onUnidadesChange(updated);
  };

  const filteredUnidades = unidades.filter(u =>
    u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    u.director.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    u.centrosCosto.some(cc => 
      cc.numero.includes(filtro) || 
      cc.nombre.toLowerCase().includes(filtro.toLowerCase())
    )
  );

  return (
    <div className="space-y-2">
      {showSearch && (
        <Input
          placeholder="Buscar unidad, director o centro de costo..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="mb-4"
        />
      )}

      {filteredUnidades.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          No se encontraron unidades
        </p>
      ) : (
        filteredUnidades.map((unidad, index) => (
          <ItemUnidadExpandible
            key={unidad.id}
            unidad={unidad}
            index={unidades.indexOf(unidad)} // Usar índice original para eliminación
            isExpanded={expandedUnidades.has(unidad.id)}
            onToggleExpand={toggleExpandUnidad}
            onDelete={handleDeleteUnidad}
            onUpdate={handleUpdateUnidad}
          />
        ))
      )}
    </div>
  );
};