import { Braces, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Variable {
    name: string;
    description: string;
    category: string;
}

export const GLOBAL_VARIABLES: Variable[] = [
    { name: "fecha_correo", description: "Fecha de envío del correo", category: "Global" },
    { name: "link_sistema", description: "Link directo al sistema", category: "Global" },
    { name: "anio_actual", description: "Año actual dinámico", category: "Global" },
    { name: "nombre", description: "Nombre completo del colaborador", category: "Global" },
    { name: "cedula", description: "Cédula del colaborador", category: "Global" },
    { name: "cargo", description: "Cargo del colaborador", category: "Global" },
];

export const REQUEST_VARIABLES: Variable[] = [
    ...GLOBAL_VARIABLES,
    { name: "fecha", description: "Fecha de la hora extra (Repetible)", category: "Específicos: Solicitud" },
    { name: "hora_inicio", description: "Hora inicial (Repetible)", category: "Específicos: Solicitud" },
    { name: "hora_fin", description: "Hora final (Repetible)", category: "Específicos: Solicitud" },
    { name: "centros_costos", description: "Centros de costos (Repetible)", category: "Específicos: Solicitud" },
    { name: "descripcion_servicio", description: "Motivo / Descripción (Repetible)", category: "Específicos: Solicitud" },
    { name: "filas_tabla_horas_extras", description: "Inserta solo las filas (úselo dentro de una <table>)", category: "Específicos: Solicitud" },
    { name: "tabla_horas_extras", description: "Genera automáticamente la tabla completa con todas las filas", category: "Específicos: Solicitud" },
];

export const DECISION_VARIABLES: Variable[] = [
    ...GLOBAL_VARIABLES,
    { name: "estado", description: "Estado (Aprobado/Rechazado)", category: "Específicos: Decisión" },
    { name: "comentarios", description: "Comentarios del aprobador/jefe/admin", category: "Específicos: Decisión" },
    { name: "comentario_aprobador", description: "Comentario ingresado por el aprobador al enviar a revisión", category: "Específicos: Decisión" },
    { name: "motivo_revision", description: "Motivo de revisión registrado por el aprobador", category: "Específicos: Decisión" },
    { name: "solicitado_por", description: "Nombre del aprobador que envía a revisión", category: "Específicos: Decisión" },
    { name: "email_solicitante", description: "Correo del aprobador que envía a revisión", category: "Específicos: Decisión" },
    { name: "centros_costos", description: "Centro(s) de costo asociado(s) a la notificación", category: "Específicos: Decisión" },
    { name: "actualizado_por", description: "Usuario que realizó el ajuste", category: "Específicos: Decisión" },
];

export const ALL_TEMPLATE_VARIABLES: Variable[] = [
    ...REQUEST_VARIABLES,
    ...DECISION_VARIABLES.filter((variable) => !REQUEST_VARIABLES.some((requestVar) => requestVar.name === variable.name)),
];

interface VariablePickerProps {
    onSelect: (variable: string) => void;
}

export const VariablePicker = ({ onSelect }: VariablePickerProps) => {
    const variables = ALL_TEMPLATE_VARIABLES;

    // Group variables by category
    const categories = Array.from(new Set(variables.map(v => v.category)));

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Braces className="h-4 w-4" />
                    Insertar Variable
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[min(92vw,420px)] p-0 overflow-hidden"
                align="end"
                side="bottom"
                collisionPadding={12}
            >
                <ScrollArea className="h-[min(420px,65vh)]">
                    <div className="p-4 space-y-4">
                        <div className="flex flex-col gap-1 mb-2">
                            <h4 className="font-semibold text-sm leading-none">Variables Dinámicas</h4>
                            <p className="text-xs text-muted-foreground">
                                Haz clic para insertar en el cursor.
                            </p>
                        </div>
                        
                        {categories.map(category => (
                            <div key={category} className="space-y-1.5 pt-2 border-t first:border-t-0 first:pt-0">
                                <h5 className="text-[10px] uppercase font-bold text-primary/70 tracking-wider">
                                    {category}
                                </h5>
                                <div className="grid gap-1">
                                    {variables
                                        .filter(v => v.category === category)
                                        .map((variable) => (
                                            <Button
                                                key={variable.name}
                                                variant="ghost"
                                                size="sm"
                                                className="justify-start h-auto py-2.5 px-3 text-left hover:bg-primary/5 border border-transparent hover:border-primary/20"
                                                onClick={() => onSelect(`{{${variable.name}}}`)}
                                            >
                                                <div className="flex flex-col items-start gap-1 w-full">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="text-[13px] font-mono font-bold text-primary">
                                                            {`{{${variable.name}}}`}
                                                        </span>
                                                        <Plus className="h-3 w-3 opacity-30" />
                                                    </div>
                                                    <span className="text-[11px] text-muted-foreground leading-tight">
                                                        {variable.description}
                                                    </span>
                                                </div>
                                            </Button>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};
