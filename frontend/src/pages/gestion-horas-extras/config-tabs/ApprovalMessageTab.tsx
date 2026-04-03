import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "lucide-react";
import { toast } from "sonner";

interface ApprovalMessageTabProps {
    approvalMessage: string;
    onApprovalMessageChange?: (message: string) => void;
    onSaveApprovalMessage?: () => void;
}

export const ApprovalMessageTab = ({
    approvalMessage,
    onApprovalMessageChange,
    onSaveApprovalMessage,
}: ApprovalMessageTabProps) => {

    const handleSaveApprovalMessage = () => {
        if (onSaveApprovalMessage) {
            onSaveApprovalMessage();
        } else {
            toast.success("Mensaje de aprobación guardado");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Mensaje de aprobación
                </CardTitle>
                <CardDescription>
                    Personaliza el mensaje HTML que se muestra al enviar horas extras para aprobación
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="approval-message">Contenido HTML del mensaje</Label>
                    <Textarea
                        id="approval-message"
                        value={approvalMessage}
                        onChange={(e) => onApprovalMessageChange?.(e.target.value)}
                        placeholder="<p>Estimado supervisor...</p>"
                        className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                        Puedes usar HTML para dar formato al mensaje
                    </p>
                </div>

                <Separator />

                <Button onClick={handleSaveApprovalMessage} className="w-full">
                    Guardar mensaje de aprobación
                </Button>
            </CardContent>
        </Card>
    );
};
