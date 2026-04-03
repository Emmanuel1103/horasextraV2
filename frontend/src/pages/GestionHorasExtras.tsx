import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import MainLayout from "@/componentes/diseno/MainLayout";
import Header from "@/componentes/diseno/Header";
import Sidebar from "@/componentes/diseno/Sidebar";
import { useTextLabels } from "@/contexts/TextLabelsContext";

// Importar nuevos componentes modularizados
import {
  NavegacionHeader,
  usePermisoGestion,
} from "./gestion-horas-extras/componentes-gestion";

import { PendientesTab } from "./gestion-horas-extras/PendientesTab";
import { ReportesTab } from "./gestion-horas-extras/ReportesTab";
import { ConfigTab } from "./gestion-horas-extras/ConfigTab";
import { useGestionData } from "./gestion-horas-extras/hooks/useGestionData";
import { useFilters } from "./gestion-horas-extras/hooks/useFilters";
import { toast } from "sonner";

const GestionHorasExtras = () => {
  type AdminSection = "pendientes" | "reportes" | "configuracion";
  const [searchParams, setSearchParams] = useSearchParams();
  const { textLabels } = useTextLabels();
  const { usuario, estaAutenticado, authLoading } = usePermisoGestion();
  const moduloUrl = searchParams.get("modulo");
  const moduloInicial: AdminSection =
    moduloUrl === "reportes" || moduloUrl === "configuracion" || moduloUrl === "pendientes"
      ? moduloUrl
      : "pendientes";
  const [adminSection, setAdminSection] = useState<AdminSection>(moduloInicial);

  const changeSection = (section: AdminSection) => {
    setAdminSection(section);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("modulo", section);
    setSearchParams(nextParams, { replace: true });
  };

  // Custom hooks para manejar datos y filtros
  const {
    records,
    loading,
    isAuthenticated,
    horariosConfig,
    setHorariosConfig,
    overtimeRates,
    setOvertimeRates,
    unidades,
    holidays,
    handleApprove,
    handleReject,
    handleMarkReviewed,
    handleEdit,
    handleLogout,
    handleSaveHorarios,
    handleSaveOvertimeRates,
    handleUnidadesChange,
    handleHolidaysChange,
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
  } = useGestionData();

  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filterName,
    setFilterName,
    filterStatus,
    setFilterStatus,
    filteredRecords,
    handleApplyFilter,
    handleClearFilters,
  } = useFilters(records);

  const pendingRecords = records.filter(record => 
    record.estado === "pendiente" || record.estado === "pendiente_nomina"
  );
  const pendingCount = pendingRecords.length;

  // Componente de navegación del header
  const navegacionHeader = <NavegacionHeader />;

  // Sidebar con opciones de navegación
  const sidebarAdmin = (
    <Sidebar
      opciones={[
        {
          id: "pendientes",
          label: "Registros en revisión",
          activo: adminSection === "pendientes",
          onClick: () => changeSection("pendientes"),
          badge: pendingCount
        },
        {
          id: "reportes",
          label: "Reportes de horas extras",
          activo: adminSection === "reportes",
          onClick: () => changeSection("reportes")
        },
        {
          id: "configuracion",
          label: "Configuración del sistema",
          activo: adminSection === "configuracion",
          onClick: () => changeSection("configuracion")
        }
      ]}
      onCerrarSesion={handleLogout}
    />
  );

  // Mostrar mensaje de carga mientras se verifica la autenticación 
  if (!estaAutenticado || authLoading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Verificando acceso...</div>;
  }

  // Protección adicional para evitar flash de contenido
  if (usuario?.role !== "NOMINA" && usuario?.role !== "DEV") {
    return null;
  }

  return (
    <>
      <Header navegacion={navegacionHeader} />
      <MainLayout sidebar={sidebarAdmin}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {adminSection === "pendientes" && (
              <PendientesTab
                records={records}
                onApprove={handleApprove}
                onReject={handleReject}
                onMarkReviewed={handleMarkReviewed}
                onEdit={handleEdit}
                overtimeRates={overtimeRates}
                unidades={unidades}
                holidays={holidays}
              />
            )}

            {adminSection === "reportes" && (
              <ReportesTab
                records={records}
                filteredRecords={filteredRecords}
                onEdit={handleEdit}
                onApprove={handleApprove}
                filterName={filterName}
                onFilterNameChange={setFilterName}
                filterStatus={filterStatus}
                onFilterStatusChange={setFilterStatus}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                onClearFilters={handleClearFilters}
                overtimeRates={overtimeRates}
                unidades={unidades}
                holidays={holidays}
                horariosConfig={horariosConfig}
              />
            )}

            {adminSection === "configuracion" && (
              <ConfigTab
                horariosConfig={horariosConfig}
                onHorariosConfigChange={setHorariosConfig}
                onSaveHorarios={handleSaveHorarios}
                overtimeRates={overtimeRates}
                onOvertimeRatesChange={setOvertimeRates}
                onSaveOvertimeRates={handleSaveOvertimeRates}
                unidades={unidades}
                onUnidadesChange={handleUnidadesChange}
                // Email template props (SMTP in .env)
                requestEmailTemplate={requestEmailTemplate}
                onRequestTemplateChange={setRequestEmailTemplate}
                requestEmailSubject={requestEmailSubject}
                onRequestSubjectChange={setRequestEmailSubject}
                decisionEmailTemplate={decisionEmailTemplate}
                onDecisionTemplateChange={setDecisionEmailTemplate}
                decisionEmailSubject={decisionEmailSubject}
                onDecisionSubjectChange={setDecisionEmailSubject}
                forReviewEmailTemplate={forReviewEmailTemplate}
                onForReviewTemplateChange={setForReviewEmailTemplate}
                forReviewEmailSubject={forReviewEmailSubject}
                onForReviewSubjectChange={setForReviewEmailSubject}
                reviewedEmailTemplate={reviewedEmailTemplate}
                onReviewedTemplateChange={setReviewedEmailTemplate}
                reviewedEmailSubject={reviewedEmailSubject}
                onReviewedSubjectChange={setReviewedEmailSubject}
                approvalRemovedEmailTemplate={approvalRemovedEmailTemplate}
                onApprovalRemovedTemplateChange={setApprovalRemovedEmailTemplate}
                approvalRemovedEmailSubject={approvalRemovedEmailSubject}
                onApprovalRemovedSubjectChange={setApprovalRemovedEmailSubject}
                onSaveTemplates={handleSaveTemplates}

                holidays={holidays}
                onHolidaysChange={handleHolidaysChange}
              />
            )}
          </>
        )}
      </MainLayout>
    </>
  );
};

export default GestionHorasExtras;
