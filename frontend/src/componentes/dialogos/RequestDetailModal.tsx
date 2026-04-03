import { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Check, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { ApproverInfo, OvertimeRecord, Unidad } from "@/types";
import { useModalDetalleSolicitud } from "./detalle-solicitud/useModalDetalleSolicitud";
import { EncabezadoSolicitud } from "./detalle-solicitud/EncabezadoSolicitud";
import { ResumenCalculos } from "./detalle-solicitud/ResumenCalculos";
import { SeccionFormularioSolicitud } from "./detalle-solicitud/SeccionFormularioSolicitud";
import { SeccionSeleccionCeco } from "./detalle-solicitud/SeccionSeleccionCeco";
import { ListaAprobadores } from "./detalle-solicitud/ListaAprobadores";
import { ListaFechas } from "./detalle-solicitud/ListaFechas";
import { DialogoAlertaGlobal } from "./detalle-solicitud/DialogoAlertaGlobal";

interface RequestDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    record: OvertimeRecord | null;
    onSave?: (id: string, updatedData: Partial<OvertimeRecord>) => void | Promise<void>;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
    onMarkReviewed?: (id: string, reviewedApproverToken?: string) => void;
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

export const RequestDetailModal = ({
    open,
    onOpenChange,
    record,
    onSave,
    onApprove,
    onReject,
    onMarkReviewed,
    overtimeRates,
    unidades,
    holidays,
    readOnly = false
}: RequestDetailModalProps) => {
    const {
        selectedCentroCostos,
        cecoInputValue,
        cecoSuggestions,
        allCentroCostos,
        formData,
        setFormData,
        calculation,
        resendingEmail,
        viewedRecord,
        confirmAction,
        setConfirmAction,
        handleCecoInputChange,
        addCentroCosto,
        removeCentroCosto,
        updateCentroCostoPorcentaje,
        updateSelectedDate,
        executeResendEmail
    } = useModalDetalleSolicitud(open, record, overtimeRates, unidades, holidays);

    // Asegura que en el modal se muestren todos los aprobadores esperados por CeCo.
    const getApproversForDisplay = (): ApproverInfo[] => {
        const normalizedByKey = new Map<string, ApproverInfo>();
        const selectedCecos = new Set(
            selectedCentroCostos
                .map(cc => String(cc?.numero || "").trim())
                .filter(Boolean)
        );

        const normalizeCecos = (centrosCosto?: string[]) => {
            return Array.from(
                new Set((centrosCosto || []).map(cc => String(cc || "").trim()).filter(Boolean))
            ).sort();
        };

        const hasApproverForCeco = (email: string, ceco: string) => {
            return Array.from(normalizedByKey.values()).some(a =>
                a.email === email && (a.centrosCosto || []).includes(ceco)
            );
        };

        (viewedRecord?.approvers || []).forEach((approver) => {
            const email = String(approver.email || "").trim().toLowerCase();
            if (!email) return;

            const cecos = normalizeCecos(approver.centrosCosto);
            const uniqueKey = approver.token
                ? `token:${approver.token}`
                : `email:${email}|cc:${cecos.join(",") || "none"}`;

            normalizedByKey.set(uniqueKey, {
                ...approver,
                email,
                name: approver.name || email,
                estado: approver.estado || "pendiente",
                centrosCosto: cecos
            });
        });

        (unidades || []).forEach((unidad) => {
            const directorEmail = String(unidad?.director?.email || "").trim().toLowerCase();
            if (!directorEmail) return;

            const matchedCecos = (unidad.centrosCosto || [])
                .map(cc => String(cc?.numero || "").trim())
                .filter(numero => numero && selectedCecos.has(numero));

            if (matchedCecos.length === 0) return;

            matchedCecos.forEach((cc) => {
                if (hasApproverForCeco(directorEmail, cc)) return;

                normalizedByKey.set(`email:${directorEmail}|cc:${cc}`, {
                    email: directorEmail,
                    name: unidad.director.nombre || directorEmail,
                    estado: "pendiente",
                    centrosCosto: [cc],
                });
            });
        });

        return Array.from(normalizedByKey.values()).filter((approver) => {
            const approverCecos = (approver.centrosCosto || [])
                .map(cc => String(cc || "").trim())
                .filter(Boolean);

            // Si no hay CeCos seleccionados aún, mostrar lo que venga del registro.
            if (selectedCecos.size === 0) return true;

            // Mostrar solo aprobadores relacionados con la fecha seleccionada.
            return approverCecos.some(cc => selectedCecos.has(cc));
        });
    };

    const displayApprovers = getApproversForDisplay();
    const getReviewSelector = (approver: ApproverInfo): string => {
        const cecoKey = (approver.centrosCosto || [])
            .map((cc) => String(cc || "").trim())
            .filter(Boolean)
            .sort()
            .join(",");
        return approver.token || `${String(approver.email || "").trim().toLowerCase()}|${cecoKey}`;
    };
    const inReviewApprovers = useMemo(() => {
        const base = viewedRecord?.approvers || [];
        return base
            .filter((a) => a.estado === "en_revision")
            .map((a) => ({
                ...a,
                email: String(a.email || "").trim().toLowerCase(),
                name: a.name || a.email,
                centrosCosto: Array.from(new Set((a.centrosCosto || []).map((cc) => String(cc || "").trim()).filter(Boolean))).sort(),
            }));
    }, [viewedRecord?.approvers]);
    const lockedCecosInReview = useMemo(
        () =>
            Array.from(
                new Set(
                    inReviewApprovers
                        .flatMap((a) => (a.centrosCosto || []).map((cc) => String(cc || "").trim()))
                        .filter(Boolean)
                )
            ),
        [inReviewApprovers]
    );
    const [selectedReviewToken, setSelectedReviewToken] = useState<string>("");

    useEffect(() => {
        const validSelectors = new Set(inReviewApprovers.map(getReviewSelector));

        if (selectedReviewToken && validSelectors.has(selectedReviewToken)) {
            return;
        }

        if (inReviewApprovers.length === 1) {
            setSelectedReviewToken(getReviewSelector(inReviewApprovers[0]));
            return;
        }

        setSelectedReviewToken("");
    }, [inReviewApprovers, selectedReviewToken]);

    const [isSaving, setIsSaving] = useState(false);

    if (!viewedRecord) return null;

    const isEditable =
        viewedRecord.estado === "pendiente" ||
        viewedRecord.estado === "en_revision" ||
        viewedRecord.estado === "pendiente_nomina";
    const allApproversApproved =
        Array.isArray(viewedRecord.approvers) &&
        viewedRecord.approvers.length > 0 &&
        viewedRecord.approvers.every((a) => a.estado === "aprobado");
    const canApprove =
        viewedRecord.estado === "pendiente_nomina" ||
        (viewedRecord.estado === "pendiente" && allApproversApproved);
    const totalPercentage = selectedCentroCostos.reduce((sum, c) => sum + c.porcentaje, 0);
    const hasValidSalary = (parseFloat(formData.salario) || 0) > 0;

    const buildUpdatePayload = (): Partial<OvertimeRecord> & { recalculateTotals?: boolean } => ({
        salario: parseFloat(formData.salario),
        recalculateTotals: true,
        centroCosto: selectedCentroCostos.map(c => ({
            numero: c.numero,
            porcentaje: c.porcentaje
        }))
    });

    const normalizeCecos = (value: any): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) {
            return Array.from(new Set(value.map((cc: any) => String(cc?.numero || cc || "").trim()).filter(Boolean))).sort();
        }
        const single = String(value || "").trim();
        return single ? [single] : [];
    };

    const existingCecos = normalizeCecos(
        viewedRecord?.dateEntries?.[0]?.centroCosto?.length
            ? viewedRecord.dateEntries?.[0]?.centroCosto
            : viewedRecord?.centroCosto
    );
    const currentCecos = normalizeCecos(selectedCentroCostos);
    const addedCecos = currentCecos.filter((cc) => !existingCecos.includes(cc));

    const saveRecipients = displayApprovers
        .filter((approver) => {
            const approverCecos = normalizeCecos(approver.centrosCosto);
            return approverCecos.some((cc) => addedCecos.includes(cc));
        })
        .map((approver) => ({
            email: approver.email,
            cecos: normalizeCecos(approver.centrosCosto).filter((cc) => addedCecos.includes(cc)),
        }));

    const executeSave = async () => {
        if (!onSave || !viewedRecord) return;

        if (totalPercentage !== 100) {
            toast.error("El total de porcentajes debe ser 100% para guardar.");
            return;
        }

        try {
            setIsSaving(true);
            await Promise.resolve(onSave(viewedRecord.id, buildUpdatePayload()));
            onOpenChange(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        if (!onSave || !viewedRecord) return;

        if (totalPercentage !== 100) {
            toast.error("El total de porcentajes debe ser 100% para guardar.");
            return;
        }

        if (addedCecos.length > 0) {
            setConfirmAction({
                type: "save",
                title: "Confirmar envío de correos",
                description: "Se enviará notificación por los centros de costo recién agregados.",
                actionLabel: "Guardar y enviar",
                data: {
                    addedCecos,
                    recipients: saveRecipients,
                },
            });
            return;
        }

        await executeSave();
    };

    const handleConfirmAction = async () => {
        if (!confirmAction || !viewedRecord) return;

        if (confirmAction.type === "approve" && onApprove) {
            if (!hasValidSalary) {
                toast.error("Debes ingresar un salario mayor a 0 antes de la aprobación final.");
                return;
            }

            // Persistir salario/centros de costo antes de la aprobación final de nómina.
            if (onSave) {
                await Promise.resolve(
                    onSave(
                        viewedRecord.id,
                        {
                            ...buildUpdatePayload(),
                            // Este flag indica al backend que debe revalidar y notificar al marcar revisado.
                            triggerReapproval: true,
                        } as any
                    )
                );
            }

            onApprove(viewedRecord.id);
        } else if (confirmAction.type === "reject" && onReject) {
            onReject(viewedRecord.id);
        } else if (confirmAction.type === "mark-reviewed" && onMarkReviewed) {
            if (totalPercentage !== 100) {
                toast.error("El total de porcentajes debe ser 100% antes de marcar como revisado.");
                return;
            }

            if (onSave) {
                await Promise.resolve(onSave(viewedRecord.id, buildUpdatePayload()));
            }

            if (inReviewApprovers.length > 1 && !selectedReviewToken) {
                toast.error("Selecciona el centro de costo/aprobador a marcar como revisado.");
                return;
            }
            const tokenToReview = selectedReviewToken || (inReviewApprovers[0] ? getReviewSelector(inReviewApprovers[0]) : undefined);
            onMarkReviewed(viewedRecord.id, tokenToReview);
        } else if (confirmAction.type === "resend") {
            executeResendEmail(confirmAction.data.email, viewedRecord.id);
        } else if (confirmAction.type === "save") {
            await executeSave();
        }
        setConfirmAction(null);
        if (confirmAction.type !== "resend") onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[96vw] max-w-5xl h-[92vh] max-h-[92vh] p-0 overflow-hidden flex flex-col gap-0">
                <div className="p-6 pb-2 shrink-0 border-b bg-background">
                    <EncabezadoSolicitud record={viewedRecord} />
                </div>

                <ScrollArea className="flex-1 min-h-0 px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 pr-2">
                        <div className="space-y-6">
                            <SeccionFormularioSolicitud
                                formData={formData}
                                onSalarioChange={(val) => setFormData({ ...formData, salario: val })}
                                isEditable={isEditable}
                            />
                            
                            <SeccionSeleccionCeco
                                cecoInputValue={cecoInputValue}
                                onCecoInputChange={handleCecoInputChange}
                                cecoSuggestions={cecoSuggestions}
                                onAddCeco={addCentroCosto}
                                selectedCentroCostos={selectedCentroCostos}
                                allCentroCostos={allCentroCostos}
                                onRemoveCeco={removeCentroCosto}
                                onUpdatePorcentaje={updateCentroCostoPorcentaje}
                                lockedCentroCostos={lockedCecosInReview}
                                disabled={!isEditable}
                            />

                            <ListaFechas 
                                dateEntries={viewedRecord.dateEntries || []}
                                currentDate={formData.fecha}
                                currentStart={formData.horaInicio}
                                currentEnd={formData.horaFinal}
                                onEntryClick={updateSelectedDate}
                            />
                        </div>

                        <div className="space-y-6">
                            <ResumenCalculos calculation={calculation} />
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                                    <h3>Estado de aprobaciones</h3>
                                </div>
                                <ListaAprobadores
                                    approvers={displayApprovers}
                                    viewedRecord={viewedRecord}
                                    resendingEmail={resendingEmail}
                                    onResendEmail={(email) => setConfirmAction({
                                        type: "resend",
                                        data: { email },
                                        title: "Reenviar correo",
                                        description: `¿Estás seguro que deseas reenviar el correo de aprobación a ${email}?`,
                                        actionLabel: "Reenviar"
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <Separator className="shrink-0" />

                <DialogFooter className="shrink-0 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 gap-3 border-t sm:gap-3 sm:justify-between">
                    <div className="flex-1 flex justify-start gap-2">
                        {onReject && viewedRecord.estado !== "en_revision" && !readOnly && (
                            <Button
                                variant="outline"
                                className="h-11 px-4 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setConfirmAction({
                                    type: "reject",
                                    title: "Rechazar solicitud",
                                    description: "¿Estás seguro que deseas rechazar esta solicitud de horas extras?",
                                    actionLabel: "Rechazar"
                                })}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Rechazar
                            </Button>
                        )}
                        {onMarkReviewed && viewedRecord.estado === "en_revision" && !readOnly && (
                            <div className="flex items-center gap-2">
                                {inReviewApprovers.length > 1 && (
                                    <select
                                        value={selectedReviewToken}
                                        onChange={(e) => setSelectedReviewToken(e.target.value)}
                                        className="h-11 rounded-md border border-amber-300 bg-white px-3 text-sm text-slate-800"
                                    >
                                        <option value="">Selecciona centro de costo...</option>
                                        {inReviewApprovers.map((approver, idx) => {
                                            const cecos = (approver.centrosCosto || []).map((cc) => String(cc || "").trim()).filter(Boolean).join(", ") || "Sin CeCo";
                                            const selector = getReviewSelector(approver);
                                            return (
                                                <option key={approver.token || `${approver.email}-${idx}`} value={selector}>
                                                    {(approver.name || approver.email)} - {cecos}
                                                </option>
                                            );
                                        })}
                                    </select>
                                )}
                                <Button
                                    variant="outline"
                                    className="h-11 px-4 text-amber-800 border-amber-300 hover:bg-amber-50 hover:text-amber-900"
                                    onClick={() => setConfirmAction({
                                        type: "mark-reviewed",
                                        title: "Marcar como revisado",
                                        description: "Esta acción habilitará nuevamente al aprobador para aprobar o rechazar desde su enlace. ¿Deseas continuar?",
                                        actionLabel: "Marcar revisado"
                                    })}
                                >
                                    Marcar revisado
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="flex w-full sm:w-auto gap-2 justify-end">
                        <Button
                            variant="outline"
                            className="h-11 px-5 border-slate-400 text-slate-800 hover:bg-slate-100 hover:text-slate-900"
                            onClick={() => onOpenChange(false)}
                        >
                            Cerrar
                        </Button>
                        {isEditable && !canApprove && (
                            <Button
                                className="h-11 px-5 bg-[#00A352] hover:bg-[#008a45] text-white font-semibold shadow-sm"
                                onClick={handleSave}
                                disabled={totalPercentage !== 100 || isSaving}
                            >
                                <Check className="h-4 w-4 mr-2" />
                                {isSaving ? "Guardando..." : "Guardar cambios"}
                            </Button>
                        )}
                        {canApprove && onApprove && (
                            <div className="flex flex-col items-end gap-1">
                                <Button
                                    className="h-11 px-5 bg-[#00A352] hover:bg-[#008a45] text-white font-semibold shadow-lg ring-2 ring-green-500/20"
                                    onClick={() => setConfirmAction({
                                        type: "approve",
                                        title: "Aprobación final",
                                        description: "Esta acción marcará la solicitud como aprobada para el procesamiento de nómina. ¿Deseas continuar?",
                                        actionLabel: "Confirmar aprobación"
                                    })}
                                    disabled={totalPercentage !== 100 || !hasValidSalary}
                                >
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Aprobación final
                                </Button>
                                {!hasValidSalary && (
                                    <p className="text-xs text-red-600">Ingresa un salario mayor a 0 para aprobar.</p>
                                )}
                            </div>
                        )}
                    </div>
                </DialogFooter>

                <DialogoAlertaGlobal
                    confirmAction={confirmAction}
                    onClose={() => setConfirmAction(null)}
                    onConfirm={handleConfirmAction}
                />
            </DialogContent>
        </Dialog>
    );
};