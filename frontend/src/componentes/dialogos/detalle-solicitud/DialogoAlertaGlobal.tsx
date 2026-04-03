import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogoAlertaGlobalProps {
    confirmAction: {
        type: "approve" | "reject" | "resend" | "mark-reviewed" | "save";
        title: string;
        description: string;
        actionLabel: string;
        data?: any;
    } | null;
    onClose: () => void;
    onConfirm: () => void;
}

export const DialogoAlertaGlobal = ({ confirmAction, onClose, onConfirm }: DialogoAlertaGlobalProps) => {
    return (
        <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {confirmAction?.type === "reject" ? (
                            <XCircle className="h-5 w-5 text-green-600" />
                        ) : confirmAction?.type === "approve" ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : confirmAction?.type === "save" ? (
                            <Mail className="h-5 w-5 text-green-600" />
                        ) : confirmAction?.type === "mark-reviewed" ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                            <Mail className="h-5 w-5 text-green-600" />
                        )}
                        {confirmAction?.title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {confirmAction?.description}
                    </AlertDialogDescription>
                    {confirmAction?.type === "save" && (
                        <div className="mt-3 space-y-2 text-sm">
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                                <p className="font-medium text-slate-900">Centros de costo nuevos</p>
                                <p className="text-slate-700">
                                    {Array.isArray(confirmAction?.data?.addedCecos) && confirmAction.data.addedCecos.length > 0
                                        ? confirmAction.data.addedCecos.join(", ")
                                        : "No se detectan centros nuevos para notificar."}
                                </p>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                                <p className="font-medium text-slate-900">Se enviará a</p>
                                {Array.isArray(confirmAction?.data?.recipients) && confirmAction.data.recipients.length > 0 ? (
                                    <ul className="mt-1 space-y-1 text-slate-700">
                                        {confirmAction.data.recipients.map((r: any, idx: number) => (
                                            <li key={`${r?.email || "dest"}-${idx}`}>
                                                {r?.email || "Sin correo"}{r?.cecos?.length ? ` (${r.cecos.join(", ")})` : ""}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-slate-700 mt-1">No hay destinatarios de correo para este guardado.</p>
                                )}
                            </div>
                        </div>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={cn(
                            "text-white transition-all bg-[#00A352] hover:bg-[#008a45]"
                        )}
                    >
                        {confirmAction?.actionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
