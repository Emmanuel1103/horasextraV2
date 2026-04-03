import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTextLabels } from "@/contexts/TextLabelsContext";
import { Search, X, Calendar, User, CircleHelp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReportFiltersProps {
    filterName: string;
    onFilterNameChange: (value: string) => void;
    filterStatus: "todos" | "aprobado" | "rechazado";
    onFilterStatusChange: (value: "todos" | "aprobado" | "rechazado") => void;
    startDate: string;
    onStartDateChange: (value: string) => void;
    endDate: string;
    onEndDateChange: (value: string) => void;
    onClearFilters: () => void;
}

export const ReportFilters = ({
    filterName,
    onFilterNameChange,
    filterStatus,
    onFilterStatusChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
    onClearFilters
}: ReportFiltersProps) => {
    const { textLabels } = useTextLabels();

    return (
        <Card className="mb-6 border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2 text-primary font-medium">
                    <span>Filtros de búsqueda</span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-green-300 bg-green-50 text-green-700 transition-colors hover:bg-green-100 hover:text-green-800"
                                aria-label="Ayuda de filtros"
                                title="Ayuda de filtros"
                            >
                                <CircleHelp className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs text-xs leading-relaxed">
                            Usa nombre/cédula y rango de fechas para acotar resultados. Si no hay filtros activos, se muestran todos los registros históricos.
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    {/* Nombre / Cédula */}
                    <div className="md:col-span-4 space-y-2">
                        <Label htmlFor="filterName" className="text-sm font-medium flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {textLabels.TABLE_HEADER_NOMBRE || "Colaborador"}
                        </Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="filterName"
                                type="text"
                                placeholder="Buscar por nombre o cédula..."
                                value={filterName}
                                onChange={(e) => onFilterNameChange?.(e.target.value)}
                                className="pl-9 bg-white"
                            />
                        </div>
                    </div>

                    {/* Fecha Inicio */}
                    <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="startDate" className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <div>
                                Fecha inicio <span className="text-xs text-muted-foreground font-normal ml-1">(desde 00:00)</span>
                            </div>
                        </Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => onStartDateChange?.(e.target.value)}
                            className="bg-white"
                        />
                    </div>

                    {/* Fecha Fin */}
                    <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="endDate" className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <div>
                                Fecha fin <span className="text-xs text-muted-foreground font-normal ml-1">(hasta 23:59)</span>
                            </div>
                        </Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => onEndDateChange?.(e.target.value)}
                            className="bg-white"
                        />
                    </div>

                    {/* Estado */}
                    <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="statusFilter" className="text-sm font-medium">
                            Estado
                        </Label>
                        <Select
                            value={filterStatus}
                            onValueChange={(value) => onFilterStatusChange?.(value as "todos" | "aprobado" | "rechazado")}
                        >
                            <SelectTrigger id="statusFilter" className="bg-white">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="aprobado">Aprobado</SelectItem>
                                <SelectItem value="rechazado">Negado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Botones */}
                    <div className="md:col-span-2 flex gap-2 w-full">
                        <Button
                            onClick={onClearFilters}
                            variant="outline"
                            className="w-full border-dashed"
                            title="Limpiar filtros"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Limpiar
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
