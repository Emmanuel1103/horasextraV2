import { Label } from "@/components/ui/label";
import { CircleHelp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ResumenCalculosProps {
    calculation: {
        cantidadHoras: number;
        horasExtraDiurna: number;
        horasExtraNocturna: number;
        recargosDominicalFestivo: number;
        valorHorasExtra: number;
    } | null;
}

export const ResumenCalculos = ({ calculation }: ResumenCalculosProps) => {
    const hasDominicalFestivo = (calculation?.recargosDominicalFestivo || 0) > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <h3>Cálculo de horas</h3>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-green-300 bg-green-50 text-green-700 transition-colors hover:bg-green-100 hover:text-green-800"
                            aria-label="Ayuda de cálculo"
                            title="Ayuda de cálculo"
                        >
                            <CircleHelp className="h-4 w-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-xs leading-relaxed">
                        Los valores calculados son estimados basados en la configuración actual del sistema y el salario ingresado. Verifique que los turnos y recargos correspondan a la normativa vigente.
                    </TooltipContent>
                </Tooltip>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-4 border flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 flex flex-col items-center">
                        <Label className="text-xs text-muted-foreground">Cant. horas total</Label>
                        <p className="text-2xl font-medium">{(calculation?.cantidadHoras || 0).toFixed(2)} h</p>
                    </div>
                    <div className="space-y-1 flex flex-col items-center border-l pl-4 overflow-hidden">
                        <Label className="text-xs text-muted-foreground">Valor total</Label>
                        <p className="text-2xl font-medium text-green-600 truncate max-w-full">
                            {formatCurrency(calculation?.valorHorasExtra || 0)}
                        </p>
                    </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm px-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Horas diurnas:</span>
                        <span className="font-medium">{(calculation?.horasExtraDiurna || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Horas nocturnas:</span>
                        <span className="font-medium">{(calculation?.horasExtraNocturna || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Recargos dom/fest:</span>
                        <span className="font-medium">{hasDominicalFestivo ? "Sí" : "No"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
