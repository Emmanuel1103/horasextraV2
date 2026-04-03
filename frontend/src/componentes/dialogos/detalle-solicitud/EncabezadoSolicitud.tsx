import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { OvertimeRecord } from "@/types";

const parseSafeDate = (value: unknown): Date | null => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value !== "string" && typeof value !== "number") return null;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

interface EncabezadoSolicitudProps {
    record: OvertimeRecord;
}

export const EncabezadoSolicitud = ({ record }: EncabezadoSolicitudProps) => {
    const displayNombre = record.empleado?.nombre || record.nombre;
    const displayCargo = record.empleado?.cargo || record.cargo;
    const displayCedula = record.empleado?.cedula || record.cedula;

    const parsedFecha =
        parseSafeDate(record.createdAt) ||
        parseSafeDate(record.updatedAt) ||
        parseSafeDate(record.dateEntries?.[0]?.fecha) ||
        parseSafeDate(record.fecha);

    return (
        <div className="flex justify-between items-start gap-4">
            <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {displayNombre}
                </DialogTitle>
                <DialogDescription asChild>
                    <div className="text-base mt-1 flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-sm px-2 font-normal text-foreground">
                            {displayCargo || "Sin cargo"}
                        </Badge>
                        <span className="text-muted-foreground">•</span>
                        <span>CC: {displayCedula}</span>
                    </div>
                </DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
                <Badge
                    variant={record.estado === "aprobado" ? "default" : record.estado === "rechazado" ? "destructive" : "outline"}
                    className={`text-sm px-3 py-1 ${record.estado === "pendiente" ? "bg-slate-50 text-slate-700 border-slate-200" :
                        record.estado === "pendiente_nomina" || record.estado === "aprobado" ? "bg-green-50 text-[#00A352] border-green-200" : 
                        record.estado === "rechazado" ? "bg-red-50 text-[#FF0000] border-red-200" : ""
                        }`}
                >
                    {record.estado === "pendiente_nomina" ? "Listo para nómina" : record.estado.charAt(0).toUpperCase() + record.estado.slice(1)}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {parsedFecha ? format(parsedFecha, "dd MMMM yyyy", { locale: es }) : "Fecha no disponible"}
                </span>
            </div>
        </div>
    );
};