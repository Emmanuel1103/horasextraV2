import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2, Pencil, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Unidad } from "@/types";

interface ItemUnidadExpandibleProps {
  unidad: Unidad;
  index: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onDelete: (index: number) => void;
  onUpdate: (index: number, unidad: Unidad) => void;
}

export const ItemUnidadExpandible = ({
  unidad,
  index,
  isExpanded,
  onToggleExpand,
  onDelete,
  onUpdate,
}: ItemUnidadExpandibleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editUnidadNombre, setEditUnidadNombre] = useState(unidad.nombre);
  const [editDirectorNombre, setEditDirectorNombre] = useState(unidad.director.nombre);
  const [editDirectorEmail, setEditDirectorEmail] = useState(unidad.director.email);
  const [editCentrosCosto, setEditCentrosCosto] = useState(unidad.centrosCosto);
  const [newCeCoNumero, setNewCeCoNumero] = useState("");
  const [newCeCoNombre, setNewCeCoNombre] = useState("");

  const startEditing = () => {
    setEditUnidadNombre(unidad.nombre);
    setEditDirectorNombre(unidad.director.nombre);
    setEditDirectorEmail(unidad.director.email);
    setEditCentrosCosto(unidad.centrosCosto);
    setNewCeCoNumero("");
    setNewCeCoNombre("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditUnidadNombre(unidad.nombre);
    setEditDirectorNombre(unidad.director.nombre);
    setEditDirectorEmail(unidad.director.email);
    setEditCentrosCosto(unidad.centrosCosto);
    setNewCeCoNumero("");
    setNewCeCoNombre("");
  };

  const addCentroCosto = () => {
    if (!newCeCoNumero.trim() || !newCeCoNombre.trim()) {
      toast.error("Completa número y nombre del centro de costo");
      return;
    }

    const duplicated = editCentrosCosto.some(
      (cc) => cc.numero.trim().toLowerCase() === newCeCoNumero.trim().toLowerCase()
    );

    if (duplicated) {
      toast.error("Ya existe un centro de costo con ese número");
      return;
    }

    setEditCentrosCosto([
      ...editCentrosCosto,
      {
        id: `ceco-${Date.now()}`,
        numero: newCeCoNumero.trim(),
        nombre: newCeCoNombre.trim(),
      },
    ]);
    setNewCeCoNumero("");
    setNewCeCoNombre("");
  };

  const removeCentroCosto = (ccId: string) => {
    setEditCentrosCosto((prev) => prev.filter((cc) => cc.id !== ccId));
  };

  const saveEditing = () => {
    if (
      !editUnidadNombre.trim() ||
      !editDirectorNombre.trim() ||
      !editDirectorEmail.trim() ||
      editCentrosCosto.length === 0
    ) {
      toast.error("Completa todos los campos y deja al menos un centro de costo");
      return;
    }

    const unidadActualizada: Unidad = {
      ...unidad,
      nombre: editUnidadNombre.trim(),
      director: {
        ...unidad.director,
        nombre: editDirectorNombre.trim(),
        email: editDirectorEmail.trim(),
      },
      centrosCosto: editCentrosCosto,
    };

    onUpdate(index, unidadActualizada);
    setIsEditing(false);
    toast.success("Unidad actualizada");
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="bg-muted/30 p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onToggleExpand(unidad.id)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <p className="font-semibold text-sm">{unidad.nombre}</p>
            <p className="text-xs text-muted-foreground">Dir: {unidad.director.nombre}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  saveEditing();
                }}
                title="Guardar cambios"
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelEditing();
                }}
                title="Cancelar edición"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                startEditing();
              }}
              title="Editar unidad"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(index);
            }}
            title="Eliminar unidad"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 bg-background border-t space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <span className="font-semibold">Unidad:</span>
              {isEditing ? (
                <Input
                  value={editUnidadNombre}
                  onChange={(e) => setEditUnidadNombre(e.target.value)}
                  placeholder="Nombre de la unidad"
                />
              ) : (
                <p className="text-muted-foreground">{unidad.nombre}</p>
              )}
            </div>

            <div className="space-y-2">
              <span className="font-semibold">Director:</span>
              {isEditing ? (
                <Input
                  value={editDirectorNombre}
                  onChange={(e) => setEditDirectorNombre(e.target.value)}
                  placeholder="Nombre del director"
                />
              ) : (
                <p className="text-muted-foreground">{unidad.director.nombre}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <span className="font-semibold">Email Director:</span>
              {isEditing ? (
                <Input
                  value={editDirectorEmail}
                  onChange={(e) => setEditDirectorEmail(e.target.value)}
                  placeholder="email@dominio.com"
                />
              ) : (
                <p className="text-muted-foreground">{unidad.director.email}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <span className="font-semibold">
                Centros de Costo ({isEditing ? editCentrosCosto.length : unidad.centrosCosto.length}):
              </span>

              <div className="space-y-2">
                {(isEditing ? editCentrosCosto : unidad.centrosCosto).map((cc) => (
                  <div key={cc.id} className="flex items-center justify-between rounded border p-2">
                    <p className="text-muted-foreground">{cc.numero} - {cc.nombre}</p>
                    {isEditing && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => removeCentroCosto(cc.id)}
                        title="Eliminar centro de costo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {isEditing && (
                <div className="flex flex-col md:flex-row gap-2 pt-1">
                  <Input
                    value={newCeCoNumero}
                    onChange={(e) => setNewCeCoNumero(e.target.value)}
                    placeholder="Número"
                    className="md:w-1/3"
                  />
                  <Input
                    value={newCeCoNombre}
                    onChange={(e) => setNewCeCoNombre(e.target.value)}
                    placeholder="Nombre"
                    className="md:w-2/3"
                  />
                  <Button type="button" onClick={addCentroCosto} className="gap-1">
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};