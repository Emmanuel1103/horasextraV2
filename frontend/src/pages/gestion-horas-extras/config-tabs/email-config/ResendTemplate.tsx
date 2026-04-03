import { TabsContent } from "@/components/ui/tabs";
import { TemplateEditor } from "./TemplateEditor";

interface ResendTemplateProps {
    subject: string;
    onSubjectChange: (val: string) => void;
    template: string;
    onTemplateChange: (val: string) => void;
    onSave: () => void;
    testEmail: string;
    onTestEmailChange: (val: string) => void;
    onSendTest: () => void;
    sendingTest: boolean;
    subjectRef: React.RefObject<HTMLInputElement>;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const ResendTemplate = ({
    subject,
    onSubjectChange,
    template,
    onTemplateChange,
    onSave,
    testEmail,
    onTestEmailChange,
    onSendTest,
    sendingTest,
    subjectRef,
    textareaRef
}: ResendTemplateProps) => (
    <TabsContent value="resend">
        <TemplateEditor
            label="Reenvío: Solicitud de horas extras pendiente"
            textareaLabel="HTML del correo (para el aprobador)"
            subject={subject}
            onSubjectChange={onSubjectChange}
            template={template}
            onTemplateChange={onTemplateChange}
            onSave={onSave}
            testEmail={testEmail}
            onTestEmailChange={onTestEmailChange}
            onSendTest={onSendTest}
            sendingTest={sendingTest}
            subjectRef={subjectRef}
            textareaRef={textareaRef}
        />
    </TabsContent>
);
