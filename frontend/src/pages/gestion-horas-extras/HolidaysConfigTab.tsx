import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { Holiday } from "@/types";

import { ListadoFestivos } from "./config-tabs/componentes-festivos/ListadoFestivos";
import { FormularioNuevoFestivo } from "./config-tabs/componentes-festivos/FormularioNuevoFestivo";
import { SeccionImportacionExcelFestivos } from "./config-tabs/componentes-festivos/SeccionImportacionExcelFestivos";

interface HolidaysConfigTabProps {
  holidays: Holiday[];
  onHolidaysChange: (holidays: Holiday[]) => void;
}

export const HolidaysConfigTab = ({ holidays, onHolidaysChange }: HolidaysConfigTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Configuración de festivos
        </CardTitle>
        <CardDescription>
          Administra los días festivos
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <SeccionImportacionExcelFestivos
          festivos={holidays}
          onFestivosChange={onHolidaysChange}
        />

        <FormularioNuevoFestivo
          festivos={holidays}
          onFestivosChange={onHolidaysChange}
        />

        <ListadoFestivos
          festivos={holidays}
          onFestivosChange={onHolidaysChange}
        />
      </CardContent>
    </Card>
  );
};