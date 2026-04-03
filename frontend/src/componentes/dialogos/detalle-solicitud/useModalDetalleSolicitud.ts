import { useState, useEffect } from "react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { calculateOvertimePreview } from "@/services/requestsApi";
import type { OvertimeRecord, Unidad } from "@/types";

const normalizeCecoNumero = (value: unknown): string => String(value || "").trim();

const dedupeCentroCostos = (
    cecos: Array<{ numero: string; porcentaje: number; nombre?: string }>
): Array<{ numero: string; porcentaje: number; nombre?: string }> => {
    const merged = new Map<string, { numero: string; porcentaje: number; nombre?: string }>();

    cecos.forEach((cc) => {
        const numero = normalizeCecoNumero(cc?.numero);
        if (!numero) return;

        const porcentaje = Number(cc?.porcentaje || 0);
        const existing = merged.get(numero);
        if (existing) {
            merged.set(numero, {
                numero,
                porcentaje: existing.porcentaje + porcentaje,
                nombre: existing.nombre || cc?.nombre,
            });
            return;
        }

        merged.set(numero, {
            numero,
            porcentaje,
            nombre: cc?.nombre,
        });
    });

    return Array.from(merged.values()).map((cc) => ({
        ...cc,
        porcentaje: Math.max(0, Math.min(100, cc.porcentaje)),
    }));
};

