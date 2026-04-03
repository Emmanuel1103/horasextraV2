import { TabsContent } from "@/components/ui/tabs";
import { TemplateEditor } from "./TemplateEditor";

interface RequestTemplateProps {
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

export const RequestTemplate = ({
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
}: RequestTemplateProps) => (
    <TabsContent value="request">
        <TemplateEditor
            label="Nueva solicitud de horas extras"
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
