import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SeccionSeleccionCecoProps {
    cecoInputValue: string;
    onCecoInputChange: (value: string) => void;
    cecoSuggestions: Array<{ numero: string; nombre: string }>;
    onAddCeco: (ceco: { numero: string; nombre: string }) => void;
    selectedCentroCostos: Array<{ numero: string; porcentaje: number; nombre?: string }>;
    allCentroCostos: Array<{ numero: string; nombre: string }>;
    onRemoveCeco: (numero: string) => void;
    onUpdatePorcentaje: (numero: string, newPorcentaje: number) => void;
    lockedCentroCostos?: string[];
    disabled?: boolean;
}

export const SeccionSeleccionCeco = ({
    cecoInputValue,
    onCecoInputChange,
    cecoSuggestions,
    onAddCeco,
    selectedCentroCostos,
    allCentroCostos,
    onRemoveCeco,
    onUpdatePorcentaje,
    lockedCentroCostos = [],
    disabled = false
}: SeccionSeleccionCecoProps) => {
    return (
        <div className="space-y-4">
            <Label>Centros de costo (Total: 100%)</Label>
            
            {!disabled && (
                <div className="relative">
                    <Input
                        placeholder="Buscar centro de costo..."
                        value={cecoInputValue}
                        onChange={(e) => onCecoInputChange(e.target.value)}
                        className="focus-visible:ring-0 focus-visible:border-green-500 rounded-md"
                    />
                    {cecoSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                            {cecoSuggestions.map((cc, index) => (
                                <button
                                    key={`${String(cc.numero || "").trim()}-${index}`}
                                    type="button"
                                    onClick={() => onAddCeco(cc)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                                >
                                    <span className="font-medium">{cc.numero}</span> - {cc.nombre}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-2">
                {selectedCentroCostos.length === 0 && (
                    <p className="text-sm text-yellow-600">Debe asignar al menos un centro de costo.</p>
                )}
                {selectedCentroCostos.map((ceco, index) => {
                    const normalizedNumero = String(ceco.numero || "").trim();
                    const isLocked = lockedCentroCostos.includes(normalizedNumero);
                    const cecoData = allCentroCostos.find(c => String(c.numero || "").trim() === normalizedNumero);
                    const cecoNombre = cecoData?.nombre || ceco.nombre || "Desconocido";
                    return (
                        <div key={`${normalizedNumero}-${index}`} className="flex items-center gap-2 p-2 bg-muted/30 rounded border">
                            <div className="flex-1 text-sm">
                                <span className="font-medium">{ceco.numero}</span>
                                <span className="text-muted-foreground block text-xs truncate">
                                    {cecoNombre}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="flex items-center border rounded-md bg-white">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={ceco.porcentaje}
                                        onChange={(e) => onUpdatePorcentaje(ceco.numero, parseInt(e.target.value) || 0)}
                                        className="w-16 h-8 border-0 focus-visible:ring-0 text-right pr-1"
                                        disabled={disabled}
                                    />
                                    <span className="text-xs text-muted-foreground pr-2 font-medium">%</span>
                                </div>
                                {!disabled && !isLocked && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => onRemoveCeco(ceco.numero)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {selectedCentroCostos.length > 0 && (
                <div className={cn(
                    "flex justify-between items-center px-2 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider",
                    selectedCentroCostos.reduce((acc, cc) => acc + cc.porcentaje, 0) === 100 
                        ? "bg-green-50 text-green-700 border border-green-100" 
                        : "bg-red-50 text-red-700 border border-red-100"
                )}>
                    <span>Total porcentajes:</span>
                    <span>{selectedCentroCostos.reduce((acc, cc) => acc + cc.porcentaje, 0)}%</span>
                </div>
            )}
        </div>
    );
};
