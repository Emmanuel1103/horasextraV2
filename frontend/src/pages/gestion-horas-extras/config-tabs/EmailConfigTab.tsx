import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, CircleHelp } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RequestTemplate } from "./email-config/RequestTemplate";
import { DecisionTemplate } from "./email-config/DecisionTemplate";
import { ForReviewTemplate } from "./email-config/ForReviewTemplate";
import { ReviewedTemplate } from "./email-config/ReviewedTemplate";
import { ApprovalRemovedTemplate } from "./email-config/ApprovalRemovedTemplate";

const templateHelpText: Record<"request" | "decision" | "forReview" | "reviewed" | "approvalRemoved", string> = {
    request: "Se envia cuando un colaborador crea una nueva solicitud de horas extras para aprobación.",
    decision: "Se envia al colaborador con el resultado final de la solicitud (aprobada o rechazada).",
    forReview: "Se envia a nómina cuando un aprobador solicita ajustes o revisión de la solicitud.",
    reviewed: "Se envia al aprobador para notificar que nómina ya revisó y actualizó la solicitud.",
    approvalRemoved: "Se envia cuando un CeCo deja de aplicar y ya no se requiere aprobación de ese aprobador.",
};

const TabLabelWithHelp = ({
    label,
    helpText,
}: {
    label: string;
    helpText: string;
}) => (
    <span className="inline-flex items-center gap-1.5">
        <span>{label}</span>
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    role="img"
                    aria-label={`Ayuda sobre plantilla ${label}`}
                    className="inline-flex items-center text-muted-foreground/80 hover:text-primary"
                >
                    <CircleHelp className="h-3.5 w-3.5" />
                </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
                {helpText}
            </TooltipContent>
        </Tooltip>
    </span>
);

export interface EmailConfigTabProps {
    requestEmailTemplate: string;
    onRequestTemplateChange: (template: string) => void;
    requestEmailSubject: string;
    onRequestSubjectChange: (subject: string) => void;
    decisionEmailTemplate: string;
    onDecisionTemplateChange: (template: string) => void;
    decisionEmailSubject: string;
    onDecisionSubjectChange: (subject: string) => void;
    forReviewEmailTemplate: string;
    onForReviewTemplateChange: (template: string) => void;
    forReviewEmailSubject: string;
    onForReviewSubjectChange: (subject: string) => void;
    reviewedEmailTemplate: string;
    onReviewedTemplateChange: (template: string) => void;
    reviewedEmailSubject: string;
    onReviewedSubjectChange: (subject: string) => void;
    approvalRemovedEmailTemplate: string;
    onApprovalRemovedTemplateChange: (template: string) => void;
    approvalRemovedEmailSubject: string;
    onApprovalRemovedSubjectChange: (subject: string) => void;
    onSaveTemplates: () => void;
}

