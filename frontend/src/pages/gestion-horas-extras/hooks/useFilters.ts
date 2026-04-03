import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { OvertimeRecord } from "@/types";

export const useFilters = (records: OvertimeRecord[]) => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filterName, setFilterName] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"todos" | "aprobado" | "rechazado">("todos");
  const [filteredRecords, setFilteredRecords] = useState<OvertimeRecord[]>([]);

  // Efecto para filtrar automáticamente con debounce
  useEffect(() => {
    const applyFilters = () => {
      try {
        const parseDateValue = (value: unknown): Date | null => {
          if (!value) return null;

          if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
          }

          if (typeof value === "number") {
            const asDate = new Date(value);
            return Number.isNaN(asDate.getTime()) ? null : asDate;
          }

          const raw = String(value).trim();
          if (!raw) return null;

          const parsed = new Date(raw);
          return Number.isNaN(parsed.getTime()) ? null : parsed;
        };

        const normalizeText = (value: unknown) =>
          String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

        const onlyDigits = (value: unknown) => String(value || "").replace(/\D/g, "");

        const historyRecords = records.filter(r => r.estado === "aprobado" || r.estado === "rechazado");
        let filtered = historyRecords;

        if (filterName.trim()) {
          const searchText = normalizeText(filterName);
          const searchDigits = onlyDigits(filterName);

          filtered = filtered.filter(record => {
            const nombre = normalizeText(record.nombre || record.empleado?.nombre);
            const cedula = String(record.cedula || record.empleado?.cedula || "");
            const cedulaDigits = onlyDigits(cedula);

            const matchesNombre = searchText ? nombre.includes(searchText) : false;
            const matchesCedula = searchDigits ? cedulaDigits.includes(searchDigits) : false;

            return matchesNombre || matchesCedula;
          });
        }

        if (filterStatus !== "todos") {
          filtered = filtered.filter((record) => record.estado === filterStatus);
        }

        if (startDate || endDate) {
          // Crear fechas en hora local (00:00:00 y 23:59:59)
          const start = startDate
            ? new Date(`${startDate}T00:00:00`)
            : new Date("1970-01-01T00:00:00");

          const end = endDate
            ? new Date(`${endDate}T23:59:59.999`)
            : new Date("2100-01-01T23:59:59.999");

          if (endDate && startDate && end < start) {
            toast.error("La fecha final no puede ser anterior a la fecha de inicio");
            return; // No filtrar si el rango es inválido
          }

          filtered = filtered.filter(record => {
            const candidateDates: Date[] = [];

            const primaryDate = parseDateValue(record.fecha);
            if (primaryDate) candidateDates.push(primaryDate);

            (record.dateEntries || []).forEach((entry) => {
              const entryDate = parseDateValue(entry?.fecha);
              if (entryDate) candidateDates.push(entryDate);
            });

            if (candidateDates.length === 0) return false;

            return candidateDates.some((recordDate) => recordDate >= start && recordDate <= end);
          });
        }

        setFilteredRecords(filtered);
      } catch (error) {
        console.error("Error filtrando registros:", error);
      }
    };

    const timer = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(timer);
  }, [records, filterName, filterStatus, startDate, endDate]);

  const handleApplyFilter = () => {
    // Deprecated: Filtering is now automatic via useEffect
  };

  const handleClearFilters = () => {
    setFilterName("");
    setFilterStatus("todos");
    setStartDate("");
    setEndDate("");
    setFilteredRecords([]);
    toast.success("Filtros eliminados");
  };

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filterName,
    setFilterName,
    filterStatus,
    setFilterStatus,
    filteredRecords,
    handleApplyFilter,
    handleClearFilters,
  };
};
