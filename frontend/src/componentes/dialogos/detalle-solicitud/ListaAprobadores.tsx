import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Mail, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ApproverInfo, OvertimeRecord } from "@/types";

interface ListaAprobadoresProps {
    approvers?: ApproverInfo[];
    viewedRecord: OvertimeRecord;
    resendingEmail: string | null;
    onResendEmail: (email: string, recordId: string) => void;
}

export const ListaAprobadores = ({
    approvers,
    viewedRecord,
    resendingEmail,
    onResendEmail
}: ListaAprobadoresProps) => {
    const getApprovalLink = (approver: ApproverInfo) => {
        if ((approver as any).token) {
            const base = (import.meta as any).env?.VITE_FRONTEND_URL || window.location.origin;
            return `${base}/aprobar-horas/${(approver as any).token}`;
        }
        return null;
    };

    if (!approvers || approvers.length === 0) {
        return <p className="text-sm text-muted-foreground">Sin aprobadores asignados.</p>;
    }

    return (
        <div className="space-y-3">
            {approvers.map((approver, index) => {
                const link = getApprovalLink(approver);
                const isResending = resendingEmail === approver.email;
                const approverCecos = Array.from(new Set((approver.centrosCosto || []).map(cc => String(cc).trim()).filter(Boolean)));
                const rejectionReason =
                    approver.motivoRechazo ||
                    (approver.estado === "rechazado" ? viewedRecord.motivoRechazo : "") ||
                    "";
                const reviewReason =
                    approver.motivoRevision ||
                    (approver.estado === "en_revision" ? viewedRecord.motivoRevision : "") ||
                    "";

                return (
                    <div key={index} className="flex items-center gap-3 p-2 group bg-slate-50/50 rounded-lg border border-slate-100 hover:border-slate-200 transition-all">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-900 font-medium truncate">
                                        {approver.name || approver.email}
                                    </span>
                                    {approver.estado === "aprobado" ? (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 h-4 text-[9px] px-1.5 uppercase font-bold">Aprobado</Badge>
                                    ) : approver.estado === "rechazado" ? (
                                        <Badge variant="destructive" className="h-4 text-[9px] px-1.5 uppercase font-bold">Rechazado</Badge>
                                    ) : approver.estado === "en_revision" ? (
                                        <Badge variant="outline" className="text-amber-800 border-amber-200 bg-amber-50 h-4 text-[9px] px-1.5 uppercase font-bold">En revisión</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-slate-700 border-slate-200 bg-slate-100 h-4 text-[9px] px-1.5 uppercase font-bold">Pendiente</Badge>
                                    )}
                                </div>
                                {approver.name && approver.name !== approver.email && (
                                    <span className="text-[10px] text-muted-foreground truncate">{approver.email}</span>
                                )}
                            </div>
                            {approverCecos.length > 0 && (
                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] text-slate-500">CeCos:</span>
                                    {approverCecos.map((ceco) => (
                                        <Badge
                                            key={`${approver.email}-${ceco}`}
                                            variant="outline"
                                            className="h-4 text-[9px] px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200"
                                        >
                                            {ceco}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {approver.estado === "rechazado" && rejectionReason && (
                                <p className="mt-1 text-[11px] text-red-700 leading-tight whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                    {approverCecos.length > 0
                                        ? `Motivo (${approverCecos.join(", ")}): ${rejectionReason}`
                                        : `Motivo: ${rejectionReason}`}
                                </p>
                            )}
                            {approver.estado === "en_revision" && reviewReason && (
                                <p className="mt-1 text-[11px] text-amber-800 leading-tight whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                    {approverCecos.length > 0
                                        ? `Revisión (${approverCecos.join(", ")}): ${reviewReason}`
                                        : `Revisión: ${reviewReason}`}
                                </p>
                            )}
                        </div>

                        {approver.estado === "pendiente" && viewedRecord && (
                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                {link && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-white hover:text-primary transition-colors"
                                        onClick={() => { navigator.clipboard.writeText(link || ""); toast.success("Enlace copiado"); }}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 transition-colors",
                                        isResending ? "text-slate-300" : "text-[#00A352] hover:bg-green-50 hover:text-[#008a45]"
                                    )}
                                    disabled={isResending}
                                    onClick={() => onResendEmail(approver.email, viewedRecord.id)}
                                >
                                    <Mail className={cn("h-4 w-4", isResending && "animate-pulse")} />
                                </Button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
