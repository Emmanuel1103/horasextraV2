import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/componentes/diseno/PageContainer";
import { SectionHeader } from "@/componentes/diseno/SectionHeader";
import { Clock, DollarSign, Users, Building2, Calendar, Mail } from "lucide-react";
import type { HorariosConfig, Unidad, Holiday } from "@/types";

// Import tabs
import { HorariosConfigTab } from "./config-tabs/HorariosConfigTab";
import { OvertimeRatesTab } from "./config-tabs/OvertimeRatesTab";
import { UsersConfigTab } from "./config-tabs/UsersConfigTab";
import { UnidadesConfigTab } from "./UnidadesConfigTab";
import { HolidaysConfigTab } from "./HolidaysConfigTab";
import { EmailConfigTab } from "./config-tabs/EmailConfigTab";

interface ConfigTabProps {
  horariosConfig: HorariosConfig;
  onHorariosConfigChange: (config: HorariosConfig) => void;
  onSaveHorarios: () => void;
  overtimeRates: {
    DIURNA: number;
    NOCTURNA: number;
    DOMINICAL_DIURNA: number;
    DOMINICAL_NOCTURNA: number;
    RECARGO_DOM_DIURNO: number;
    RECARGO_DOM_NOCTURNO: number;
  };
  onOvertimeRatesChange: (rates: {
    DIURNA: number;
    NOCTURNA: number;
    DOMINICAL_DIURNA: number;
    DOMINICAL_NOCTURNA: number;
    RECARGO_DOM_DIURNO: number;
    RECARGO_DOM_NOCTURNO: number;
  }) => void;
  onSaveOvertimeRates: () => void;
  unidades?: Unidad[];
  onUnidadesChange?: (unidades: Unidad[]) => void;
  // Email template props (SMTP config now in backend .env)
  requestEmailTemplate?: string;
  onRequestTemplateChange?: (template: string) => void;
  requestEmailSubject?: string;
  onRequestSubjectChange?: (subject: string) => void;
  decisionEmailTemplate?: string;
  onDecisionTemplateChange?: (template: string) => void;
  decisionEmailSubject?: string;
  onDecisionSubjectChange?: (subject: string) => void;
  forReviewEmailTemplate?: string;
  onForReviewTemplateChange?: (template: string) => void;
  forReviewEmailSubject?: string;
  onForReviewSubjectChange?: (subject: string) => void;
  reviewedEmailTemplate?: string;
  onReviewedTemplateChange?: (template: string) => void;
  reviewedEmailSubject?: string;
  onReviewedSubjectChange?: (subject: string) => void;
  approvalRemovedEmailTemplate?: string;
  onApprovalRemovedTemplateChange?: (template: string) => void;
  approvalRemovedEmailSubject?: string;
  onApprovalRemovedSubjectChange?: (subject: string) => void;
  onSaveTemplates?: () => void;

  holidays?: Holiday[];
  onHolidaysChange?: (holidays: Holiday[]) => void;
}

