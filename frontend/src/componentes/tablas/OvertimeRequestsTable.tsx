import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { OvertimeRecord, Unidad } from "@/types";
import { useTextLabels } from "@/contexts/TextLabelsContext";
import { RequestDetailModal } from "@/componentes/dialogos/RequestDetailModal";
import { Calendar, Layers } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OvertimeRequestsTableProps {
    records: OvertimeRecord[];
    allRecords?: OvertimeRecord[]; // All records to find siblings by submissionId
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
    onMarkReviewed?: (id: string, reviewedApproverToken?: string) => void;
    onEdit?: (id: string, updatedData: Partial<OvertimeRecord>) => void;
    overtimeRates?: {
        DIURNA: number;
        NOCTURNA: number;
        DOMINICAL_DIURNA: number;
        DOMINICAL_NOCTURNA: number;
    };
    unidades?: Unidad[];
    holidays?: any[];
    readOnly?: boolean;
}

export const OvertimeRequestsTable = ({
    records,
    allRecords = records,
    onApprove = () => { },
    onReject = () => { },
    onMarkReviewed = () => { },
    onEdit = () => { },
    overtimeRates,
    unidades,
    holidays,
    readOnly = false
}: OvertimeRequestsTableProps) => {
    const { textLabels } = useTextLabels();
    const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (!selectedRecord) return;
        const latest = records.find((r) => r.id === selectedRecord.id);
        if (latest) {
            setSelectedRecord(latest);
        }
    }, [records, selectedRecord]);

    const handleOpenModal = (record: OvertimeRecord) => {
        setSelectedRecord(record);
        setModalOpen(true);
    };

    if (records.length === 0) {
        return (
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                        No hay registros para mostrar
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="pt-6">
                    <div className="overflow-auto rounded-md border border-slate-200">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                    <TableHead className="w-[200px]">{textLabels.TABLE_HEADER_NOMBRE || "Colaborador"}</TableHead>
                                    <TableHead>{textLabels.TABLE_HEADER_CARGO || "Cargo"}</TableHead>
                                    <TableHead>{textLabels.TABLE_HEADER_FECHA || "Fecha"}</TableHead>
                                    <TableHead className="text-center">Cant. Horas</TableHead>
                                    <TableHead className="text-center">Total dinero</TableHead>
                                    <TableHead className="text-center">{textLabels.TABLE_HEADER_ESTADO || "Estado"}</TableHead>
                                    <TableHead className="text-center">{textLabels.TABLE_HEADER_ACCIONES || "Acciones"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map((record) => {
                                    const hasMultipleDates = record.dateEntries && (record.dateEntries.length > 1 || record.totales?.cantidadHoras !== undefined);
                                    const sortedDates = (record.dateEntries && record.dateEntries.length > 0)
                                        ? [...record.dateEntries!].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                                        : [];

                                    const displayNombre = record.empleado?.nombre || record.nombre;
                                    const displayCedula = record.empleado?.cedula || record.cedula;
                                    const displayCargo = record.empleado?.cargo || record.cargo;

                                    const minFecha = (hasMultipleDates && sortedDates.length > 0) ? sortedDates[0].fecha : record.fecha;
                                    const maxFecha = (hasMultipleDates && sortedDates.length > 0) ? sortedDates[sortedDates.length - 1].fecha : record.fecha;

                                    const totalHoras = record.totales?.cantidadHoras ?? record.cantidadHoras ?? 0;

                                    return (
                                        <TableRow
                                            key={record.id}
                                            className="hover:bg-muted/50 cursor-pointer"
                                            onClick={() => handleOpenModal(record)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span>{displayNombre}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{displayCedula}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{displayCargo || "N/A"}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    {hasMultipleDates ? (
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-medium text-xs">
                                                                    {minFecha ? format(new Date(minFecha), "dd/MM", { locale: es }) : "N/A"} - {maxFecha ? format(new Date(maxFecha), "dd/MM/yyyy", { locale: es }) : "N/A"}
                                                                </span>
                                                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-green-50 text-green-700 border-green-100 font-normal">
                                                                    {record.dateEntries?.length || 0} días
                                                                </Badge>
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground">Reporte múltiple</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="font-medium">{record.fecha ? format(new Date(record.fecha), "dd/MM/yyyy", { locale: es }) : "N/A"}</span>
                                                            <span className="text-xs text-muted-foreground">{record.diaSemana}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className={hasMultipleDates ? "bg-slate-100 text-slate-700 border-slate-200" : ""}>
                                                    {totalHoras.toFixed(2)} h
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {formatCurrency(record.totales?.valorTotal ?? record.valorHorasExtra ?? 0)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={`
                                                        ${record.estado === 'pendiente' ? 'bg-slate-100 text-slate-700 border-slate-200' : ''}
                                                        ${record.estado === 'en_revision' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' : ''}
                                                        ${record.estado === 'pendiente_nomina' ? 'bg-green-500/10 text-green-700 border-green-500/20' : ''}
                                                        ${record.estado === 'aprobado' ? 'bg-green-500/20 text-green-800 border-green-500/30' : ''}
                                                        ${record.estado === 'rechazado' ? 'bg-red-500/10 text-red-700 border-red-500/20' : ''}
                                                    `}
                                                >
                                                    {record.estado === 'pendiente_nomina'
                                                        ? 'Listo para nómina'
                                                        : record.estado === 'en_revision'
                                                        ? 'En revisión'
                                                        : record.estado}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenModal(record);
                                                    }}
                                                >
                                                    {readOnly ? (
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <Edit2 className="h-4 w-4" />
                                                    )}
                                                    <span className="sr-only">{readOnly ? "Ver detalles" : "Editar"}</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <RequestDetailModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                record={selectedRecord}
                onSave={onEdit}
                onApprove={onApprove}
                onReject={onReject}
                onMarkReviewed={onMarkReviewed}
                overtimeRates={overtimeRates}
                unidades={unidades}
                holidays={holidays}
                readOnly={readOnly}
            />
        </>
    );
};
