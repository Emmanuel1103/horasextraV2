import { useState } from "react";
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

interface PendingReviewTableProps {
  records: OvertimeRecord[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, updatedData: Partial<OvertimeRecord>) => void;
  overtimeRates?: {
    DIURNA: number;
    NOCTURNA: number;
    DOMINICAL_DIURNA: number;
    DOMINICAL_NOCTURNA: number;
  };
  unidades?: Unidad[];
}

export const PendingReviewTable = ({ records, onApprove, onReject, onEdit, overtimeRates, unidades }: PendingReviewTableProps) => {
  const { textLabels } = useTextLabels();
  const pendingRecords = records.filter(record => record.estado === "pendiente");

  const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = (record: OvertimeRecord) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  if (pendingRecords.length === 0) {
    return (
      <Card className="shadow-lg border-border/50">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            No hay registros en revisión
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg border-border/50">
        <CardContent className="pt-6">
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{textLabels.TABLE_HEADER_NOMBRE || "Colaborador"}</TableHead>
                  <TableHead>{textLabels.TABLE_HEADER_CARGO || "Cargo"}</TableHead>
                  <TableHead>{textLabels.TABLE_HEADER_FECHA || "Fecha"}</TableHead>
                  <TableHead className="text-center">Cant. Horas</TableHead>
                  <TableHead className="text-center">{textLabels.TABLE_HEADER_ESTADO || "Estado"}</TableHead>
                  <TableHead className="text-center">{textLabels.TABLE_HEADER_ACCIONES || "Acciones"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleOpenModal(record)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{record.nombre}</span>
                        <span className="text-xs text-muted-foreground">{record.cedula}</span>
                      </div>
                    </TableCell>
                    <TableCell>{record.cargo || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{format(record.fecha, "dd/MM/yyyy", { locale: es })}</span>
                        <span className="text-xs text-muted-foreground">{record.diaSemana}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {(record.cantidadHoras ?? 0).toFixed(2)} h
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                        Pendiente
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(record);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
        overtimeRates={overtimeRates}
        unidades={unidades}
      />
    </>
  );
};