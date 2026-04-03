import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const parseSafeDate = (value: unknown): Date | null => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value !== "string" && typeof value !== "number") return null;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

interface ListaFechasProps {
    dateEntries: any[];
    currentDate: string;
    currentStart: string;
    currentEnd: string;
    onEntryClick: (entry: any) => void;
}

export const ListaFechas = ({
    dateEntries,
    currentDate,
    currentStart,
    currentEnd,
    onEntryClick
}: ListaFechasProps) => {
    if (!dateEntries || dateEntries.length < 1) return null;

    return (
        <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                Desglose de fechas reportadas
            </h4>
            <div className="grid grid-cols-1 gap-2">
                {dateEntries
                    .sort((a, b) => {
                        const aDate = parseSafeDate(a.fecha);
                        const bDate = parseSafeDate(b.fecha);
                        const aTime = aDate ? aDate.getTime() : Number.MAX_SAFE_INTEGER;
                        const bTime = bDate ? bDate.getTime() : Number.MAX_SAFE_INTEGER;
                        return aTime - bTime;
                    })
                    .map((entry, idx) => {
                        const parsedEntryDate = parseSafeDate(entry.fecha);
                        const isActive = currentDate === entry.fecha && 
                                        currentStart === entry.horaInicio && 
                                        currentEnd === entry.horaFinal;
                        
                        return (
                            <button 
                                key={idx}
                                type="button"
                                onClick={() => onEntryClick(entry)}
                                className={`text-xs p-2 rounded border flex justify-between items-center transition-all ${
                                    isActive
                                    ? 'bg-primary/10 border-primary/40 shadow-sm ring-1 ring-primary/20' 
                                    : 'bg-muted/30 hover:bg-muted/50'
                                }`}
                            >
                                <div className="flex flex-col text-left">
                                    <span className="font-medium">
                                        {parsedEntryDate
                                            ? format(parsedEntryDate, "eeee, d 'de' MMMM", { locale: es })
                                            : "Fecha no disponible"}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-[10px] text-muted-foreground">
                                            {entry.horaInicio} - {entry.horaFinal}
                                        </span>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-100 font-normal">
                                    {(entry.cantidadHoras || 0).toFixed(2)} hrs
                                </Badge>
                            </button>
                        );
                    })}
            </div>
        </div>
    );
};
