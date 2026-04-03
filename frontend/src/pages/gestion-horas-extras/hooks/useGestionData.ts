import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { OvertimeRecord, HorariosConfig, Unidad, Holiday } from "@/types";
import { OVERTIME_RATES, DEFAULT_TIME_RANGES } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { getSystemConfig, updateSystemConfig } from "@/services/configService";
import { markRequestReviewed } from "@/services/requestsApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const useGestionData = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);

  const [horariosConfig, setHorariosConfig] = useState<HorariosConfig>({
    diarnaStart: DEFAULT_TIME_RANGES.DIURNA_START,
    diarnaEnd: DEFAULT_TIME_RANGES.DIURNA_END,
    nocturnaStart: DEFAULT_TIME_RANGES.NOCTURNA_START,
    nocturnaEnd: DEFAULT_TIME_RANGES.NOCTURNA_END,
  });

  const [overtimeRates, setOvertimeRates] = useState<{
    DIURNA: number;
    NOCTURNA: number;
    DOMINICAL_DIURNA: number;
    DOMINICAL_NOCTURNA: number;
    RECARGO_DOM_DIURNO: number;
    RECARGO_DOM_NOCTURNO: number;
  }>({
    DIURNA: OVERTIME_RATES.DIURNA,
    NOCTURNA: OVERTIME_RATES.NOCTURNA,
    DOMINICAL_DIURNA: OVERTIME_RATES.DOMINICAL_DIURNA,
    DOMINICAL_NOCTURNA: OVERTIME_RATES.DOMINICAL_NOCTURNA,
    RECARGO_DOM_DIURNO: OVERTIME_RATES.RECARGO_DOM_DIURNO,
    RECARGO_DOM_NOCTURNO: OVERTIME_RATES.RECARGO_DOM_NOCTURNO,
  });

  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // Función para obtener registros del backend
  const fetchRecords = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/requests`, { headers });
      if (!response.ok) throw new Error("Error al cargar solicitudes");

      const data = await response.json();

      // Transformar datos del backend al formato del frontend
      const mappedRecords: OvertimeRecord[] = data.map((item: any) => {
        const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
        const diaSemanaStr = typeof item.diaSemana === 'number'
          ? dias[item.diaSemana]
          : (item.diaSemana || "").toLowerCase();

        return {
          ...item,
          fecha: new Date(item.fecha),
          diaSemana: diaSemanaStr,
          createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
        };
      });

      setRecords(mappedRecords);
    } catch (error) {
      console.error("Error fetching records:", error);
      toast.error("Error al cargar las solicitudes");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // --- Email Config State ---
  const [emailConfig, setEmailConfig] = useState<any>({
    host: "",
    port: 587,
    user: "",
    pass: "",
    secure: false,
    from: ""
  });
  const [requestEmailTemplate, setRequestEmailTemplate] = useState<string>("");
  const [requestEmailSubject, setRequestEmailSubject] = useState<string>("");
  const [decisionEmailTemplate, setDecisionEmailTemplate] = useState<string>("");
  const [decisionEmailSubject, setDecisionEmailSubject] = useState<string>("");
  const [forReviewEmailTemplate, setForReviewEmailTemplate] = useState<string>("");
  const [forReviewEmailSubject, setForReviewEmailSubject] = useState<string>("");
  const [reviewedEmailTemplate, setReviewedEmailTemplate] = useState<string>("");
  const [reviewedEmailSubject, setReviewedEmailSubject] = useState<string>("");
  const [approvalRemovedEmailTemplate, setApprovalRemovedEmailTemplate] = useState<string>("");
  const [approvalRemovedEmailSubject, setApprovalRemovedEmailSubject] = useState<string>("");

  // Función para cargar configuración desde el backend
  const fetchConfig = useCallback(async () => {
    if (!isAuthenticated) return;

    setConfigLoading(true);
    try {
      const config = await getSystemConfig();

      if (config.horarios) setHorariosConfig(config.horarios);
      if (config.overtimeRates) {
        setOvertimeRates({
          ...OVERTIME_RATES,
          ...config.overtimeRates
        });
      }
      if (config.unidades) setUnidades(config.unidades as Unidad[]);

      // Load email configs
      if (config.emailConfig) setEmailConfig(config.emailConfig);
      if (config.requestEmailTemplate) setRequestEmailTemplate(config.requestEmailTemplate);
      if (config.requestEmailSubject) setRequestEmailSubject(config.requestEmailSubject);
      if (config.decisionEmailTemplate) setDecisionEmailTemplate(config.decisionEmailTemplate);
      if (config.decisionEmailSubject) setDecisionEmailSubject(config.decisionEmailSubject);
      if (config.forReviewEmailTemplate) setForReviewEmailTemplate(config.forReviewEmailTemplate);
      if (config.forReviewEmailSubject) setForReviewEmailSubject(config.forReviewEmailSubject);
      if (config.reviewedEmailTemplate) setReviewedEmailTemplate(config.reviewedEmailTemplate);
      if (config.reviewedEmailSubject) setReviewedEmailSubject(config.reviewedEmailSubject);
      if (config.approvalRemovedEmailTemplate) setApprovalRemovedEmailTemplate(config.approvalRemovedEmailTemplate);
      if (config.approvalRemovedEmailSubject) setApprovalRemovedEmailSubject(config.approvalRemovedEmailSubject);

      // Legacy fallback (migrated in backend, but just in case)
      if ((config as any).approvalMessageHtml && !config.requestEmailTemplate) {
        setRequestEmailTemplate((config as any).approvalMessageHtml);
      }

      if (config.holidays) {
        // Handle migration: if strings, convert to objects
        const loadedHolidays = config.holidays.map((h: any) => {
          if (typeof h === 'string') {
            return { date: new Date(h), name: "Festivo" };
          }
          // Ensure we don't double parse if it's already a Date object
          const dateObj = h.date instanceof Date ? h.date : new Date(h.date);
          return { date: dateObj, name: h.name || "Festivo" };
        });
        setHolidays(loadedHolidays);
      }
    } catch (error) {
      console.error("Error al cargar configuración del backend:", error);
      toast.error("Error al cargar configuración");
    } finally {
      setConfigLoading(false);
    }
  }, [isAuthenticated]);

  // Cargar datos iniciales
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecords();
      fetchConfig();
    } else {
      navigate("/");
    }
  }, [isAuthenticated, navigate, fetchRecords, fetchConfig]);

  // ... (record handlers remain same)

  const handleApprove = async (id: string) => {
    try {
      const token = sessionStorage.getItem("authToken");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/requests/${id}/approve`, {
        method: "POST",
        headers,
        body: JSON.stringify({ approverEmail: "admin@example.com" })
      });

      if (!response.ok) throw new Error("Error al aprobar");

      setRecords(prev => prev.map(r => r.id === id ? { ...r, estado: "aprobado" } : r));
      toast.success("Registro aprobado");
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Error al aprobar el registro");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = sessionStorage.getItem("authToken");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/requests/${id}/reject`, {
        method: "POST",
        headers,
      });

      if (!response.ok) throw new Error("Error al rechazar");

      setRecords(prev => prev.map(r => r.id === id ? { ...r, estado: "rechazado" } : r));
      toast.success("Registro rechazado");
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Error al rechazar el registro");
    }
  };

  const handleMarkReviewed = async (id: string, reviewedApproverToken?: string) => {
    try {
      await markRequestReviewed(id, user?.email || "", reviewedApproverToken || "");

      toast.success("Solicitud marcada como revisada");
      fetchRecords();
    } catch (error) {
      console.error("Error marking reviewed:", error);
      toast.error("Error al marcar solicitud como revisada");
    }
  };

  const handleEdit = async (id: string, updatedData: Partial<OvertimeRecord>) => {
    try {
      const token = sessionStorage.getItem("authToken");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const payload = {
        ...updatedData,
        fecha: updatedData.fecha
          ? (updatedData.fecha instanceof Date
            ? updatedData.fecha.toISOString()
            : String(updatedData.fecha))
          : undefined,
      };

      const response = await fetch(`${API_URL}/requests/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let detail = "Error al actualizar";
        try {
          const errorBody = await response.json();
          if (errorBody?.error) {
            detail = String(errorBody.error);
          }
        } catch {
          // Ignore JSON parsing errors and keep fallback message.
        }
        throw new Error(detail);
      }

      const updatedRecord = await response.json();

      setRecords(prev => prev.map(r =>
        r.id === id ? { ...r, ...updatedData, ...updatedRecord } : r
      ));

      toast.success("Registro actualizado");
      fetchRecords();
    } catch (error) {
      console.error("Error updating:", error);
      const message = error instanceof Error ? error.message : "Error al actualizar el registro";
      toast.error(message);
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
  };

  // --- Handlers de configuración ---

  const handleSaveHorarios = async () => {
    try {
      await updateSystemConfig({ horarios: horariosConfig });
      toast.success("Horarios guardados exitosamente");
    } catch (e) {
      console.error("Error guardando horarios:", e);
      toast.error("Error guardando horarios");
    }
  };

  const handleSaveOvertimeRates = async () => {
    if (Object.values(overtimeRates).some(rate => rate < 1 || isNaN(rate))) {
      toast.error("Los porcentajes deben ser mayores a 1");
      return;
    }
    try {
      await updateSystemConfig({ overtimeRates });
      toast.success("Porcentajes guardados exitosamente");
    } catch (e) {
      console.error("Error guardando porcentajes:", e);
      toast.error("Error guardando porcentajes");
    }
  };

  const handleUnidadesChange = async (newUnidades: Unidad[]) => {
    setUnidades(newUnidades);
    try {
      await updateSystemConfig({ unidades: newUnidades as any });
      toast.success("Unidades actualizadas");
    } catch (e) {
      console.error("Error guardando unidades:", e);
      toast.error("Error guardando unidades");
    }
  };

  // New Email Handlers
  const handleSaveEmailConfig = async () => {
    try {
      await updateSystemConfig({ emailConfig });
      toast.success("Configuración SMTP guardada");
    } catch (e) {
      console.error("Error saving email config:", e);
      toast.error("Error al guardar configuración SMTP");
    }
  };

  const handleSaveTemplates = async () => {
    setConfigLoading(true);
    try {
      await updateSystemConfig({
        requestEmailTemplate,
        requestEmailSubject,
        decisionEmailTemplate,
        decisionEmailSubject,
        forReviewEmailTemplate,
        forReviewEmailSubject,
        reviewedEmailTemplate,
        reviewedEmailSubject,
        approvalRemovedEmailTemplate,
        approvalRemovedEmailSubject
      });
      toast.success("Plantillas guardadas correctamente");
    } catch (error) {
      toast.error("Error al guardar plantillas");
    } finally {
      setConfigLoading(false);
    }
  };

  const handleHolidaysChange = async (newHolidays: Holiday[]) => {
    setHolidays(newHolidays);
    try {
      await updateSystemConfig({
        holidays: newHolidays.map(h => ({
          date: h.date.toISOString(),
          name: h.name
        }))
      } as any);
    } catch (e) {
      console.error("Error guardando festivos:", e);
      toast.error("Error guardando festivos");
    }
  };

  return {
    records,
    loading,
    configLoading,
    isAuthenticated,
    horariosConfig,
    setHorariosConfig,
    overtimeRates,
    setOvertimeRates,
    unidades,
    holidays,
    // Email props
    emailConfig,
    setEmailConfig,
    requestEmailTemplate,
    setRequestEmailTemplate,
    requestEmailSubject,
    setRequestEmailSubject,
    decisionEmailTemplate,
    setDecisionEmailTemplate,
    decisionEmailSubject,
    setDecisionEmailSubject,
    forReviewEmailTemplate,
    setForReviewEmailTemplate,
    forReviewEmailSubject,
    setForReviewEmailSubject,
    reviewedEmailTemplate,
    setReviewedEmailTemplate,
    reviewedEmailSubject,
    setReviewedEmailSubject,
    approvalRemovedEmailTemplate,
    setApprovalRemovedEmailTemplate,
    approvalRemovedEmailSubject,
    setApprovalRemovedEmailSubject,
    handleSaveEmailConfig,
    handleSaveTemplates,

    handleApprove,
    handleReject,
    handleMarkReviewed,
    handleEdit,
    handleLogout,
    handleSaveHorarios,
    handleSaveOvertimeRates,
    handleUnidadesChange,
    handleHolidaysChange,
    fetchRecords
  };
};
