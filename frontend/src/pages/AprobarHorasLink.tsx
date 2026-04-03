import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Header from "@/componentes/diseno/Header";
import { SectionHeader } from "@/componentes/diseno/SectionHeader";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { DateEntryCards } from "@/pages/AprobarHorasLinkComponents";
import styles from "./AprobarHorasLink.module.css";

export const AprobarHorasLink = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [request, setRequest] = useState<any>(null);
    const [motivoRechazo, setMotivoRechazo] = useState("");
    const [motivoRevision, setMotivoRevision] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [pendingDecision, setPendingDecision] = useState<"aprobado" | "rechazado" | "revisar" | null>(null);

    const emailAprobador =
        request?.emailAprobador ||
        request?.approverEmail ||
        request?.aprobadorEmail ||
        request?.approver?.email ||
        "";
    const approverCecos = request?.approver?.centrosCosto || [];
    const responseStatus = request?.estadoAprobador;
    const hasResponded = responseStatus === "aprobado" || responseStatus === "rechazado" || responseStatus === "en_revision";
    const rejectionReason =
        request?.motivoRespuestaAprobador ||
        request?.approver?.motivoRechazo ||
        request?.motivoRechazo ||
        "";
    const reviewReason =
        request?.motivoRevisionAprobador ||
        request?.approver?.motivoRevision ||
        request?.motivoRevision ||
        "";

    const navegacionHeader = (
        <span style={{ color: "white", fontSize: "0.95rem", fontWeight: 500 }}>
            Panel de aprobación
        </span>
    );

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/requests/approve-by-link/${token}`);
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || "No se pudo cargar la solicitud");
                }
                const data = await response.json();
                setRequest(data);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchRequest();
    }, [token]);

    const handleDecision = async (decision: "aprobado" | "rechazado" | "revisar") => {
        const motivo = decision === "rechazado" ? motivoRechazo : decision === "revisar" ? motivoRevision : "";

        if (decision === "rechazado" && !motivo.trim()) {
            toast.error("Por favor, indique el motivo del rechazo");
            return;
        }

        if (decision === "revisar" && !motivo.trim()) {
            toast.error("Por favor, indique el motivo de revisión");
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/requests/approve-by-link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, decision, motivo })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "No se pudo procesar la solicitud");
            }

            setShowRejectForm(false);
            setShowReviewForm(false);
            setRequest((prev: any) => ({
                ...(prev || {}),
                estadoAprobador: decision === "revisar" ? "en_revision" : decision,
                motivoRespuestaAprobador: decision === "rechazado" ? motivo.trim() : prev?.motivoRespuestaAprobador,
                motivoRevisionAprobador: decision === "revisar" ? motivo.trim() : prev?.motivoRevisionAprobador,
                approver: {
                    ...(prev?.approver || {}),
                    estado: decision === "revisar" ? "en_revision" : decision,
                    motivoRechazo: decision === "rechazado" ? motivo.trim() : prev?.approver?.motivoRechazo,
                    motivoRevision: decision === "revisar" ? motivo.trim() : prev?.approver?.motivoRevision,
                },
            }));
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const openDecisionConfirmation = (decision: "aprobado" | "rechazado" | "revisar") => {
        if (decision === "rechazado" && !motivoRechazo.trim()) {
            toast.error("Por favor, indique el motivo del rechazo");
            return;
        }

        if (decision === "revisar" && !motivoRevision.trim()) {
            toast.error("Por favor, indique el motivo de revisión");
            return;
        }

        setPendingDecision(decision);
    };

    const getDecisionLabel = (decision: "aprobado" | "rechazado" | "revisar") => {
        if (decision === "aprobado") return "Aprobar";
        if (decision === "rechazado") return "Rechazar";
        return "Solicitar revisión";
    };

    const getDecisionTone = (decision: "aprobado" | "rechazado" | "revisar") => {
        if (decision === "aprobado") return "bg-green-50 border-green-200 text-green-800";
        if (decision === "rechazado") return "bg-red-50 border-red-200 text-red-800";
        return "bg-amber-50 border-amber-200 text-amber-900";
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <Header navegacion={navegacionHeader} />
                <div className="pt-24 flex flex-col items-center justify-center p-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground font-medium">Cargando detalles de la solicitud...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.page}>
                <Header navegacion={navegacionHeader} />
                <div className="pt-24 flex flex-col items-center justify-center p-4">
                    <div className={`${styles.panel} w-full max-w-md border-destructive`}>
                        <div className={`${styles.panelHeader} text-center`}>
                            <div className="flex justify-center mb-4">
                                <AlertCircle className="h-12 w-12 text-destructive" />
                            </div>
                            <h2 className="text-destructive text-xl font-semibold">Acceso denegado</h2>
                            <p className="text-sm text-slate-600 mt-2">{error}</p>
                        </div>
                        <div className={`${styles.panelFooter} flex justify-center`}>
                            <Button variant="outline" onClick={() => navigate("/")}>Ir al inicio</Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <Header navegacion={navegacionHeader} />

            <main className={styles.main}>
                <div className={styles.container}>
                    <SectionHeader
                        title="Aprobación de horas extras"
                        description="Revisa la solicitud y registra tu decisión"
                    />

                    <div className={styles.grid}>
                        <section className={styles.leftCol}>
                            <div className={styles.panel}>
                                <div className={styles.panelHeader}>
                                    <h2 className={styles.panelTitle}>
                                        Datos del colaborador
                                    </h2>
                                    <p className={styles.panelDescription}>
                                        Información principal del colaborador asociada a esta solicitud.
                                    </p>
                                </div>
                                <div className={styles.panelBody}>
                                    <dl className={styles.infoList}>
                                        <div className={styles.infoRow}>
                                            <dt className={styles.infoLabel}>Nombre</dt>
                                            <dd className={styles.infoValue}>{request.nombre || "No disponible"}</dd>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <dt className={styles.infoLabel}>Cargo</dt>
                                            <dd className={styles.infoValue}>{request.cargo || "No disponible"}</dd>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <dt className={styles.infoLabel}>Cédula</dt>
                                            <dd className={styles.infoValue}>{request.cedula || "No disponible"}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            <div className={styles.panel}>
                                <div className={styles.panelHeader}>
                                    <h2 className={styles.panelTitle}>Fechas y turnos a aprobar</h2>
                                    <p className={styles.panelDescription}>
                                        Tarjetas por fecha asociadas a este enlace de aprobación.
                                    </p>
                                </div>
                                <div className={styles.datesPanelBody}>
                                    <DateEntryCards
                                        entries={request.dateEntries || []}
                                        approverCecos={approverCecos}
                                        rowPaddingClassName="py-4"
                                        totalPaddingClassName="py-4"
                                    />
                                </div>
                            </div>
                        </section>

                        <aside className={styles.rightCol}>
                            <div className={styles.panel}>
                                <div className={styles.panelHeader}>
                                    <h2 className={styles.panelTitle}>
                                        Tu respuesta
                                    </h2>
                                    <p className={styles.panelDescription}>
                                        Esta decisión quedará registrada a nombre de quien responde este enlace.
                                    </p>
                                </div>
                                <div className={`${styles.panelBody} space-y-4 text-sm`}>
                                    <div className={styles.approverBox}>
                                            <p className="text-slate-900 font-medium">Aprobador</p>
                                            <p className="text-slate-700 ">{request.nombreAprobador || "No disponible"}</p>
                                            <p className="text-slate-500 text-sm">{emailAprobador || "No disponible"}</p>
                                            <div className="mt-3">
                                                <div
                                                    className={`w-full rounded-md border px-3 py-2 text-sm ${
                                                        responseStatus === "aprobado"
                                                            ? "bg-green-50 border-green-200 text-green-700"
                                                            : responseStatus === "rechazado"
                                                            ? "bg-red-50 border-red-200 text-red-700"
                                                            : responseStatus === "en_revision"
                                                            ? "bg-amber-50 border-amber-200 text-amber-800"
                                                            : "bg-slate-50 border-slate-200 text-slate-700"
                                                    }`}
                                                >
                                                    Estado: <span className="capitalize font-medium">{responseStatus === "en_revision" ? "en revisión" : (responseStatus || "pendiente")}</span>
                                                    {responseStatus === "rechazado" && rejectionReason && (
                                                        <p className="mt-1 text-xs leading-relaxed normal-case text-red-800 break-words [overflow-wrap:anywhere]">
                                                            Motivo: {rejectionReason}
                                                        </p>
                                                    )}
                                                    {responseStatus === "en_revision" && reviewReason && (
                                                        <p className="mt-1 text-xs leading-relaxed normal-case text-amber-800 break-words [overflow-wrap:anywhere]">
                                                            Motivo revisión: {reviewReason}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                    </div>

                                    {showRejectForm && !hasResponded && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-700">Motivo del rechazo</label>
                                            <Textarea
                                                placeholder="Escribe el motivo del rechazo..."
                                                value={motivoRechazo}
                                                onChange={(e) => setMotivoRechazo(e.target.value)}
                                                className="min-h-[120px] bg-white focus:bg-white resize-none border-slate-300"
                                            />
                                        </div>
                                    )}

                                    {showReviewForm && !hasResponded && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-700">Motivo de revisión</label>
                                            <Textarea
                                                placeholder="Escribe qué debe revisar nómina..."
                                                value={motivoRevision}
                                                onChange={(e) => setMotivoRevision(e.target.value)}
                                                className="min-h-[120px] bg-white focus:bg-white resize-none border-slate-300"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className={styles.panelFooter}>
                                    {!showRejectForm && !showReviewForm && !hasResponded && (
                                        <>
                                            <Button
                                                className="w-full h-11 text-base font-medium bg-[#0e9f4d] hover:bg-[#0b8a43] shadow-sm"
                                                onClick={() => openDecisionConfirmation("aprobado")}
                                                disabled={processing}
                                            >
                                                Aprobar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full h-11 text-base font-medium border-red-300 text-red-700 hover:bg-red-50 hover:text-red-900"
                                                onClick={() => setShowRejectForm(true)}
                                                disabled={processing}
                                            >
    
                                                Rechazar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full h-11 text-base font-medium border-amber-300 text-amber-800 hover:bg-amber-50 hover:text-amber-900"
                                                onClick={() => setShowReviewForm(true)}
                                                disabled={processing}
                                            >
                                                Enviar a revisión
                                            </Button>
                                        </>
                                    )}

                                    {showRejectForm && !hasResponded && (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="w-full h-11 text-base font-medium border-slate-300 text-slate-700 hover:bg-slate-100"
                                                onClick={() => {
                                                    setShowRejectForm(false);
                                                    setMotivoRechazo("");
                                                }}
                                                disabled={processing}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                className="w-full h-11 text-base font-medium bg-[#b42318] hover:bg-[#9f1d14] shadow-sm"
                                                onClick={() => openDecisionConfirmation("rechazado")}
                                                disabled={processing}
                                            >
                                                {processing ? <Loader2 className="animate-spin mr-2" /> : <XCircle className="mr-2 h-5 w-5" />}
                                                Confirmar rechazo
                                            </Button>
                                        </>
                                    )}

                                    {showReviewForm && !hasResponded && (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="w-full h-11 text-base font-medium border-slate-300 text-slate-700 hover:bg-slate-100"
                                                onClick={() => {
                                                    setShowReviewForm(false);
                                                    setMotivoRevision("");
                                                }}
                                                disabled={processing}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                className="w-full h-11 text-base font-medium bg-amber-600 hover:bg-amber-700 shadow-sm"
                                                onClick={() => openDecisionConfirmation("revisar")}
                                                disabled={processing}
                                            >
                                                {processing ? <Loader2 className="animate-spin mr-2" /> : null}
                                                Confirmar solicitud de revisión
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            <Dialog open={Boolean(pendingDecision)} onOpenChange={(open) => !open && setPendingDecision(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar envío de respuesta</DialogTitle>
                        <DialogDescription>
                            Revisa a quién se asocia esta respuesta antes de enviarla.
                        </DialogDescription>
                    </DialogHeader>

                    {pendingDecision && (
                        <div className="space-y-3 text-sm">
                            <div className={`rounded-md border px-3 py-2 ${getDecisionTone(pendingDecision)}`}>
                                Acción: <span className="font-semibold">{getDecisionLabel(pendingDecision)}</span>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                                <p className="font-medium text-slate-900">Se enviará como:</p>
                                <p className="text-slate-800">{request?.nombreAprobador || "No disponible"}</p>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-700 space-y-1">
                                <p><span className="font-medium text-slate-900">Colaborador:</span> {request?.nombre || "No disponible"}</p>
                                <p><span className="font-medium text-slate-900">Cargo:</span> {request?.cargo || "No disponible"}</p>
                                <p><span className="font-medium text-slate-900">Cédula:</span> {request?.cedula || "No disponible"}</p>
                            </div>
                                
                            {pendingDecision === "rechazado" && (
                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                                    <p className="font-medium">Motivo de rechazo</p>
                                    <p className="text-xs mt-1 break-words [overflow-wrap:anywhere]">{motivoRechazo.trim()}</p>
                                </div>
                            )}
                            {pendingDecision === "revisar" && (
                                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                                    <p className="font-medium">Motivo de revisión</p>
                                    <p className="text-xs mt-1 break-words [overflow-wrap:anywhere]">{motivoRevision.trim()}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button variant="outline" onClick={() => setPendingDecision(null)} disabled={processing}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-[#00A352] hover:bg-[#008a45]"
                            disabled={processing || !pendingDecision}
                            onClick={async () => {
                                if (!pendingDecision) return;
                                await handleDecision(pendingDecision);
                                setPendingDecision(null);
                            }}
                        >
                            {processing ? <Loader2 className="animate-spin mr-2" /> : null}
                            Confirmar envío
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