export const ConfigTab = ({
  horariosConfig,
  onHorariosConfigChange,
  onSaveHorarios,
  overtimeRates,
  onOvertimeRatesChange,
  onSaveOvertimeRates,
  unidades = [],
  onUnidadesChange,
  // Email template props
  requestEmailTemplate = "",
  onRequestTemplateChange,
  requestEmailSubject = "",
  onRequestSubjectChange,
  decisionEmailTemplate = "",
  onDecisionTemplateChange,
  decisionEmailSubject = "",
  onDecisionSubjectChange,
  forReviewEmailTemplate = "",
  onForReviewTemplateChange,
  forReviewEmailSubject = "",
  onForReviewSubjectChange,
  reviewedEmailTemplate = "",
  onReviewedTemplateChange,
  reviewedEmailSubject = "",
  onReviewedSubjectChange,
  approvalRemovedEmailTemplate = "",
  onApprovalRemovedTemplateChange,
  approvalRemovedEmailSubject = "",
  onApprovalRemovedSubjectChange,
  onSaveTemplates,

  holidays = [],
  onHolidaysChange,
}: ConfigTabProps) => {
  const configTabTriggerClass =
    "gap-2 rounded-lg text-xs sm:text-sm font-medium leading-none whitespace-nowrap data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900";

  return (
    <PageContainer>
      <SectionHeader
        title="Configuración del sistema"
        description="Gestiona horarios, recargos, usuarios, unidades y más opciones del sistema"
      />

      <Tabs defaultValue="horarios" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm md:h-11 md:grid-cols-6">
          <TabsTrigger value="horarios" className={configTabTriggerClass}>
            <Clock className="h-4 w-4" />
            Horarios
          </TabsTrigger>
          <TabsTrigger value="recargos" className={configTabTriggerClass}>
            <DollarSign className="h-4 w-4" />
            Recargos
          </TabsTrigger>
          <TabsTrigger value="usuarios" className={configTabTriggerClass}>
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="unidades" className={configTabTriggerClass}>
            <Building2 className="h-4 w-4" />
            Unidades
          </TabsTrigger>
          <TabsTrigger value="festivos" className={configTabTriggerClass}>
            <Calendar className="h-4 w-4" />
            Festivos
          </TabsTrigger>
          <TabsTrigger value="mensaje" className={configTabTriggerClass}>
            <Mail className="h-4 w-4" />
            Correo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="horarios" className="mt-6">
          <HorariosConfigTab
            horariosConfig={horariosConfig}
            onHorariosConfigChange={onHorariosConfigChange}
            onSaveHorarios={onSaveHorarios}
          />
        </TabsContent>

        <TabsContent value="recargos" className="mt-6">
          <OvertimeRatesTab
            overtimeRates={overtimeRates}
            onOvertimeRatesChange={onOvertimeRatesChange}
            onSaveOvertimeRates={onSaveOvertimeRates}
          />
        </TabsContent>

        <TabsContent value="usuarios" className="mt-6">
          <UsersConfigTab />
        </TabsContent>

        <TabsContent value="unidades" className="mt-6">
          <UnidadesConfigTab
            unidades={unidades}
            onUnidadesChange={onUnidadesChange || (() => { })}
          />
        </TabsContent>

        <TabsContent value="festivos" className="mt-6">
          <HolidaysConfigTab
            holidays={holidays}
            onHolidaysChange={onHolidaysChange || (() => { })}
          />
        </TabsContent>

        <TabsContent value="mensaje" className="mt-6">
          <EmailConfigTab
            requestEmailTemplate={requestEmailTemplate}
            onRequestTemplateChange={onRequestTemplateChange || (() => { })}
            requestEmailSubject={requestEmailSubject}
            onRequestSubjectChange={onRequestSubjectChange || (() => { })}
            decisionEmailTemplate={decisionEmailTemplate}
            onDecisionTemplateChange={onDecisionTemplateChange || (() => { })}
            decisionEmailSubject={decisionEmailSubject}
            onDecisionSubjectChange={onDecisionSubjectChange || (() => { })}
            forReviewEmailTemplate={forReviewEmailTemplate}
            onForReviewTemplateChange={onForReviewTemplateChange || (() => { })}
            forReviewEmailSubject={forReviewEmailSubject}
            onForReviewSubjectChange={onForReviewSubjectChange || (() => { })}
            reviewedEmailTemplate={reviewedEmailTemplate}
            onReviewedTemplateChange={onReviewedTemplateChange || (() => { })}
            reviewedEmailSubject={reviewedEmailSubject}
            onReviewedSubjectChange={onReviewedSubjectChange || (() => { })}
            approvalRemovedEmailTemplate={approvalRemovedEmailTemplate}
            onApprovalRemovedTemplateChange={onApprovalRemovedTemplateChange || (() => { })}
            approvalRemovedEmailSubject={approvalRemovedEmailSubject}
            onApprovalRemovedSubjectChange={onApprovalRemovedSubjectChange || (() => { })}
            onSaveTemplates={onSaveTemplates || (() => { })}
          />
        </TabsContent>

      </Tabs>
    </PageContainer>
  );
};