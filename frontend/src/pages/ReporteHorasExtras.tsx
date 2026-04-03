import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OvertimeForm } from "@/componentes/formulario/OvertimeForm";
import Header from "@/componentes/diseno/Header";
import { PageContainer } from "@/componentes/diseno/PageContainer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTextLabels } from "@/contexts/TextLabelsContext";
import type { HorariosConfig, Unidad, OvertimeFormSubmit } from "@/types";
import { DEFAULT_TIME_RANGES } from "@/constants";
import { toast } from "sonner";
import { createOvertimeRequests } from "@/services/requestsApi";
import { useAuth } from "@/contexts/AuthContext";

const ReporteHorasExtras = () => {
  const navigate = useNavigate();
  const { textLabels } = useTextLabels();
  const { login, isAuthenticated } = useAuth();

  const [loginOpen, setLoginOpen] = useState(false);
  const [horariosConfig, setHorariosConfig] = useState<HorariosConfig>({
    diarnaStart: DEFAULT_TIME_RANGES.DIURNA_START,
    diarnaEnd: DEFAULT_TIME_RANGES.DIURNA_END,
    nocturnaStart: DEFAULT_TIME_RANGES.NOCTURNA_START,
    nocturnaEnd: DEFAULT_TIME_RANGES.NOCTURNA_END,
  });

  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [overtimeRates, setOvertimeRates] = useState({
    DIURNA: 1.25,
    NOCTURNA: 1.75,
    DOMINICAL_DIURNA: 2.0,
    DOMINICAL_NOCTURNA: 2.5
  });
  const [approvalMessageHtml, setApprovalMessageHtml] = useState("");

  // Cargar configuración pública desde el backend
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { getPublicSystemConfig } = await import("@/services/configService");
        const config = await getPublicSystemConfig();

        if (config.horarios) setHorariosConfig(config.horarios as HorariosConfig);
        if (config.unidades) {
          setUnidades(config.unidades as Unidad[]);
        }
        if (config.holidays) {
          setHolidays(config.holidays.map((h: any) => h.date));
        }
        if (config.overtimeRates) {
          setOvertimeRates(config.overtimeRates);
        }
        if (config.requestEmailTemplate) setApprovalMessageHtml(config.requestEmailTemplate);

      } catch (e) {
        console.error("Error cargando configuración dinámica:", e);
        toast.error("Error al cargar configuración del sistema. Se usarán valores por defecto.");
      }
    };

    loadConfig();
  }, []);

  const handleFormSubmit = async (formData: OvertimeFormSubmit) => {
    try {
      // Enviar datos al backend
      const response = await createOvertimeRequests(formData);

      toast.success(response.message || `${response.count} registro(s) creado(s) exitosamente`);
    } catch (error: any) {
      toast.error(error.message || "Error al conectar con el servidor");
      console.error("Error:", error);
    }
  };

  const handleGestionClick = () => {
    if (isAuthenticated) {
      navigate("/gestion-horas-extras");
    } else {
      setLoginOpen(true);
    }
  };

  const navegacionHeader = (
    <>
      <Button
        variant="ghost"
        style={{ color: "white", fontSize: "0.9375rem", fontWeight: "600" }}
      >
        {textLabels.MODULE_OVERTIME || "Reporte de horas extras"}
      </Button>
      <Button
        variant="ghost"
        onClick={handleGestionClick}
        style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9375rem" }}
      >
        {textLabels.MODULE_NOMINA || "Gestión de horas extras"}
      </Button>
    </>
  );

  return (
    <>
      <Header navegacion={navegacionHeader} />
      <div style={{ paddingTop: "4rem", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 2rem" }}>
          <PageContainer>
            {/* Título principal más grande y destacado */}
            <div style={{ marginBottom: "3rem" }}>
              <h1 style={{
                fontSize: "2.25rem",
                color: "#111827",
                marginBottom: "0.75rem",
                lineHeight: "1.2"
              }}>
                Reporte de horas extras
              </h1>
              <p style={{
                fontSize: "1.125rem",
                color: "#6b7280",
                lineHeight: "1.6",
                maxWidth: "700px"
              }}>
                Registra tus horas extras trabajadas para ser procesadas y aprobadas.
              </p>
            </div>

            <OvertimeForm
              onSubmit={handleFormSubmit}
              mode="colaborador"
              horariosConfig={horariosConfig}
              unidades={unidades}
              holidays={holidays}
              overtimeRates={overtimeRates}
              textLabels={textLabels}
              approvalMessageHtml={approvalMessageHtml}
            />
          </PageContainer>
        </div>
      </div>

      {/* Diálogo de Login Informativo */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Acceso a Gestión de horas extras</DialogTitle>
            <DialogDescription>
              Este módulo es exclusivo para administradores y personal autorizado.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Para acceder, debes iniciar sesión con tu cuenta de Microsoft y tener los permisos asignados.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setLoginOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => login()}
                className="bg-green-800 hover:bg-green-700 text-white"
              >
                Iniciar Sesión con Microsoft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReporteHorasExtras;
