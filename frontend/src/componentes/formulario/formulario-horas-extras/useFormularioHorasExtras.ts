import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { DateEntry, ViewMode, HorariosConfig, Unidad } from "@/types";
import { ERROR_MESSAGES, DEFAULT_TIME_RANGES } from "@/constants";

interface FormData {
  nombre: string;
  email: string;
  cedula: string;
  cargo: string;
  centroCosto: string;
}

interface UseFormularioHorasExtrasProps {
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
  onSubmit: (data: import("@/types").OvertimeFormSubmit) => void | Promise<void>;
}

interface PendingSubmission {
  payload: import("@/types").OvertimeFormSubmit;
  approvers: Array<{ name: string; email: string; centrosCosto: string[] }>;
  dateCount: number;
}

export const useFormularioHorasExtras = ({ 
  mode = "admin", 
  horariosConfig: externalConfig, 
  unidades: externalUnidades,
  holidays: externalHolidays = [],
  overtimeRates: externalOvertimeRates,
  onSubmit 
}: UseFormularioHorasExtrasProps) => {
  
  // Estado del formulario principal
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    email: "",
    cedula: "",
    cargo: "",
    centroCosto: "",
  });

  // Estado de las entradas de fecha
  const [dateEntries, setDateEntries] = useState<DateEntry[]>([{
    fecha: undefined,
    horaInicio: "",
    horaFinal: "",
    motivo: "",
    centroCosto: []
  }]);

  // Estados para centros de costo
  const [allCentroCostos, setAllCentroCostos] = useState<Array<{ numero: string; nombre: string }>>([]);

  // Estado de validación
  const [showErrors, setShowErrors] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<PendingSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configuración de horarios
  const horariosConfig = externalConfig || {
    diarnaStart: DEFAULT_TIME_RANGES.DIURNA_START,
    diarnaEnd: DEFAULT_TIME_RANGES.DIURNA_END,
    nocturnaStart: DEFAULT_TIME_RANGES.NOCTURNA_START,
    nocturnaEnd: DEFAULT_TIME_RANGES.NOCTURNA_END,
  };

  // Manejador genérico para inputs numéricos (Cédula)
  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
    const value = e.target.value;
    // Solo permitir números
    if (value === "" || /^\d+$/.test(value)) {
      setFormData({ ...formData, [field]: value });
    }
  };

  // Actualizar centros de costo cuando cambien las unidades externas
  useEffect(() => {
    if (externalUnidades && externalUnidades.length > 0) {
      const allCeCos: Array<{ numero: string; nombre: string }> = [];
      externalUnidades.forEach(unidad => {
        const rawCentrosCosto = Array.isArray((unidad as any).centrosCosto)
          ? (unidad as any).centrosCosto
          : Object.values((unidad as any).centrosCosto || {});

        rawCentrosCosto.forEach((cc: any) => {
          const numero = String(cc?.numero || "").trim();
          const nombre = String(cc?.nombre || "").trim();
          if (!numero || !nombre) return;
          allCeCos.push({ numero, nombre });
        });
      });
      setAllCentroCostos(allCeCos);
    }
  }, [externalUnidades]);

  // Construir aprobadores desde configuración: CeCo -> Director de unidad
  const getDefaultApprovers = (entries: DateEntry[]) => {
    if (!externalUnidades || externalUnidades.length === 0) return [];

    const selectedCecoNumbers = new Set<string>();
    entries.forEach(entry => {
      (entry.centroCosto || []).forEach((c: any) => {
        const numero = String(c?.numero || "").trim();
        if (numero) selectedCecoNumbers.add(numero);
      });
    });

    const approversByEmail = new Map<string, { name: string; email: string; centrosCosto: Set<string> }>();

    externalUnidades.forEach(unidad => {
      const directorEmail = String(unidad?.director?.email || "").trim().toLowerCase();
      if (!directorEmail) return;

      const matchedCecos = (unidad.centrosCosto || [])
        .map(cc => String(cc?.numero || "").trim())
        .filter(numero => numero && selectedCecoNumbers.has(numero));

      if (matchedCecos.length === 0) return;

      const existing = approversByEmail.get(directorEmail);
      if (existing) {
        matchedCecos.forEach(cc => existing.centrosCosto.add(cc));
        return;
      }

      approversByEmail.set(directorEmail, {
        name: unidad.director.nombre || directorEmail,
        email: directorEmail,
        centrosCosto: new Set(matchedCecos),
      });
    });

    return Array.from(approversByEmail.values()).map(a => ({
      name: a.name,
      email: a.email,
      centrosCosto: Array.from(a.centrosCosto),
    }));
  };

  // Operaciones con entradas de fecha
  const addDateEntry = () => {
    setDateEntries([...dateEntries, { 
      fecha: undefined,
      horaInicio: "", 
      horaFinal: "", 
      motivo: "", 
      centroCosto: [] 
    }]);
  };

  const removeDateEntry = (index: number) => {
    if (dateEntries.length > 1) {
      setDateEntries(dateEntries.filter((_, i) => i !== index));
    }
  };

  const updateDateEntry = (index: number, field: keyof DateEntry, value: any) => {
    const updated = [...dateEntries];
    updated[index] = { ...updated[index], [field]: value };
    setDateEntries(updated);
  };

  // Validación del formulario
  const isFormValid = () => {
    // Validar campos básicos según modo
    if (mode === "colaborador") {
      if (!formData.nombre || !formData.email || !formData.cedula || !formData.cargo) return false;
    } else {
      if (!formData.nombre || !formData.email || !formData.cargo) return false;
    }

    // Validar entradas de fecha
    for (const entry of dateEntries) {
      if (!entry.fecha || !entry.horaInicio || !entry.horaFinal || !entry.motivo || (entry.centroCosto || []).length === 0) {
        return false;
      }
      const total = (entry.centroCosto || []).reduce((acc: number, curr: any) => acc + (curr.porcentaje || 0), 0);
      if (total !== 100) return false;
    }
    return true;
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: "",
      email: "",
      cedula: "",
      cargo: "",
      centroCosto: "",
    });
    setDateEntries([{ 
      fecha: undefined,
      horaInicio: "", 
      horaFinal: "", 
      motivo: "", 
      centroCosto: [] 
    }]);
    setShowErrors(false);
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);

    try {
      // Validar porcentajes de centros de costo
      if (!isFormValid()) {
        toast.error("La suma de los porcentajes de centros de costo debe ser exactamente 100% para todas las fechas.");
        return;
      }

      if (!formData.nombre || !formData.email || !formData.cedula || !formData.cargo) {
        toast.error(ERROR_MESSAGES.MISSING_FIELDS);
        return;
      }

      for (const entry of dateEntries) {
        if (!entry.fecha || !entry.horaInicio || !entry.horaFinal || !entry.motivo || entry.centroCosto.length === 0) {
          toast.error(ERROR_MESSAGES.MISSING_DATE_FIELDS);
          return;
        }
      }

      const diaSemanaEntries = dateEntries.map(entry => ({
        ...entry,
        diaSemana: format(entry.fecha!, "EEEE", { locale: es }).toLowerCase()
      }));

      const approvers = getDefaultApprovers(dateEntries);
      const dataToSubmit = {
        ...formData,
        dateEntries: diaSemanaEntries,
        horariosConfig,
        overtimeRates: externalOvertimeRates,
        salario: 0,
        approvers,
        approverEmails: approvers.map(a => a.email),
      };

      if (approvers.length === 0) {
        toast.error("No se encontró aprobador para los centros de costo seleccionados. Verifica la configuración en BD.");
        return;
      }

      setPendingSubmission({
        payload: dataToSubmit,
        approvers,
        dateCount: dateEntries.length,
      });
    } catch (error) {
      toast.error("Error al procesar el formulario");
      console.error(error);
    }
  };

  const confirmPendingSubmission = async () => {
    if (!pendingSubmission) return;

    try {
      setIsSubmitting(true);
      await Promise.resolve(onSubmit(pendingSubmission.payload));
      resetForm();
      toast.success(`${pendingSubmission.dateCount} registro(s) de horas extras enviado(s) exitosamente`);
      setPendingSubmission(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al conectar con el servidor";
      toast.error(message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // Estado
    formData,
    setFormData,
    dateEntries,
    allCentroCostos,
    showErrors,
    
    // Configuración
    horariosConfig,
    mode,
    
    // Métodos
    handleNumericInputChange,
    getDefaultApprovers,
    addDateEntry,
    removeDateEntry,
    updateDateEntry,
    isFormValid,
    resetForm,
    handleSubmit,
    pendingSubmission,
    setPendingSubmission,
    confirmPendingSubmission,
    isSubmitting,
  };
};