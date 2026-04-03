import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CostCenter {
    numero: string;
    porcentaje: number;
}

interface CostCenterSectionProps {
    index: number;
    selectedCeCos: CostCenter[];
    allCentroCostos: Array<{ numero: string; nombre: string }>;
    onUpdate: (index: number, centrosCosto: CostCenter[]) => void;
    showErrors?: boolean;
}

export const CostCenterSection = ({
    index,
    selectedCeCos,
    allCentroCostos,
    onUpdate,
    showErrors = false
}: CostCenterSectionProps) => {
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState<Array<{ numero: string; nombre: string }>>([]);

    const handleInputChange = (value: string) => {
        setInputValue(value);
        if (value.trim().length > 0) {
            const searchTerm = value.toLowerCase().trim();
            
            if (!allCentroCostos || !Array.isArray(allCentroCostos)) {
                return;
            }

            const filtered = allCentroCostos.filter(cc =>
                String(cc.numero || "").toLowerCase().includes(searchTerm) ||
                String(cc.nombre || "").toLowerCase().includes(searchTerm)
            );
            
            // Eliminar duplicados si los hay y limitar
            const uniqueSuggestions = Array.from(new Map(filtered.map(item => [item.numero, item])).values());
            setSuggestions(uniqueSuggestions.slice(0, 10));
        } else {
            setSuggestions([]);
        }
    };

    const addCeCo = (cc: { numero: string; nombre: string }) => {
        if (!selectedCeCos.some(c => c.numero === cc.numero)) {
            onUpdate(index, [...selectedCeCos, { numero: cc.numero, porcentaje: 0 }]);
        }
        setInputValue("");
        setSuggestions([]);
    };

    const removeCeCo = (numero: string) => {
        onUpdate(index, selectedCeCos.filter(c => c.numero !== numero));
    };

    const updatePorcentaje = (numero: string, value: number) => {
        const sanitized = Math.max(0, Math.min(100, value));
        onUpdate(index, selectedCeCos.map(c => 
            c.numero === numero ? { ...c, porcentaje: sanitized } : c
        ));
    };

    const totalPorcentaje = selectedCeCos.reduce((acc, curr) => acc + curr.porcentaje, 0);
    const isValid = totalPorcentaje === 100;
    const labelBaseClass = "text-xs font-semibold uppercase tracking-wider";

    return (
        <div className="space-y-3">
            <Label className={cn(
                "flex items-center justify-between",
                labelBaseClass,
                showErrors && selectedCeCos.length === 0 ? "text-red-500" : "text-slate-500"
            )}>
                <span>Centros de costo * (Debe sumar 100%)</span>
                <span className={cn(
                    "normal-case text-xs font-bold px-2 py-0.5 rounded-full border transition-colors",
                    isValid 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-red-50 text-red-700 border-red-200"
                )}>
                    Total: {totalPorcentaje}%
                </span>
            </Label>

            <div className="relative group">
                <Input
                    placeholder="Escribe número o nombre del CeCo..."
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className={cn(
                        "focus-visible:ring-primary shadow-sm h-10 transition-all",
                        suggestions.length > 0 && "rounded-b-none border-b-transparent",
                        showErrors && selectedCeCos.length === 0 && "border-red-500 bg-red-50/50"
                    )}
                />
                
                {suggestions.length > 0 && (
                    <div className="absolute z-20 w-full bg-white border border-t-0 rounded-b-md shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                        {suggestions.map((cc) => (
                            <button
                                key={cc.numero}
                                type="button"
                                onClick={() => addCeCo(cc)}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex flex-col transition-colors border-b last:border-b-0 border-slate-100"
                            >
                                <span className="font-semibold text-slate-900">{cc.numero}</span>
                                <span className="text-xs text-slate-500 truncate">{cc.nombre}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedCeCos.length > 0 && (
                <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-bottom-2">
                    {selectedCeCos.map((ceco) => {
                        const info = allCentroCostos.find(ac => ac.numero === ceco.numero);
                        return (
                            <div key={ceco.numero} className="flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-200 rounded-lg group/item hover:border-slate-300 transition-colors shadow-sm">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">{ceco.numero}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{info?.nombre || "Cargando..."}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            className="w-20 h-8 pr-6 text-right font-medium text-xs bg-white focus-visible:ring-1"
                                            value={ceco.porcentaje || ""}
                                            onChange={(e) => updatePorcentaje(ceco.numero, parseInt(e.target.value) || 0)}
                                            onFocus={(e) => e.target.select()}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeCeCo(ceco.numero)}
                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!isValid && selectedCeCos.length > 0 && (
                <div className="flex items-center gap-2 text-[10px] text-green-600 font-medium px-1 ">
                    <AlertCircle className="h-3 w-3" />
                    <span>La suma debe ser exactamente 100% para poder enviar.</span>
                </div>
            )}
        </div>
    );
};
