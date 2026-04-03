/**
 * Componentes especializados para la pagina de aprobacion por link externa
 */
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Building2, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface DateEntryCardsProps {
    entries: any[];
    approverCecos?: string[];
    rowPaddingClassName?: string;
    totalPaddingClassName?: string;
}

const formatDateLabel = (value: any) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Sin fecha";
    return format(date, "EEEE d 'de' MMMM, yyyy", { locale: es });
};

export const DateEntryCards = ({
    entries,
    approverCecos = [],
    rowPaddingClassName = "px-6 py-4",
    totalPaddingClassName = "px-0 py-0"
}: DateEntryCardsProps) => {
    const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

    const approverCecoSet = new Set(
        approverCecos.map((cc) => String(cc || "").trim()).filter(Boolean)
    );

    const getFilteredCecos = (entry: any) => {
        return (entry?.centroCosto || [])
            .filter((cc: any) => {
                if (approverCecoSet.size === 0) return true;
                const numero = String(cc?.numero || cc || "").trim();
                return approverCecoSet.has(numero);
            })
            .map((cc: any) => ({
                numero: String(cc?.numero || cc || "").trim(),
                porcentaje: cc?.porcentaje,
            }))
            .filter((cc: any) => cc.numero.length > 0);
    };

    const totalHoras = entries.reduce((acc, entry) => {
        const horas = Number(entry?.cantidadHoras || 0);
        if (!Number.isFinite(horas)) return acc;

        const cecos = getFilteredCecos(entry);
        if (cecos.length === 0) return acc;

        const porcentajeTotal = cecos.reduce((sum: number, cc: any) => {
            const pct = Number(cc?.porcentaje);
            return sum + (Number.isFinite(pct) ? pct : 100);
        }, 0);

        return acc + (horas * porcentajeTotal) / 100;
    }, 0);

    const totalHorasOriginales = entries.reduce((acc, entry) => {
        const horas = Number(entry?.cantidadHoras || 0);
        return acc + (Number.isFinite(horas) ? horas : 0);
    }, 0);

    return (
    <div className="divide-y divide-slate-200">
        {entries.length === 0 && (
            <div className="rounded-lg border border-slate-200 p-6 text-sm text-slate-500">
                No hay fechas para mostrar.
            </div>
        )}

        {entries.map((entry, idx) => {
            const cecos = getFilteredCecos(entry);

            return (
                <article
                    key={`${idx}-${entry?.fecha || "sin-fecha"}-${entry?.horaInicio || ""}-${entry?.horaFinal || ""}`}
                        className={`h-40 cursor-pointer hover:bg-slate-50 transition-colors group relative ${rowPaddingClassName}`}
                        onClick={() => setSelectedEntry(entry)}
                >
                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3" style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                        <div className="min-w-0 space-y-2.5">
                            <div className="flex items-start gap-2">
                                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                <p className="text-slate-900 font-medium capitalize leading-5">
                                    {formatDateLabel(entry.fecha)}
                                </p>
                            </div>

                            <div className="flex items-start gap-2">
                                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                                <p className="text-sm text-slate-700 leading-5">
                                    {entry.horaInicio} - {entry.horaFinal}
                                </p>
                            </div>

                            <div className="flex items-start gap-2">
                                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                                <div>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                        {cecos.length > 0 ? cecos.map((cc: any) => (
                                            <span
                                                key={`${cc.numero}-${cc.porcentaje ?? "na"}`}
                                                className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700 font-medium"
                                            >
                                                {cc.numero}{cc.porcentaje !== undefined ? ` (${cc.porcentaje}%)` : ""}
                                            </span>
                                        )) : (
                                            <span className="text-slate-700 text-sm">No asignado</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Badge
                            variant="outline"
                            className="w-fit self-center border-emerald-200 bg-emerald-50 text-emerald-800 font-bold px-3 py-1"
                        >
                            {Number(entry.cantidadHoras || 0).toFixed(2)} h
                        </Badge>
                    </div>
                </article>
            );
        })}

        {entries.length > 0 && (
            <div className={totalPaddingClassName}>
                <div className="flex items-center justify-between p-4">
                    <span className="font-medium text-slate-600">Total acumulado</span>
                    <span className="font-bold text-lg text-emerald-700" title={`Total original: ${totalHorasOriginales.toFixed(2)} h`}>
                        {totalHoras.toFixed(2)} h
                    </span>
                </div>
            </div>
        )}

        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl text-slate-900 border-b border-slate-100 pb-4">
                        Detalles del turno
                    </DialogTitle>
                </DialogHeader>
                
                {selectedEntry && (
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-emerald-600" />
                                    <p className="text-sm text-slate-900 capitalize">
                                        {formatDateLabel(selectedEntry.fecha)}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Horario</p>
                                <div className="flex items-center gap-2 text-sm text-slate-900">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <span>{selectedEntry.horaInicio} - {selectedEntry.horaFinal}</span>
                                    <Badge variant="secondary" className="ml-1 bg-slate-100 text-slate-700">
                                        {Number(selectedEntry.cantidadHoras || 0).toFixed(2)} h
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-slate-100" />

                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Desglose Técnico</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: "Extras Diurnas", val: selectedEntry.horasExtraDiurna },
                                    { label: "Extras Nocturnas", val: selectedEntry.horasExtraNocturna },
                                    { label: "Dom/Fest Diurnas", val: selectedEntry.horasExtraDiurnaDominicalFestiva },
                                    { label: "Dom/Fest Nocturnas", val: selectedEntry.horasExtraNocturnaDominicalFestiva },
                                    { label: "Recargos Nocturnos", val: selectedEntry.recargoNocturno },
                                    { label: "Recargos Dom/Fest", val: selectedEntry.recargosDominicalFestivo, isFlag: true },
                                ].map((item, i) => (
                                    (Number(item.val) > 0) && (
                                        <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded-md border border-slate-100">
                                            <span className="text-[10px] text-slate-600 font-medium">{item.label}</span>
                                            <span className="text-xs text-slate-900">{item.isFlag ? "Sí" : Number(item.val).toFixed(2)}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Centro de Costo</p>
                            <div className="flex flex-wrap gap-2">
                                {getFilteredCecos(selectedEntry).length > 0 ? (
                                    getFilteredCecos(selectedEntry).map((cc: any) => (
                                        <Badge key={`${cc.numero}-${cc.porcentaje ?? "na"}`} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                            CeCo {cc.numero} ({cc.porcentaje || 100}%)
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-slate-700 text-sm">No asignado</span>
                                )}
                            </div>
                        </div>

                        {selectedEntry.motivo && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Motivo Justificado</p>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 italic text-sm text-slate-700 leading-relaxed">
                                    "{selectedEntry.motivo}"
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100">
                    <Button 
                        variant="default" 
                        onClick={() => setSelectedEntry(null)}
                        className="w-full sm:w-auto bg-[#00A352] hover:bg-[#008a45] text-white"
                    >
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
    );
};
