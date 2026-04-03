import { useState, useRef } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { Unidad, CentroCosto } from "@/types";

export const useImportacionExcel = (unidades: Unidad[], onUnidadesChange: (unidades: Unidad[]) => void) => {
  const [isDragging, setIsDragging] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Unidad[] | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const data = [
      { 
        nombre_unidad: "Unidad de Educación", 
        director_nombre: "Juan Pérez", 
        director_email: "juan@fundacion.org", 
        centro_costo_numero: "1010", 
        centro_costo_nombre: "Administración" 
      },
      { 
        nombre_unidad: "Unidad de Educación", 
        director_nombre: "Juan Pérez", 
        director_email: "juan@fundacion.org", 
        centro_costo_numero: "1020", 
        centro_costo_nombre: "Operaciones" 
      },
      { 
        nombre_unidad: "Unidad de Salud", 
        director_nombre: "María López", 
        director_email: "maria@fundacion.org", 
        centro_costo_numero: "2010", 
        centro_costo_nombre: "Clínica" 
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Unidades");
    XLSX.writeFile(wb, "plantilla_unidades.xlsx");
  };

  const parseExcel = (buffer: ArrayBuffer): { parsed: Unidad[]; errors: string[] } => {
    const errors: string[] = [];
    try {
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (rows.length === 0) {
        errors.push("La hoja de cálculo está vacía.");
        return { parsed: [], errors };
      }

      const unidadMap = new Map<string, Unidad>();

      rows.forEach((row, i) => {
        const nombreUnidad = String(row.nombre_unidad || "").trim();
        const dirNombre = String(row.director_nombre || "").trim();
        const dirEmail = String(row.director_email || "").trim();
        const ccNumero = String(row.centro_costo_numero || "").trim();
        const ccNombre = String(row.centro_costo_nombre || "").trim();

        if (!nombreUnidad || !dirNombre || !dirEmail || !ccNumero || !ccNombre) {
          errors.push(`Fila ${i + 2}: hay campos vacíos.`);
          return;
        }

        const key = nombreUnidad.toLowerCase();
        if (!unidadMap.has(key)) {
          unidadMap.set(key, {
            id: `unidad-xl-${Date.now()}-${i}`,
            nombre: nombreUnidad,
            director: { 
              id: `dir-xl-${Date.now()}-${i}`, 
              nombre: dirNombre, 
              email: dirEmail 
            },
            centrosCosto: [],
          });
        }
        
        const u = unidadMap.get(key)!;
        if (!u.centrosCosto.some(cc => cc.numero === ccNumero)) {
          u.centrosCosto.push({ 
            id: `ceco-xl-${Date.now()}-${i}`, 
            numero: ccNumero, 
            nombre: ccNombre 
          });
        }
      });

      return { parsed: Array.from(unidadMap.values()), errors };
    } catch (e) {
      errors.push("Error al leer el archivo Excel. Verifica que el formato sea correcto.");
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
      setCsvErrors(errors);
      if (parsed.length > 0) {
        setCsvPreview(parsed);
      } else if (errors.length === 0) {
        toast.error("No se encontraron datos válidos en el archivo.");
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

  const handleConfirmCsvImport = () => {
    if (!csvPreview) return;
    
    // Merge: agregar nuevas, actualizar existentes por nombre
    const merged = [...unidades];
    for (const incoming of csvPreview) {
      const existingIdx = merged.findIndex(u => 
        u.nombre.toLowerCase() === incoming.nombre.toLowerCase()
      );
      
      if (existingIdx >= 0) {
        // Merge centros de costo
        const existing = merged[existingIdx];
        for (const cc of incoming.centrosCosto) {
          if (!existing.centrosCosto.some(ecc => ecc.numero === cc.numero)) {
            existing.centrosCosto.push(cc);
          }
        }
        // Actualizar director
        existing.director = incoming.director;
      } else {
        merged.push(incoming);
      }
    }
    
    onUnidadesChange(merged);
    setCsvPreview(null);
    setCsvErrors([]);
    toast.success(`${csvPreview.length} unidad(es) importada(s) exitosamente`);
  };

  const handleCancelCsvImport = () => {
    setCsvPreview(null);
    setCsvErrors([]);
  };

  return {
    // Estado
    isDragging,
    setIsDragging,
    csvPreview,
    csvErrors,
    fileInputRef,
    
    // Métodos
    handleDownloadTemplate,
    handleDrop,
    handleFileInputChange,
    handleConfirmCsvImport,
    handleCancelCsvImport,
  };
};