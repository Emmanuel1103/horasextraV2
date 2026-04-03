import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ViewMode, HorariosConfig, Unidad } from "@/types";
import { SeccionInformacionColaborador } from "./formulario-horas-extras/SeccionInformacionColaborador";
import { ListaFechasHorarios } from "./formulario-horas-extras/ListaFechasHorarios";
import { BotonesAccion } from "./formulario-horas-extras/BotonesAccion";
import { useFormularioHorasExtras } from "./formulario-horas-extras/useFormularioHorasExtras";

interface OvertimeFormProps {
  onSubmit: (data: import("@/types").OvertimeFormSubmit) => void | Promise<void>;
  mode?: ViewMode;
  horariosConfig?: HorariosConfig;
  unidades?: Unidad[];
  holidays?: string[];
  overtimeRates?: {
    DIURNA: number;
    NOCTURNA: number;
    DOMINICAL_DIURNA: number;
    DOMINICAL_NOCTURNA: number;
  };
  textLabels?: Record<string, string>;
  approvalMessageHtml?: string;
}

export const OvertimeForm = ({ 
  onSubmit, 
  mode = "admin", 
  horariosConfig: externalConfig, 
  unidades: externalUnidades, 
  holidays: externalHolidays,
  overtimeRates: externalOvertimeRates,
  textLabels
}: OvertimeFormProps) => {
  // Función helper para obtener textos
  const getText = (key: string, defaultValue: string = key) => {
    return textLabels?.[key] || defaultValue;
  };

  // Hook personalizado con toda la lógica de estado
  const {
    formData,
    setFormData,
    dateEntries,
    allCentroCostos,
    showErrors,
    handleNumericInputChange,
    addDateEntry,
    removeDateEntry,
    updateDateEntry,
    isFormValid,
    handleSubmit,
    pendingSubmission,
    setPendingSubmission,
    confirmPendingSubmission,
    isSubmitting,
  } = useFormularioHorasExtras({
    mode,
    horariosConfig: externalConfig,
    unidades: externalUnidades,
    holidays: externalHolidays,
    overtimeRates: externalOvertimeRates,
    onSubmit
  });

  const getCecosForEntry = (entry: any) =>
    Array.isArray(entry?.centroCosto)
      ? entry.centroCosto.map((cc: any) => String(cc?.numero || cc || "").trim()).filter(Boolean)
      : [];

  const cecoDetails = (() => {
    const submission = pendingSubmission;
    if (!submission) return [] as Array<{
      numero: string;
      approvers: Array<{ name: string; email: string }>;
      entries: Array<{ fecha: string; horaInicio: string; horaFinal: string; motivo: string; porcentaje: number | null }>;
    }>;

    const cecoSet = new Set<string>();
    submission.payload.dateEntries.forEach((entry) => {
      getCecosForEntry(entry).forEach((cc) => cecoSet.add(cc));
    });

    return Array.from(cecoSet)
      .sort()
      .map((numero) => {
        const approvers = submission.approvers
          .filter((a) => (a.centrosCosto || []).map((cc) => String(cc || "").trim()).includes(numero))
          .map((a) => ({ name: a.name || a.email, email: a.email }));

        const entries = submission.payload.dateEntries
          .filter((entry) => getCecosForEntry(entry).includes(numero))
          .map((entry) => {
            const center = (entry.centroCosto || []).find((cc: any) => String(cc?.numero || cc || "").trim() === numero);
            const porcentajeRaw = Number((center as any)?.porcentaje);
            return {
              fecha: new Date(entry.fecha as any).toLocaleDateString("es-CO"),
              horaInicio: entry.horaInicio,
              horaFinal: entry.horaFinal,
              motivo: entry.motivo,
              porcentaje: Number.isFinite(porcentajeRaw) ? porcentajeRaw : null,
            };
          });

        return { numero, approvers, entries };
      });
  })();

  return (
    <>
      <Card className="shadow-lg border-border/50">
        <CardContent className="p-8">
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            noValidate
            className="space-y-8"
          >
            {/* Sección: Información del colaborador */}
            <SeccionInformacionColaborador
              formData={formData}
              setFormData={setFormData}
              handleNumericInputChange={handleNumericInputChange}
              showErrors={showErrors}
              mode={mode}
              getText={getText}
            />

            {/* Sección: Fechas y horarios */}
            <ListaFechasHorarios
              dateEntries={dateEntries}
              showErrors={showErrors}
              allCentroCostos={allCentroCostos}
              isFormValid={isFormValid}
              onAddDateEntry={addDateEntry}
              onRemoveEntry={removeDateEntry}
              onUpdateEntry={updateDateEntry}
            />

            {/* Botones de acción */}
            <BotonesAccion
              mode={mode}
              isFormValid={isFormValid}
              getText={getText}
            />
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingSubmission} onOpenChange={(open) => !open && setPendingSubmission(null)}>
        <AlertDialogContent className="max-w-xl p-0 overflow-hidden flex flex-col h-[80vh] max-h-[80vh]">
          <AlertDialogHeader className="shrink-0 p-6 pb-2">
            <AlertDialogTitle>Confirmar envío de solicitud</AlertDialogTitle>
            <AlertDialogDescription>
              Verifica a quién se notificará antes de enviar esta solicitud de horas extras.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
            <div className="space-y-4 text-sm pb-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-medium text-slate-900">Resumen</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-1 text-slate-700">
                  <p>Colaborador: <span className="font-medium text-slate-900">{pendingSubmission?.payload.nombre || "No disponible"}</span></p>
                  <p>Cédula: <span className="font-medium text-slate-900">{pendingSubmission?.payload.cedula || "No disponible"}</span></p>
                  <p>Cargo: <span className="font-medium text-slate-900">{pendingSubmission?.payload.cargo || "No disponible"}</span></p>
                  <p>Fechas a reportar: <span className="font-medium text-slate-900">{pendingSubmission?.dateCount || 0}</span></p>
                  <p>Aprobadores a notificar: <span className="font-medium text-slate-900">{pendingSubmission?.approvers.length || 0}</span></p>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                <p className="font-medium text-slate-900 mb-2">Detalle por centro de costo</p>
                {cecoDetails.length > 0 ? (
                  <div className="space-y-4">
                    {cecoDetails.map((detail) => (
                      <div key={detail.numero} className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
                          <p className="font-bold text-slate-900">CeCo {detail.numero}</p>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded uppercase font-semibold">
                            {detail.entries.length} registro(s)
                          </span>
                        </div>
                        <p className="text-slate-700 text-xs mb-2">
                          <span className="font-semibold text-slate-800">Aprobador(es):</span> {detail.approvers.length > 0
                            ? detail.approvers.map((a) => a.name).join(" | ")
                            : "Sin aprobador asignado"}
                        </p>
                        <div className="space-y-2">
                          {detail.entries.map((entry, idx) => (
                            <div key={`${detail.numero}-${idx}`} className="rounded border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 shadow-sm">
                              <div className="flex justify-between font-medium text-slate-800 mb-1">
                                <span>{entry.fecha}</span>
                                <span>{entry.horaInicio} - {entry.horaFinal}</span>
                              </div>
                              {entry.porcentaje !== null && (
                                <p className="text-[10px] text-green-600 font-semibold mb-1">Porcentaje: {entry.porcentaje}%</p>
                              )}
                              <p className="text-slate-600 italic break-words [overflow-wrap:anywhere] bg-slate-50 p-1 rounded">
                                "{entry.motivo}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-slate-700">No se encontraron centros de costo en la solicitud.</p>
                )}
              </div>
            </div>
          </div>

          <AlertDialogFooter className="shrink-0 p-6 pt-4 border-t mt-0">
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmPendingSubmission} 
              disabled={isSubmitting}
              className="bg-[#00A352] hover:bg-[#008a45] text-white"
            >
              {isSubmitting ? "Enviando..." : "Confirmar y enviar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};