import { useState, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Edit2, Save, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { OvertimeRecord } from "@/types";
import { ERROR_MESSAGES } from "@/constants";
import { formatCurrency } from "@/lib/utils";
import { useTextLabels } from "@/contexts/TextLabelsContext";
import filterStyles from "./FilterCard.module.css";

interface OvertimeTableProps {
  records: OvertimeRecord[];
  onExportOriginal?: () => void;
  onExportPayroll?: () => void;
  onEdit?: (id: string, updatedData: Partial<OvertimeRecord>) => void;
  onApprove?: (id: string) => void;
  filterName?: string;
  onFilterNameChange?: (name: string) => void;
  startDate?: string;
  onStartDateChange?: (date: string) => void;
  endDate?: string;
  onEndDateChange?: (date: string) => void;
  onApplyFilter?: () => void;
  onClearFilters?: () => void;
  showFilters?: boolean;
  hideHeader?: boolean;
  overtimeRates?: {
    DIURNA: number;
    NOCTURNA: number;
    DOMINICAL_DIURNA: number;
    DOMINICAL_NOCTURNA: number;
  };
}

export const OvertimeTable = ({
  records,
  onExportOriginal,
  onExportPayroll,
  onEdit,
  onApprove,
  filterName = "",
  onFilterNameChange,
  startDate = "",
  onStartDateChange,
  endDate = "",
  onEndDateChange,
  onApplyFilter,
  onClearFilters,
  showFilters = false,
  hideHeader = false,
  overtimeRates
}: OvertimeTableProps) => {
  const totalHoras = records.reduce((sum, record) => sum + record.cantidadHoras, 0);
  const totalValor = records.reduce((sum, record) => sum + record.valorHorasExtra, 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | null>(null);
  const [editData, setEditData] = useState<{ salario: string; centroCosto: string }>({
    salario: "",
    centroCosto: ""
  });

  const getDayBadgeVariant = (dia: string) => {
    if (dia === "sábado" || dia === "domingo") return "default";
    return "secondary";
  };

  const getEstadoBadgeVariant = (estado: string) => {
    if (estado === "aprobado") return "default";
    if (estado === "rechazado") return "destructive";
    return "secondary";
  };

  const handleEditClick = (record: OvertimeRecord) => {
    setEditingId(record.id);
    setEditData({
      salario: record.salario?.toString() || "",
      centroCosto: Array.isArray(record.centroCosto)
        ? record.centroCosto.map(cc => `${cc.numero} (${cc.porcentaje || 100}%)`).join(", ")
        : record.centroCosto || "",
    });
  };

  const handleSave = (record: OvertimeRecord) => {
    if (!onEdit) return;

    const salario = parseFloat(editData.salario) || 0;

    onEdit(record.id, {
      salario,
      centroCosto: editData.centroCosto,
      recalculateTotals: true,
    });

    setEditingId(null);
  };

  const handleReapprove = (record: OvertimeRecord) => {
    if (!onApprove) return;
    if (!record.salario || record.salario === 0) {
      alert(ERROR_MESSAGES.INVALID_SALARY);
      return;
    }
    onApprove(record.id);
  };

  const { textLabels } = useTextLabels();

  return (
    <Card className="shadow-lg border-border/50">
      {!hideHeader && (
        <CardHeader className="bg-form-header border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-form-header-foreground">
              <Clock className="h-5 w-5 text-form-header-foreground" />
              {textLabels.MODULE_OVERTIME || "Registro de horas extras"}
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={onExportOriginal}
                  disabled={records.length === 0 || !onExportOriginal}
                  className="gap-2"
                  size="sm"
                  variant="outline"
                >
                  <Download className="h-4 w-4" />
                  {textLabels.BTN_EXPORT_ORIGINAL || "Exportar - Reporte inicial"}
                </Button>
                <Button
                  onClick={onExportPayroll}
                  disabled={records.length === 0 || !onExportPayroll}
                  className="gap-2"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  {textLabels.BTN_EXPORT_NOMINA || "Exportar - Nómina"}
                </Button>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{textLabels.LABEL_UNIDADES_REGISTRADAS || "Total de horas"}</p>
                <p className="text-2xl font-bold text-primary">{(totalHoras ?? 0).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{textLabels.TABLE_HEADER_VALOR || "Valor total"}</p>
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(totalValor)}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      )}
      {showFilters && (
        <div className={filterStyles.filterCardContent} style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
          <div className={filterStyles.filterGrid}>
            <div className={filterStyles.filterGroup}>
              <Label htmlFor="filterName" className={filterStyles.filterLabel}>{textLabels.TABLE_HEADER_NOMBRE || "Nombre del colaborador"}</Label>
              <Input
                id="filterName"
                type="text"
                placeholder="Escribe el nombre..."
                value={filterName}
                onChange={(e) => onFilterNameChange?.(e.target.value)}
                className={filterStyles.filterInput}
              />
            </div>
            <div className={filterStyles.filterGroup}>
              <Label htmlFor="startDate" className={filterStyles.filterLabel}>{textLabels.TABLE_HEADER_FECHA || "Fecha de inicio"}</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange?.(e.target.value)}
                className={filterStyles.filterInput}
              />
            </div>
            <div className={filterStyles.filterGroup}>
              <Label htmlFor="endDate" className={filterStyles.filterLabel}>{textLabels.TABLE_HEADER_FECHA || "Fecha de fin"}</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange?.(e.target.value)}
                className={filterStyles.filterInput}
              />
            </div>
            <div className={filterStyles.filterButtonsGroup}>
              <Button
                onClick={onApplyFilter}
                className={filterStyles.filterButton}
              >
                Aplicar filtro
              </Button>
              <Button
                onClick={onClearFilters}
                className={filterStyles.filterButton}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
      )}
      <CardContent className="pt-6">
        {records.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No hay registros de horas extras</p>
            <p className="text-sm mt-2">Agrega un nuevo registro usando el formulario de arriba</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Día</TableHead>
                  <TableHead>Centro de costo</TableHead>
                  <TableHead>Hora de inicio</TableHead>
                  <TableHead>Hora final</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">H. diurna</TableHead>
                  <TableHead className="text-right">H. nocturna</TableHead>
                  <TableHead className="text-right">Dom/fest</TableHead>
                  <TableHead className="text-right">Valor total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <Fragment key={record.id}>
                    <TableRow className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{record.nombre}</TableCell>
                      <TableCell>{format(record.fecha, "dd/MM/yyyy", { locale: es })}</TableCell>
                      <TableCell>
                        <Badge variant={getDayBadgeVariant(record.diaSemana)} className="">
                          {record.diaSemana}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingId === record.id ? (
                          <Input
                            value={editData.centroCosto}
                            onChange={(e) => setEditData({ ...editData, centroCosto: e.target.value })}
                            placeholder="Centro de costo"
                            className="w-32"
                          />
                        ) : (
                          <span className="text-muted-foreground">{
                            Array.isArray(record.centroCosto)
                              ? record.centroCosto.map(cc => `${cc.numero} (${cc.porcentaje || 100}%)`).join(", ")
                              : record.centroCosto || "-"
                          }</span>
                        )}
                      </TableCell>
                      <TableCell>{record.horaInicio}</TableCell>
                      <TableCell>{record.horaFinal}</TableCell>
                      <TableCell className="text-right font-medium">{(record.cantidadHoras ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {(record.horasExtraDiurna ?? 0) > 0 ? (
                          <span className="text-primary font-medium">{(record.horasExtraDiurna ?? 0).toFixed(2)}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {(record.horasExtraNocturna ?? 0) > 0 ? (
                          <span className="text-accent font-medium">{(record.horasExtraNocturna ?? 0).toFixed(2)}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {(record.recargosDominicalFestivo ?? 0) > 0 ? (
                          <span className="text-warning font-medium">Sí</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === record.id ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                            <Input
                              type="number"
                              value={editData.salario}
                              onChange={(e) => setEditData({ ...editData, salario: e.target.value })}
                              placeholder="Salario"
                              className="w-32 pl-7"
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-foreground">
                            {formatCurrency(record.valorHorasExtra)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(record.estado)} className="">
                          {record.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRecord(record);
                              setDetailsOpen(true);
                            }}
                            className="gap-1"
                          >
                            Detalles
                          </Button>
                          {editingId === record.id ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSave(record)}
                              className="gap-1 text-blue-600 border-blue-600/20 hover:bg-blue-500/10"
                            >
                              <Save className="h-4 w-4" />
                              Guardar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(record)}
                              className="gap-1"
                            >
                              <Edit2 className="h-4 w-4" />
                              Editar
                            </Button>
                          )}
                          {record.estado === "rechazado" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReapprove(record)}
                              className="gap-1 text-green-600 border-green-600/20 hover:bg-green-500/10"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Aprobar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {editingId === record.id && (
                      <TableRow className="bg-blue-50/50">
                        <TableCell colSpan={12} className="py-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-3 text-foreground">Motivo de las horas extras</h4>
                              <textarea
                                value={record.motivo || ""}
                                readOnly
                                className="w-full min-h-32 p-4 border border-border rounded-lg bg-white text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo de las horas extras</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-border">
                <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap break-words">
                  {selectedRecord.motivo || "Sin especificar"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Colaborador</p>
                  <p className="font-medium">{selectedRecord.nombre}</p>
                </div>
                <div>
                  <p className="text-gray-600">Fecha</p>
                  <p className="font-medium">{format(selectedRecord.fecha as Date, "dd MMM yyyy", { locale: es })}</p>
                </div>
                <div>
                  <p className="text-gray-600">Hora de inicio</p>
                  <p className="font-medium">{selectedRecord.horaInicio}</p>
                </div>
                <div>
                  <p className="text-gray-600">Hora de fin</p>
                  <p className="font-medium">{selectedRecord.horaFinal}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
