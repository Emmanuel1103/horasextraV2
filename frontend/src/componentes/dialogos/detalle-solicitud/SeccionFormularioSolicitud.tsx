import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeccionFormularioSolicitudProps {
    formData: {
        salario: string;
        horaInicio: string;
        horaFinal: string;
        motivo: string;
    };
    onSalarioChange: (value: string) => void;
    isEditable: boolean;
}

export const SeccionFormularioSolicitud = ({
    formData,
    onSalarioChange,
    isEditable
}: SeccionFormularioSolicitudProps) => {
    const salarioRaw = String(formData.salario || "").replace(/\D/g, "");
    const salarioDisplay = salarioRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const salarioNumeric = Number(salarioRaw || 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">

                <h3>Detalles de la solicitud</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="horaInicio">Hora inicio</Label>
                    <Input
                        id="horaInicio"
                        type="time"
                        value={formData.horaInicio}
                        readOnly
                        disabled
                        className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="horaFinal">Hora fin</Label>
                    <Input
                        id="horaFinal"
                        type="time"
                        value={formData.horaFinal}
                        readOnly
                        disabled
                        className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="salario" className={cn(salarioNumeric <= 0 && "text-red-500")}>
                    Salario mensual *
                </Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                        id="salario"
                        type="text"
                        inputMode="numeric"
                        className={cn(
                            "pl-7 focus-visible:ring-0 focus-visible:border-green-500 rounded-md",
                            salarioNumeric <= 0 && "border-red-500 bg-red-50"
                        )}
                        value={salarioDisplay}
                        onChange={(e) => {
                            if (!isEditable) return;
                            const val = e.target.value.replace(/\D/g, "").slice(0, 9);
                            onSalarioChange(val);
                        }}
                        disabled={!isEditable}
                    />
                </div>
                {salarioNumeric <= 0 && (
                    <p className="text-[10px] text-red-500 font-medium">
                        El salario debe ser mayor a 0
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="motivo">Descripción del servicio</Label>
                <Textarea
                    id="motivo"
                    value={formData.motivo || ""}
                    readOnly
                    disabled
                    className="min-h-[92px] bg-muted text-muted-foreground cursor-not-allowed resize-none"
                    placeholder="Sin descripción"
                />
            </div>
        </div>
    );
};