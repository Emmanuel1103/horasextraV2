import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileSpreadsheet, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { Unidad } from "@/types";
import { useImportacionExcel } from "./useImportacionExcel";

interface SeccionImportacionExcelProps {
  unidades: Unidad[];
  onUnidadesChange: (unidades: Unidad[]) => void;
}

export const SeccionImportacionExcel = ({
  unidades,
  onUnidadesChange
}: SeccionImportacionExcelProps) => {
  const [mostrarCargaMasiva, setMostrarCargaMasiva] = useState(false);

  const {
    isDragging,
    setIsDragging,
    csvPreview,
    csvErrors,
    fileInputRef,
    handleDownloadTemplate,
    handleDrop,
    handleFileInputChange,
    handleConfirmCsvImport,
    handleCancelCsvImport,
  } = useImportacionExcel(unidades, onUnidadesChange);

  useEffect(() => {
    if (csvPreview || csvErrors.length > 0) {
      setMostrarCargaMasiva(true);
    }
  }, [csvPreview, csvErrors.length]);

  useEffect(() => {
    const handleWindowDragEnter = (event: DragEvent) => {
      const transfer = event.dataTransfer;
      if (!transfer) return;

      const hasFiles = Array.from(transfer.types).includes("Files");
      if (hasFiles) {
        setMostrarCargaMasiva(true);
      }
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
    };
  }, []);

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setMostrarCargaMasiva((prev) => !prev)}
          className="inline-flex items-center gap-2 text-left"
        >
          <Label className="text-base font-semibold flex items-center gap-2 cursor-pointer">
            <FileSpreadsheet className="h-4 w-4" />
            Carga masiva (Excel)
          </Label>
          {mostrarCargaMasiva ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Descargar plantilla
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMostrarCargaMasiva((prev) => !prev)}
          >
            {mostrarCargaMasiva ? "Ocultar" : "Mostrar"}
          </Button>
        </div>
      </div>

      {mostrarCargaMasiva && (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">
              Arrastra un archivo Excel aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Columnas: nombre_unidad, director_nombre, director_email, centro_costo_numero, centro_costo_nombre
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>

          {csvErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Errores en el archivo:
              </p>
              {csvErrors.map((err, i) => (
                <p key={i} className="text-xs text-destructive/80 ml-6">• {err}</p>
              ))}
            </div>
          )}

          {csvPreview && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <p className="text-sm font-semibold">
                Vista previa: {csvPreview.length} unidad(es) encontrada(s)
              </p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {csvPreview.slice(0, 5).map((u, i) => (
                  <div key={i} className="text-sm p-2 bg-background rounded border">
                    <p className="font-medium">{u.nombre}</p>
                    <p className="text-xs text-muted-foreground">Dir: {u.director.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      CeCos: {u.centrosCosto.map(c => `${c.numero} - ${c.nombre}`).join(", ")}
                    </p>
                  </div>
                ))}
                {csvPreview.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground">
                    ... y {csvPreview.length - 5} más
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConfirmCsvImport} className="flex-1 gap-2">
                  <Upload className="h-4 w-4" />
                  Importar {csvPreview.length} unidades
                </Button>
                <Button variant="outline" onClick={handleCancelCsvImport}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};