import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign } from "lucide-react";

interface OvertimeRatesTabProps {
    overtimeRates: {
        DIURNA: number;
        NOCTURNA: number;
        DOMINICAL_DIURNA: number;
        DOMINICAL_NOCTURNA: number;
        RECARGO_DOM_DIURNO: number;
        RECARGO_DOM_NOCTURNO: number;
    };
    onOvertimeRatesChange: (rates: {
        DIURNA: number;
        NOCTURNA: number;
        DOMINICAL_DIURNA: number;
        DOMINICAL_NOCTURNA: number;
        RECARGO_DOM_DIURNO: number;
        RECARGO_DOM_NOCTURNO: number;
    }) => void;
    onSaveOvertimeRates: () => void;
}

export const OvertimeRatesTab = ({
    overtimeRates,
    onOvertimeRatesChange,
    onSaveOvertimeRates,
}: OvertimeRatesTabProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Porcentajes de recargo
                </CardTitle>
                <CardDescription>
                    Configura los multiplicadores para cada tipo de hora extra (ej: 1,25 = 125%)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="rate-diurna">Hora extra diurna</Label>
                        <div className="relative">
                            <Input
                                id="rate-diurna"
                                type="number"
                                step="0.01"
                                min="0"
                                value={overtimeRates.DIURNA}
                                onChange={(e) => onOvertimeRatesChange({
                                    ...overtimeRates,
                                    DIURNA: parseFloat(e.target.value) || 0
                                })}
                            />
                            <Badge className="absolute right-2 top-2" variant="secondary">
                                {(overtimeRates.DIURNA * 100).toFixed(0)}%
                            </Badge>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rate-nocturna">Hora extra nocturna</Label>
                        <div className="relative">
                            <Input
                                id="rate-nocturna"
                                type="number"
                                step="0.01"
                                min="0"
                                value={overtimeRates.NOCTURNA}
                                onChange={(e) => onOvertimeRatesChange({
                                    ...overtimeRates,
                                    NOCTURNA: parseFloat(e.target.value) || 0
                                })}
                            />
                            <Badge className="absolute right-2 top-2" variant="secondary">
                                {(overtimeRates.NOCTURNA * 100).toFixed(0)}%
                            </Badge>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rate-dom-diurna">Extra Dominical/Festiva diurna</Label>
                        <div className="relative">
                            <Input
                                id="rate-dom-diurna"
                                type="number"
                                step="0.01"
                                min="0"
                                value={overtimeRates.DOMINICAL_DIURNA}
                                onChange={(e) => onOvertimeRatesChange({
                                    ...overtimeRates,
                                    DOMINICAL_DIURNA: parseFloat(e.target.value) || 0
                                })}
                            />
                            <Badge className="absolute right-2 top-2" variant="secondary">
                                {(overtimeRates.DOMINICAL_DIURNA * 100).toFixed(0)}%
                            </Badge>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rate-dom-nocturna">Extra Dominical/Festiva nocturna</Label>
                        <div className="relative">
                            <Input
                                id="rate-dom-nocturna"
                                type="number"
                                step="0.01"
                                min="0"
                                value={overtimeRates.DOMINICAL_NOCTURNA}
                                onChange={(e) => onOvertimeRatesChange({
                                    ...overtimeRates,
                                    DOMINICAL_NOCTURNA: parseFloat(e.target.value) || 0
                                })}
                            />
                            <Badge className="absolute right-2 top-2" variant="secondary">
                                {(overtimeRates.DOMINICAL_NOCTURNA * 100).toFixed(0)}%
                            </Badge>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rate-recargo-dom-diurno">Recargo Dom/Fes diurno (8h)</Label>
                        <div className="relative">
                            <Input
                                id="rate-recargo-dom-diurno"
                                type="number"
                                step="0.01"
                                min="0"
                                value={overtimeRates.RECARGO_DOM_DIURNO}
                                onChange={(e) => onOvertimeRatesChange({
                                    ...overtimeRates,
                                    RECARGO_DOM_DIURNO: parseFloat(e.target.value) || 0
                                })}
                            />
                            <Badge className="absolute right-2 top-2" variant="secondary">
                                {(overtimeRates.RECARGO_DOM_DIURNO * 100).toFixed(0)}%
                            </Badge>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rate-recargo-dom-nocturno">Recargo Dom/Fes nocturno (8h)</Label>
                        <div className="relative">
                            <Input
                                id="rate-recargo-dom-nocturno"
                                type="number"
                                step="0.01"
                                min="0"
                                value={overtimeRates.RECARGO_DOM_NOCTURNO}
                                onChange={(e) => onOvertimeRatesChange({
                                    ...overtimeRates,
                                    RECARGO_DOM_NOCTURNO: parseFloat(e.target.value) || 0
                                })}
                            />
                            <Badge className="absolute right-2 top-2" variant="secondary">
                                {(overtimeRates.RECARGO_DOM_NOCTURNO * 100).toFixed(0)}%
                            </Badge>
                        </div>
                    </div>
                </div>
                <Separator />
                <Button onClick={onSaveOvertimeRates} className="w-full">
                    Guardar porcentajes de recargo
                </Button>
            </CardContent>
        </Card>
    );
};
