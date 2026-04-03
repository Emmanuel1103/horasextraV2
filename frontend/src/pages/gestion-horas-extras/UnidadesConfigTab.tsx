import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Plus } from "lucide-react";
import type { Unidad } from "@/types";

import { ListadoUnidades } from "./config-tabs/componentes-unidades/ListadoUnidades";
import { FormularioNuevaUnidad } from "./config-tabs/componentes-unidades/FormularioNuevaUnidad";
import { SeccionImportacionExcel } from "./config-tabs/componentes-unidades/SeccionImportacionExcel";

interface UnidadesConfigTabProps {
  unidades: Unidad[];
  onUnidadesChange: (unidades: Unidad[]) => void;
}

export const UnidadesConfigTab = ({ unidades, onUnidadesChange }: UnidadesConfigTabProps) => {
  const [mostrarFormularioUnidad, setMostrarFormularioUnidad] = useState(false);
  const [searchUnidad, setSearchUnidad] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Configuración de unidades
        </CardTitle>
        <CardDescription>
          Administra las unidades organizacionales y centros de costos
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <SeccionImportacionExcel
          unidades={unidades}
          onUnidadesChange={onUnidadesChange}
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            placeholder="Buscar unidad, director o centro de costo..."
            value={searchUnidad}
            onChange={(e) => setSearchUnidad(e.target.value)}
            className="md:flex-1"
          />
          <Button
            type="button"
            onClick={() => setMostrarFormularioUnidad((prev) => !prev)}
            className="gap-2 md:w-auto"
            variant={mostrarFormularioUnidad ? "outline" : "default"}
          >
            <Plus className="h-4 w-4" />
            {mostrarFormularioUnidad ? "Cancelar" : "Agregar unidad"}
          </Button>
        </div>

        {mostrarFormularioUnidad && (
          <FormularioNuevaUnidad
            unidades={unidades}
            onUnidadesChange={onUnidadesChange}
            onCancel={() => setMostrarFormularioUnidad(false)}
          />
        )}

        <ListadoUnidades
          unidades={unidades}
          onUnidadesChange={onUnidadesChange}
          searchUnidad={searchUnidad}
          showSearch={false}
        />
      </CardContent>
    </Card>
  );
};