export const EmailConfigTab = ({
    requestEmailTemplate,
    onRequestTemplateChange,
    requestEmailSubject,
    onRequestSubjectChange,
    decisionEmailTemplate,
    onDecisionTemplateChange,
    decisionEmailSubject,
    onDecisionSubjectChange,
    forReviewEmailTemplate,
    onForReviewTemplateChange,
    forReviewEmailSubject,
    onForReviewSubjectChange,
    reviewedEmailTemplate,
    onReviewedTemplateChange,
    reviewedEmailSubject,
    onReviewedSubjectChange,
    approvalRemovedEmailTemplate,
    onApprovalRemovedTemplateChange,
    approvalRemovedEmailSubject,
    onApprovalRemovedSubjectChange,
    onSaveTemplates,
}: EmailConfigTabProps) => {
    const [testEmail, setTestEmail] = useState("");
    const [sendingTest, setSendingTest] = useState(false);

    // Refs for cursor position insertion
    const requestTextareaRef = useRef<HTMLTextAreaElement>(null);
    const decisionTextareaRef = useRef<HTMLTextAreaElement>(null);
    const forReviewTextareaRef = useRef<HTMLTextAreaElement>(null);
    const reviewedTextareaRef = useRef<HTMLTextAreaElement>(null);
    const approvalRemovedTextareaRef = useRef<HTMLTextAreaElement>(null);

    const requestSubjectRef = useRef<HTMLInputElement>(null);
    const decisionSubjectRef = useRef<HTMLInputElement>(null);
    const forReviewSubjectRef = useRef<HTMLInputElement>(null);
    const reviewedSubjectRef = useRef<HTMLInputElement>(null);
    const approvalRemovedSubjectRef = useRef<HTMLInputElement>(null);

    const sendTestEmail = async (templateType: "request" | "decision" | "forReview" | "reviewed" | "approvalRemoved") => {
        if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
            toast.error("Por favor ingresa un correo válido");
            return;
        }

        let subject = "";
        switch (templateType) {
            case "request": subject = requestEmailSubject; break;
            case "decision": subject = decisionEmailSubject; break;
            case "forReview": subject = forReviewEmailSubject; break;
            case "reviewed": subject = reviewedEmailSubject; break;
            case "approvalRemoved": subject = approvalRemovedEmailSubject; break;
        }

        setSendingTest(true);
        try {
            const token = sessionStorage.getItem("authToken");
            const response = await fetch(`${API_BASE_URL}/config/test-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    templateType,
                    recipientEmail: testEmail,
                    subject: subject,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al enviar correo de prueba");
            }

            toast.success(`Correo de prueba enviado a ${testEmail}`);
        } catch (error: any) {
            toast.error(error.message || "Error al enviar correo de prueba");
        } finally {
            setSendingTest(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Configuración de correo
                </CardTitle>
                <CardDescription>
                    Gestiona las plantillas de correo electrónico para las diferentes etapas del proceso.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="request" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 h-auto flex-wrap">
                        <TabsTrigger value="request" className="gap-1.5 py-2.5 text-[11px] sm:text-xs">
                            <TabLabelWithHelp label="Solicitud" helpText={templateHelpText.request} />
                        </TabsTrigger>
                        <TabsTrigger value="decision" className="gap-1.5 py-2.5 text-[11px] sm:text-xs">
                            <TabLabelWithHelp label="Decisión" helpText={templateHelpText.decision} />
                        </TabsTrigger>
                        <TabsTrigger value="forReview" className="gap-1.5 py-2.5 text-[11px] sm:text-xs">
                            <TabLabelWithHelp label="Para revisión" helpText={templateHelpText.forReview} />
                        </TabsTrigger>
                        <TabsTrigger value="reviewed" className="gap-1.5 py-2.5 text-[11px] sm:text-xs">
                            <TabLabelWithHelp label="Revisado" helpText={templateHelpText.reviewed} />
                        </TabsTrigger>
                        <TabsTrigger value="approvalRemoved" className="gap-1.5 py-2.5 text-[11px] sm:text-xs">
                            <TabLabelWithHelp label="CeCo removido" helpText={templateHelpText.approvalRemoved} />
                        </TabsTrigger>
                    </TabsList>

                    <RequestTemplate
                        subject={requestEmailSubject}
                        onSubjectChange={onRequestSubjectChange}
                        template={requestEmailTemplate}
                        onTemplateChange={onRequestTemplateChange}
                        onSave={onSaveTemplates}
                        testEmail={testEmail}
                        onTestEmailChange={setTestEmail}
                        onSendTest={() => sendTestEmail("request")}
                        sendingTest={sendingTest}
                        subjectRef={requestSubjectRef}
                        textareaRef={requestTextareaRef}
                    />

                    <DecisionTemplate
                        subject={decisionEmailSubject}
                        onSubjectChange={onDecisionSubjectChange}
                        template={decisionEmailTemplate}
                        onTemplateChange={onDecisionTemplateChange}
                        onSave={onSaveTemplates}
                        testEmail={testEmail}
                        onTestEmailChange={setTestEmail}
                        onSendTest={() => sendTestEmail("decision")}
                        sendingTest={sendingTest}
                        subjectRef={decisionSubjectRef}
                        textareaRef={decisionTextareaRef}
                    />

                    <ForReviewTemplate
                        subject={forReviewEmailSubject}
                        onSubjectChange={onForReviewSubjectChange}
                        template={forReviewEmailTemplate}
                        onTemplateChange={onForReviewTemplateChange}
                        onSave={onSaveTemplates}
                        testEmail={testEmail}
                        onTestEmailChange={setTestEmail}
                        onSendTest={() => sendTestEmail("forReview")}
                        sendingTest={sendingTest}
                        subjectRef={forReviewSubjectRef}
                        textareaRef={forReviewTextareaRef}
                    />

                    <ReviewedTemplate
                        subject={reviewedEmailSubject}
                        onSubjectChange={onReviewedSubjectChange}
                        template={reviewedEmailTemplate}
                        onTemplateChange={onReviewedTemplateChange}
                        onSave={onSaveTemplates}
                        testEmail={testEmail}
                        onTestEmailChange={setTestEmail}
                        onSendTest={() => sendTestEmail("reviewed")}
                        sendingTest={sendingTest}
                        subjectRef={reviewedSubjectRef}
                        textareaRef={reviewedTextareaRef}
                    />

                    <ApprovalRemovedTemplate
                        subject={approvalRemovedEmailSubject}
                        onSubjectChange={onApprovalRemovedSubjectChange}
                        template={approvalRemovedEmailTemplate}
                        onTemplateChange={onApprovalRemovedTemplateChange}
                        onSave={onSaveTemplates}
                        testEmail={testEmail}
                        onTestEmailChange={setTestEmail}
                        onSendTest={() => sendTestEmail("approvalRemoved")}
                        sendingTest={sendingTest}
                        subjectRef={approvalRemovedSubjectRef}
                        textareaRef={approvalRemovedTextareaRef}
                    />
                </Tabs>
            </CardContent>
        </Card>
    );
};
