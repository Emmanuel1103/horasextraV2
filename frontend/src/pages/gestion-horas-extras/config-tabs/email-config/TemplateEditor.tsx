import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { VariablePicker } from "./VariablePicker";

interface TemplateEditorProps {
    label: string;
    textareaLabel: string;
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

export const TemplateEditor = ({
    label,
    textareaLabel,
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
}: TemplateEditorProps) => {

    const insertAt = (
        variableText: string,
        elementRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement>,
        currentValue: string,
        onChange: (value: string) => void
    ) => {
        const el = elementRef.current;

        if (el) {
            const start = el.selectionStart ?? currentValue.length;
            const end = el.selectionEnd ?? currentValue.length;
            const scrollTop = (el as HTMLTextAreaElement).scrollTop ?? 0;
            const newValue = currentValue.substring(0, start) + variableText + currentValue.substring(end);
            onChange(newValue);
            setTimeout(() => {
                el.focus();
                (el as HTMLTextAreaElement).scrollTop = scrollTop;
                el.setSelectionRange(start + variableText.length, start + variableText.length);
            }, 0);
        } else {
            onChange(currentValue + variableText);
        }
    };

    return (
        <div className="space-y-4 mt-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Asunto del correo</Label>
                    <VariablePicker
                        onSelect={(variable) => insertAt(variable, subjectRef, subject, onSubjectChange)}
                    />
                </div>
                <Input
                    ref={subjectRef}
                    type="text"
                    value={subject}
                    onChange={(e) => onSubjectChange(e.target.value)}
                    placeholder={label}
                    className="font-medium"
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>{textareaLabel}</Label>
                    <VariablePicker
                        onSelect={(variable) => insertAt(variable, textareaRef, template, onTemplateChange)}
                    />
                </div>

                <Textarea
                    ref={textareaRef}
                    value={template}
                    onChange={(e) => onTemplateChange(e.target.value)}
                    className="min-h-[400px] font-mono text-xs leading-relaxed"
                    placeholder="Escribe tu plantilla HTML aquí..."
                />
            </div>

            <div className="flex gap-2 pt-2">
                <Button onClick={onSave} className="flex-1 bg-green-600 hover:bg-green-700">
                    Guardar plantilla
                </Button>
                <div className="flex gap-2 flex-1">
                    <Input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={testEmail}
                        onChange={(e) => onTestEmailChange(e.target.value)}
                        className="flex-1"
                    />
                    <Button
                        variant="secondary"
                        onClick={onSendTest}
                        disabled={sendingTest}
                    >
                        <Send className="h-4 w-4 mr-2" />
                        {sendingTest ? "Enviando..." : "Probar"}
                    </Button>
                </div>
            </div>
        </div>
    );
};
