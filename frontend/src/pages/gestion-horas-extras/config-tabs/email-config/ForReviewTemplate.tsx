import { TabsContent } from "@/components/ui/tabs";
import { TemplateEditor } from "./TemplateEditor";

interface ForReviewTemplateProps {
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

export const ForReviewTemplate = ({
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
}: ForReviewTemplateProps) => (
    <TabsContent value="forReview">
        <TemplateEditor
            label="Solicitud de horas extras para revisión"
            textareaLabel="HTML del correo (para revisión)"
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
