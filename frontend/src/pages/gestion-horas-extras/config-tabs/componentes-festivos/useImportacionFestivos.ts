import { useState, useRef } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { Holiday } from "@/types";

export const useImportacionFestivos = (
  festivosActuales: Holiday[], 
  onFestivosChange: (festivos: Holiday[]) => void
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [festivosPreview, setFestivosPreview] = useState<Holiday[] | null>(null);
  const [erroresImportacion, setErroresImportacion] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const data = [
      { fecha: "2025-01-01", nombre: "Año Nuevo" },
      { fecha: "2025-05-01", nombre: "Día del Trabajo" },
      { fecha: "2025-12-25", nombre: "Navidad" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Festivos");
    XLSX.writeFile(wb, "plantilla_festivos.xlsx");
  };

  const parseExcel = (buffer: ArrayBuffer): { parsed: Holiday[]; errors: string[] } => {
    const errors: string[] = [];
    try {
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (rows.length === 0) {
        errors.push("La hoja de cálculo está vacía.");
        return { parsed: [], errors };
      }

      const parsedHolidays: Holiday[] = [];

      rows.forEach((row, i) => {
        // Support multiple column names
        const fechaRaw = row.fecha || row.date || row.Fecha || row.Date;
        const nombre = String(row.nombre || row.name || row.Nombre || row.Name || "").trim();

        if (!fechaRaw || !nombre) {
          errors.push(`Fila ${i + 2}: falta fecha o nombre.`);
          return;
        }

        let dateObj: Date | null = null;

        // Handle Excel serial date or string
        if (typeof fechaRaw === 'number') {
          dateObj = new Date(Math.round((fechaRaw - 25569) * 86400 * 1000));
          // Adjust for timezone if needed, usually Excel dates are local 
          // Adding 1 minute to avoid rounding issues at midnight
          dateObj.setMinutes(dateObj.getMinutes() + 1);
        } else {
          dateObj = new Date(fechaRaw);
        }

        if (isNaN(dateObj.getTime())) {
          errors.push(`Fila ${i + 2}: formato de fecha inválido.`);
          return;
        }

        // Adjust timezone offset to ensure yyyy-mm-dd is correct regardless of local execution
        const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(dateObj.getTime() + userTimezoneOffset);

        parsedHolidays.push({
          date: adjustedDate,
          name: nombre
        });
      });

      return { parsed: parsedHolidays, errors };
    } catch (e) {
      errors.push("Error al leer el archivo Excel.");
      return { parsed: [], errors };
    }
  };

  const handleExcelFile = (file: File) => {
    const validExtensions = [".xlsx", ".xls"];
    if (!validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      toast.error("Solo se admiten archivos Excel (.xlsx, .xls)");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const { parsed, errors } = parseExcel(buffer);
      setErroresImportacion(errors);
      if (parsed.length > 0) {
        setFestivosPreview(parsed);
      } else if (errors.length === 0) {
        toast.error("No se encontraron festivos válidos.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleExcelFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleExcelFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmImport = () => {
    if (!festivosPreview) return;

    // Strategy: REPLACE existing holidays with the new list
    const newHolidays = [...festivosPreview];

    // Sort by date
    newHolidays.sort((a, b) => a.date.getTime() - b.date.getTime());

    onFestivosChange(newHolidays);
    setFestivosPreview(null);
    setErroresImportacion([]);
    toast.success(`${newHolidays.length} festivos importados (se reemplazaron los anteriores).`);
  };

  const handleCancelImport = () => {
    setFestivosPreview(null);
    setErroresImportacion([]);
  };

  return {
    // Estado
    isDragging,
    setIsDragging,
    festivosPreview,
    erroresImportacion,
    fileInputRef,
    
    // Métodos
    handleDownloadTemplate,
    handleDrop,
    handleFileInputChange,
    handleConfirmImport,
    handleCancelImport,
  };
};