export const useModalDetalleSolicitud = (
    open: boolean,
    record: OvertimeRecord | null,
    overtimeRates?: {
        DIURNA: number;
        NOCTURNA: number;
        DOMINICAL_DIURNA: number;
        DOMINICAL_NOCTURNA: number;
    },
    unidades?: Unidad[],
    holidays: any[] = []
) => {
    const { token } = useAuth();
    
    // Estados principales
    const [selectedCentroCostos, setSelectedCentroCostos] = useState<Array<{ numero: string; porcentaje: number; nombre?: string }>>([]);
    const [cecoInputValue, setCecoInputValue] = useState("");
    const [cecoSuggestions, setCecoSuggestions] = useState<Array<{ numero: string; nombre: string }>>([]);
    const [allCentroCostos, setAllCentroCostos] = useState<Array<{ numero: string; nombre: string }>>([]);
    const [formData, setFormData] = useState({
        salario: "",
        fecha: "",
        horaInicio: "",
        horaFinal: "",
        motivo: "",
    });
    const [calculation, setCalculation] = useState<{
        cantidadHoras: number;
        horasExtraDiurna: number;
        horasExtraNocturna: number;
        recargosDominicalFestivo: number;
        valorHorasExtra: number;
    } | null>(null);
    const [resendingEmail, setResendingEmail] = useState<string | null>(null);
    const [viewedRecord, setViewedRecord] = useState<OvertimeRecord | null>(null);
    const [confirmAction, setConfirmAction] = useState<{
        type: "approve" | "reject" | "resend" | "mark-reviewed" | "save";
        data?: any;
        title: string;
        description: string;
        actionLabel: string;
    } | null>(null);

    // Cargar todos los centros de costo disponibles desde las unidades
    useEffect(() => {
        if (unidades) {
            const merged = new Map<string, { numero: string; nombre: string }>();
            unidades.forEach((u) => {
                (u.centrosCosto || []).forEach((cc) => {
                    const numero = normalizeCecoNumero(cc?.numero);
                    if (!numero) return;
                    if (!merged.has(numero)) {
                        merged.set(numero, {
                            numero,
                            nombre: cc?.nombre || "",
                        });
                    }
                });
            });
            setAllCentroCostos(Array.from(merged.values()));
        }
    }, [unidades]);

    // Actualizar el registro visualizado
    useEffect(() => {
        if (record) {
            setViewedRecord(record);
        }
    }, [record, open]);

    // Inicializar datos del formulario
    useEffect(() => {
        if (viewedRecord) {
            const initialEntry = viewedRecord.dateEntries?.[0];
            const displaySalario = viewedRecord.empleado?.salario || viewedRecord.salario;
            
            setFormData({
                salario: displaySalario?.toString() || "",
                fecha: initialEntry?.fecha || (viewedRecord.fecha instanceof Date 
                    ? viewedRecord.fecha.toISOString().split('T')[0] 
                    : (viewedRecord.fecha || "")),
                horaInicio: initialEntry?.horaInicio || viewedRecord.horaInicio || "",
                horaFinal: initialEntry?.horaFinal || viewedRecord.horaFinal || "",
                motivo: initialEntry?.motivo || viewedRecord.motivo || "",
            });

            // Parsear centroCosto del registro
            let parsedCeCos: Array<{ numero: string; porcentaje: number; nombre?: string }> = [];
            const currentEntry = viewedRecord.dateEntries?.[0];
            const cecosToUse = currentEntry?.centroCosto || viewedRecord.centroCosto;

            if (Array.isArray(cecosToUse)) {
                parsedCeCos = cecosToUse.map(cc => ({
                    numero: cc.numero,
                    porcentaje: cc.porcentaje || 100,
                    nombre: (cc as any).nombre
                }));
            } else if (typeof cecosToUse === 'string' && cecosToUse) {
                parsedCeCos = [{ numero: cecosToUse, porcentaje: 100 }];
            }
            setSelectedCentroCostos(dedupeCentroCostos(parsedCeCos));

            // Se deja en null para evitar mostrar valores antiguos mientras llega
            // el cálculo centralizado del backend.
            setCalculation(null);
        }
    }, [viewedRecord, open]);

    // Recalcular cuando cambian los campos relevantes
    useEffect(() => {
        if (!viewedRecord || !open) return;

        const salario = parseFloat(formData.salario) || 0;
        const horariosConfig = {
            diarnaStart: 6,
            diarnaEnd: 22,
            nocturnaStart: 22,
            nocturnaEnd: 6,
        };

        let cancelled = false;

        const runCalculation = async () => {
            try {
                const fechaStr = String(formData.fecha || "").split("T")[0];
                if (!fechaStr || !formData.horaInicio || !formData.horaFinal) {
                    return;
                }

                const result = await calculateOvertimePreview({
                    fecha: fechaStr,
                    horaInicio: formData.horaInicio,
                    horaFinal: formData.horaFinal,
                    salario,
                    horariosConfig,
                });

                if (cancelled) return;

                setCalculation({
                    cantidadHoras: result.cantidadHoras,
                    horasExtraDiurna: result.horasExtraDiurna,
                    horasExtraNocturna: result.horasExtraNocturna,
                    recargosDominicalFestivo: result.recargosDominicalFestivo,
                    valorHorasExtra: result.valorHorasExtra,
                });
            } catch (e) {
                if (!cancelled) {
                    console.error("Error recalculando horas en modal:", e);
                }
            }
        };

        runCalculation();

        return () => {
            cancelled = true;
        };
    }, [formData.salario, formData.fecha, formData.horaInicio, formData.horaFinal, viewedRecord, open, holidays, overtimeRates]);

    // Handlers para CeCo
    const handleCecoInputChange = (value: string) => {
        setCecoInputValue(value);
        if (value.trim()) {
            const selectedSet = new Set(
                selectedCentroCostos
                    .map((c) => normalizeCecoNumero(c.numero))
                    .filter(Boolean)
            );

            const filtered = allCentroCostos.filter(cc => {
                const numero = normalizeCecoNumero(cc.numero);
                if (!numero || selectedSet.has(numero)) return false;
                return (
                    numero.toLowerCase().includes(value.toLowerCase()) ||
                    String(cc.nombre || "").toLowerCase().includes(value.toLowerCase())
                );
            });
            setCecoSuggestions(filtered);
        } else {
            setCecoSuggestions([]);
        }
    };

    const addCentroCosto = (ceco: { numero: string; nombre: string }) => {
        const normalizedNumero = normalizeCecoNumero(ceco.numero);
        if (!normalizedNumero) return;

        setSelectedCentroCostos((prev) => {
            if (prev.some((c) => normalizeCecoNumero(c.numero) === normalizedNumero)) {
                return prev;
            }
            return [...prev, { numero: normalizedNumero, porcentaje: 0, nombre: ceco.nombre }];
        });

        setCecoInputValue("");
        setCecoSuggestions([]);
    };

    const removeCentroCosto = (numero: string) => {
        const normalizedNumero = normalizeCecoNumero(numero);
        setSelectedCentroCostos((prev) => prev.filter(c => normalizeCecoNumero(c.numero) !== normalizedNumero));
    };

    const updateCentroCostoPorcentaje = (numero: string, newPorcentaje: number) => {
        const normalizedNumero = normalizeCecoNumero(numero);
        setSelectedCentroCostos((prev) => prev.map(c =>
            normalizeCecoNumero(c.numero) === normalizedNumero
                ? { ...c, porcentaje: Math.max(0, Math.min(100, newPorcentaje)) }
                : c
        ));
    };

    // NUEVA FUNCIÓN: Actualizar formulario y centros de costo para una fecha específica
    const updateSelectedDate = (entry: any) => {
        // Actualizar datos básicos del formulario
        setFormData({
            salario: formData.salario, // Mantener salario actual
            fecha: entry.fecha,
            horaInicio: entry.horaInicio,
            horaFinal: entry.horaFinal,
            motivo: entry.motivo
        });

        // Buscar la entrada específica para obtener sus centros de costo
        const specificEntry = viewedRecord?.dateEntries?.find(e => 
            e.fecha === entry.fecha && 
            e.horaInicio === entry.horaInicio && 
            e.horaFinal === entry.horaFinal
        );

        // Actualizar centros de costo específicos de esta fecha
        let parsedCeCos: Array<{ numero: string; porcentaje: number; nombre?: string }> = [];
        const cecosToUse = specificEntry?.centroCosto;

        if (Array.isArray(cecosToUse)) {
            parsedCeCos = cecosToUse.map(cc => ({
                numero: cc.numero,
                    porcentaje: cc.porcentaje || 100,
                    nombre: (cc as any).nombre
            }));
        } else if (typeof cecosToUse === 'string' && cecosToUse) {
            parsedCeCos = [{ numero: cecosToUse, porcentaje: 100 }];
        }
        setSelectedCentroCostos(dedupeCentroCostos(parsedCeCos));

        // Actualizar cálculos para esta fecha específica
        if (specificEntry) {
            setCalculation({
                cantidadHoras: specificEntry.cantidadHoras || 0,
                horasExtraDiurna: specificEntry.horasExtraDiurna || 0,
                horasExtraNocturna: specificEntry.horasExtraNocturna || 0,
                recargosDominicalFestivo: specificEntry.recargosDominicalFestivo || 0,
                valorHorasExtra: specificEntry.valorHorasExtra || 0,
            });
        }
    };

    const executeResendEmail = async (approverEmail: string, recordId: string) => {
        setResendingEmail(approverEmail);
        try {
            const response = await fetch(`${API_BASE_URL}/requests/${recordId}/resend-approval-email`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ approverEmail }),
            });
            if (!response.ok) throw new Error("Error al reenviar el correo.");
            toast.success(`Correo reenviado a ${approverEmail}`);
        } catch (e: any) {
            toast.error(e.message || "No se pudo reenviar el correo.");
        } finally {
            setResendingEmail(null);
            setConfirmAction(null);
        }
    };

    return {
        // Estados
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
        // Handlers
        handleCecoInputChange,
        addCentroCosto,
        removeCentroCosto,
        updateCentroCostoPorcentaje,
        updateSelectedDate, // NUEVA FUNCIÓN agregada
        executeResendEmail
    };
};