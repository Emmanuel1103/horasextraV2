import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/types";

interface FormData {
  nombre: string;
  email: string;
  cedula: string;
  cargo: string;
  centroCosto: string;
}

interface SeccionInformacionColaboradorProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  handleNumericInputChange: (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => void;
  showErrors: boolean;
  mode: ViewMode;
  getText: (key: string, defaultValue?: string) => string;
}

export const SeccionInformacionColaborador = ({
  formData,
  setFormData,
  handleNumericInputChange,
  showErrors,
  mode,
  getText
}: SeccionInformacionColaboradorProps) => {
  return (
    <div className="space-y-4">
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold text-gray-900">Información del colaborador</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre" className={cn(showErrors && !formData.nombre && "text-red-500")}>
            {getText("LABEL_NOMBRE", "Nombre del colaborador")} *
          </Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder={getText("PLACEHOLDER_NOMBRE", "Juan Pérez")}
            className={cn(
              "border-input focus:ring-primary",
              showErrors && !formData.nombre && "border-red-500 bg-red-50/50"
            )}
          />
          {showErrors && !formData.nombre && <p className="text-[10px] text-red-500 font-medium">Este campo es obligatorio</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className={cn(showErrors && !formData.email && "text-red-500")}>
            {getText("PLACEHOLDER_CORREO", "Correo electrónico")} *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={getText("PLACEHOLDER_CORREO", "correo@empresa.com")}
            className={cn(
              "border-input focus:ring-primary",
              showErrors && !formData.email && "border-red-500 bg-red-50/50"
            )}
          />
          {showErrors && !formData.email && <p className="text-[10px] text-red-500 font-medium">Este campo es obligatorio</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cedula" className={cn(showErrors && !formData.cedula && "text-red-500")}>
            {getText("TABLE_HEADER_CEDULA", "Cédula")} *
          </Label>
          <Input
            id="cedula"
            type="text"
            inputMode="numeric"
            value={formData.cedula}
            onChange={(e) => handleNumericInputChange(e, 'cedula')}
            placeholder={getText("PLACEHOLDER_CEDULA", "Ej: 1234567890")}
            className={cn(
              "border-input focus:ring-primary h-10 transition-all",
              showErrors && !formData.cedula && "border-red-500 bg-red-50/50"
            )}
          />
          {showErrors && !formData.cedula && <p className="text-[10px] text-red-500 font-medium">Este campo es obligatorio</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cargo" className={cn(showErrors && !formData.cargo && "text-red-500")}>
            Cargo *
          </Label>
          <Input
            id="cargo"
            value={formData.cargo}
            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
            placeholder="Ej: Conductor"
            className={cn(
              "border-input focus:ring-primary",
              showErrors && !formData.cargo && "border-red-500 bg-red-50/50"
            )}
          />
          {showErrors && !formData.cargo && <p className="text-[10px] text-red-500 font-medium">Este campo es obligatorio</p>}
        </div>


      </div>
    </div>
  );
};