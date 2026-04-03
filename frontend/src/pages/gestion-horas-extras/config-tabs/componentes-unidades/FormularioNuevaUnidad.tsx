import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { Unidad, CentroCosto } from "@/types";

interface FormularioNuevaUnidadProps {
  unidades: Unidad[];
  onUnidadesChange: (unidades: Unidad[]) => void;
  onCancel: () => void;
}

export const FormularioNuevaUnidad = ({
  unidades,
  onUnidadesChange,
  onCancel
}: FormularioNuevaUnidadProps) => {
  const [unidadNombre, setUnidadNombre] = useState("");
  const [directorNombre, setDirectorNombre] = useState("");
  const [directorEmail, setDirectorEmail] = useState("");
  const [newCeCoNumero, setNewCeCoNumero] = useState("");
  const [newCeCoNombre, setNewCeCoNombre] = useState("");
  const [tempCeCos, setTempCeCos] = useState<CentroCosto[]>([]);

  const handleAddCeCo = () => {
    const numero = newCeCoNumero.trim();
    const nombre = newCeCoNombre.trim();

    if (!numero || !nombre) {
      toast.error("Completa número y nombre del centro de costo");
      return;
    }

    const duplicated = tempCeCos.some(
      (cc) => cc.numero.trim().toLowerCase() === numero.toLowerCase()
    );

    if (duplicated) {
      toast.error("Ya existe un centro de costo con ese número");
      return;
    }
    
    const newCeCo: CentroCosto = {
      id: `ceco-${Date.now()}`,
      numero,
      nombre
    };
    
    setTempCeCos([...tempCeCos, newCeCo]);
    setNewCeCoNumero("");
    setNewCeCoNombre("");
  };

  const handleRemoveCeCo = (index: number) => {
    setTempCeCos(tempCeCos.filter((_, i) => i !== index));
  };

  const handleSaveUnidad = () => {
    if (!unidadNombre || !directorNombre || !directorEmail || tempCeCos.length === 0) {
      toast.error("Completa todos los campos de la unidad");
      return;
    }

    const normalizedCeCos = tempCeCos
      .map((cc) => ({
        ...cc,
        numero: cc.numero.trim(),
        nombre: cc.nombre.trim(),
      }))
      .filter((cc) => cc.numero && cc.nombre);

    if (normalizedCeCos.length === 0) {
      toast.error("Agrega al menos un centro de costo válido");
      return;
    }

    const newUnidad: Unidad = {
      id: `unidad-${Date.now()}`,
      nombre: unidadNombre.trim(),
      director: {
        id: `dir-${Date.now()}`,
        nombre: directorNombre.trim(),
        email: directorEmail.trim()
      },
      centrosCosto: normalizedCeCos
    };

    onUnidadesChange([...unidades, newUnidad]);
    toast.success("Unidad agregada exitosamente");
    onCancel(); // Cerrar el formulario
  };

  return (
    <div className="bg-green-50 p-4 rounded-lg space-y-4 border border-primary/20">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-primary">Nueva unidad</h4>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre de la unidad</Label>
          <Input 
            value={unidadNombre} 
            onChange={e => setUnidadNombre(e.target.value)} 
            placeholder="Ej: Unidad de Educación" 
          />
        </div>
        <div className="space-y-2">
          <Label>Nombre del director</Label>
          <Input 
            value={directorNombre} 
            onChange={e => setDirectorNombre(e.target.value)} 
            placeholder="Nombre completo" 
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Email del director</Label>
          <Input 
            value={directorEmail} 
            onChange={e => setDirectorEmail(e.target.value)} 
            placeholder="email@fundacion.org" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Centros de costo</Label>
        <div className="flex gap-2">
          <Input 
            value={newCeCoNumero} 
            onChange={e => setNewCeCoNumero(e.target.value)} 
            placeholder="Número" 
            className="w-1/3" 
          />
          <Input 
            value={newCeCoNombre} 
            onChange={e => setNewCeCoNombre(e.target.value)} 
            placeholder="Nombre" 
            className="w-2/3" 
          />
          <Button 
            onClick={handleAddCeCo} 
            size="sm" 
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {tempCeCos.length > 0 && (
          <div className="text-sm space-y-1 mt-2">
            {tempCeCos.map((cc, idx) => (
              <div key={idx} className="flex justify-between items-center bg-background p-2 rounded border">
                <span>{cc.numero} - {cc.nombre}</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0" 
                  onClick={() => handleRemoveCeCo(idx)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleSaveUnidad} className="w-full mt-2">
        Guardar unidad
      </Button>
    </div>
  );
};