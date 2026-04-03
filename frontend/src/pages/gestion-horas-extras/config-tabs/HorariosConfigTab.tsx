import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock } from "lucide-react";
import type { HorariosConfig } from "@/types";

interface HorariosConfigTabProps {
    horariosConfig: HorariosConfig;
    onHorariosConfigChange: (config: HorariosConfig) => void;
    onSaveHorarios: () => void;
}

export const HorariosConfigTab = ({
    horariosConfig,
    onHorariosConfigChange,
    onSaveHorarios,
}: HorariosConfigTabProps) => {

    // Convertir número de hora (0-23) a formato "HH:MM"
    const numberToTime = (hour: number): string => {
        return `${String(hour).padStart(2, '0')}:00`;
    };

    // Convertir formato "HH:MM" a número (0-23)
    const timeToNumber = (time: string): number => {
        const parts = time.split(':');
        return parseInt(parts[0], 10);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Configuración de horarios
                </CardTitle>
                <CardDescription>
                    Define los rangos horarios para turnos diurnos y nocturnos
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="diurna-start">Turno diurno - Inicio</Label>
                        <Input
                            id="diurna-start"
                            type="time"
                            value={numberToTime(horariosConfig.diarnaStart)}
                            onChange={(e) => onHorariosConfigChange({
                                ...horariosConfig,
                                diarnaStart: timeToNumber(e.target.value)
                            })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="diurna-end">Turno diurno - Fin</Label>
                        <Input
                            id="diurna-end"
                            type="time"
                            value={numberToTime(horariosConfig.diarnaEnd)}
                            onChange={(e) => onHorariosConfigChange({
                                ...horariosConfig,
                                diarnaEnd: timeToNumber(e.target.value)
                            })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nocturna-start">Turno nocturno - Inicio</Label>
                        <Input
                            id="nocturna-start"
                            type="time"
                            value={numberToTime(horariosConfig.nocturnaStart)}
                            onChange={(e) => onHorariosConfigChange({
                                ...horariosConfig,
                                nocturnaStart: timeToNumber(e.target.value)
                            })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nocturna-end">Turno nocturno - Fin</Label>
                        <Input
                            id="nocturna-end"
                            type="time"
                            value={numberToTime(horariosConfig.nocturnaEnd)}
                            onChange={(e) => onHorariosConfigChange({
                                ...horariosConfig,
                                nocturnaEnd: timeToNumber(e.target.value)
                            })}
                        />
                    </div>
                </div>
                <Separator />
                <Button onClick={onSaveHorarios} className="w-full">
                    Guardar configuración de horarios
                </Button>
            </CardContent>
        </Card>
    );
};
