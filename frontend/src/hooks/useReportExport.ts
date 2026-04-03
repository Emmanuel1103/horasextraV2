import { toast } from "sonner";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import type { OvertimeRecord, HorariosConfig } from "@/types";
import { calculateDetailedOvertime } from "@/utils/overtimeCalculations";
import {
  getRecordHours,
  getRecordAmount,
  getRecordDate,
  getRecordDay,
  getRecordApprovers,
  getCecoLabel,
  formatDateForExcel,
  formatCurrencyForExcel,
  formatHoursForExcel,
  toSafeNumber,
  parseDateValue
} from "@/utils/reportUtils";

interface UseReportExportProps {
  records: OvertimeRecord[];
  filteredRecords: OvertimeRecord[];
  displayRecords: OvertimeRecord[];
  historyRecords: OvertimeRecord[];
  overtimeRates: {
    DIURNA: number;
    NOCTURNA: number;
    DOMINICAL_DIURNA: number;
    DOMINICAL_NOCTURNA: number;
  };
  holidays?: any[];
  horariosConfig?: HorariosConfig;
}

export const useReportExport = ({
  records,
  filteredRecords,
  displayRecords,
  historyRecords,
  overtimeRates,
  holidays,
  horariosConfig
}: UseReportExportProps) => {

  const handleExportRealesTrabajadas = async () => {
    try {
      const approvedRecords = displayRecords.filter(r => r.estado === "aprobado");
      if (approvedRecords.length === 0) {
        toast.error("No hay registros aprobados para exportar");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      
      const recordsByEmployee = approvedRecords.reduce((acc, record) => {
          const name = record.empleado?.nombre || record.nombre || "Sin Nombre";
          const cedula = record.empleado?.cedula || record.cedula || "0";
          const key = `${name} - ${cedula}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(record);
          return acc;
      }, {} as Record<string, typeof approvedRecords>);

      for (const [employeeKey, empRecords] of Object.entries(recordsByEmployee)) {
          const shortName = employeeKey.substring(0, 31).replace(/[/*?:\[\]]/g, '');
          const worksheet = workbook.addWorksheet(shortName);

          worksheet.columns = [
            { header: "Cedula", key: "cedula", width: 12 },
            { header: "Nombre", key: "nombre", width: 25 },
            { header: "Salario", key: "salario", width: 15 },
            { header: "Fecha", key: "fecha", width: 12 },
            { header: "CENTRO DE COSTO", key: "ceco", width: 20 },
            { header: "Día Semana", key: "dia", width: 12 },
            { header: "Hora Inicio", key: "inicio", width: 12 },
            { header: "Hora Final", key: "final", width: 12 },
            { header: "Total Horas", key: "cantidad", width: 15 },
            { header: "HORAS EXTRAS DIURNAS", key: "he_diurna", width: 15 },
            { header: "HORAS EXTRAS NOCTURNAS", key: "he_nocturna", width: 15 },
            { header: "HORAS EXTRAS DOMINICAL DIURNAS", key: "he_dom_diurna", width: 15 },
            { header: "HORAS EXTRAS DOMINICAL NOCTURNAS", key: "he_dom_nocturna", width: 15 },
            { header: "RECARGO DOMINICAL DIURNO", key: "rec_dom_diurno", width: 15 },
            { header: "RECARGO DOMINICAL NOCTURNO", key: "rec_dom_nocturno", width: 15 },
            { header: "$ HORAS EXTRAS DIURNAS", key: "val_he_diurna", width: 15 },
            { header: "$ HORAS EXTRAS NOCTURNAS", key: "val_he_nocturna", width: 15 },
            { header: "$ HORAS EXTRAS DOMINICAL DIURNAS", key: "val_he_dom_diurna", width: 15 },
            { header: "$ HORAS EXTRAS DOMINICAL NOCTURNAS", key: "val_he_dom_nocturna", width: 15 },
            { header: "$ RECARGO DOM/FES DIURNO", key: "val_rec_dom_diurna", width: 15 },
            { header: "$ RECARGO DOM/FES NOCTURNO", key: "val_rec_dom_nocturno", width: 15 },
            { header: "TOTAL $", key: "total_dinero", width: 15 },
          ];

          const headerRow = worksheet.getRow(1);
          headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
          headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF26BA57" } };
          headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          headerRow.height = 45;

          let grandTotalHours = 0;

          empRecords.forEach(record => {
            const salario = toSafeNumber(record.salario ?? record.empleado?.salario);
            const rates = overtimeRates;
            
            (record.dateEntries || [{}]).forEach((entry: any) => {
              const fechaStr = entry.fecha || record.fecha;
              if (!fechaStr) return;

              const res = calculateDetailedOvertime(
                entry.horaInicio || record.horaInicio || "00:00", 
                entry.horaFinal || record.horaFinal || "00:00", 
                fechaStr, 
                horariosConfig || { diarnaStart: 6, diarnaEnd: 21, nocturnaStart: 21, nocturnaEnd: 6 },
                holidays as string[]
              );

              const row = worksheet.addRow({
                cedula: record.empleado?.cedula || record.cedula,
                nombre: record.empleado?.nombre || record.nombre,
                salario: salario,
                fecha: formatDateForExcel(fechaStr),
                ceco: getCecoLabel(record.centroCosto),
                dia: getRecordDay({ ...record, fecha: fechaStr, dateEntries: [] }),
                inicio: entry.horaInicio || record.horaInicio,
                final: entry.horaFinal || record.horaFinal,
                cantidad: res.cantidadHoras,
                he_diurna: res.extraDiurna || 0,
                he_nocturna: res.extraNocturna || 0,
                he_dom_diurna: res.extraDominicalDiurna || 0,
                he_dom_nocturna: res.extraDominicalNocturna || 0,
                rec_dom_diurno: res.recargoDominicalDiurno || 0,
                rec_dom_nocturno: res.recargoDominicalNocturno || 0,
              });

              const rowNumber = row.number;
              const salarioCell = `C${rowNumber}`;
              const valHoraBase = `(${salarioCell}/220)`;

              // =$ HORAS EXTRAS DIURNAS
              row.getCell(16).value = { formula: `J${rowNumber}*${valHoraBase}*${rates.DIURNA}`, result: 0 };
              // =$ HORAS EXTRAS NOCTURNAS
              row.getCell(17).value = { formula: `K${rowNumber}*${valHoraBase}*${rates.NOCTURNA}`, result: 0 };
              // =$ HORAS EXTRAS DOMINICAL DIURNAS
              row.getCell(18).value = { formula: `L${rowNumber}*${valHoraBase}*${rates.DOMINICAL_DIURNA}`, result: 0 };
              // =$ HORAS EXTRAS DOMINICAL NOCTURNAS
              row.getCell(19).value = { formula: `M${rowNumber}*${valHoraBase}*${rates.DOMINICAL_NOCTURNA}`, result: 0 };
              // =$ RECARGO DOM/FES DIURNO
              row.getCell(20).value = { formula: `N${rowNumber}*${valHoraBase}*${(rates as any).RECARGO_DOM_DIURNO || 1.8}`, result: 0 };
              // =$ RECARGO DOM/FES NOCTURNO
              row.getCell(21).value = { formula: `O${rowNumber}*${valHoraBase}*${(rates as any).RECARGO_DOM_NOCTURNO || 2.15}`, result: 0 };
              // =TOTAL $ (Suma de la fila)
              row.getCell(22).value = { formula: `SUM(P${rowNumber}:U${rowNumber})`, result: 0 };

              grandTotalHours += res.cantidadHoras;

              row.eachCell((cell, colNumber) => {
                cell.alignment = { horizontal: "center", vertical: "middle" };
                if (colNumber === 3 || colNumber >= 16) {
                  cell.numFmt = '"$"#,##0';
                } else if (colNumber >= 9 && colNumber <= 15) {
                  cell.numFmt = "0.00";
                }
              });
            });
          });

          const lastDataRow = worksheet.lastRow?.number || 1;
          const totalHoursRow = worksheet.addRow([]);
          totalHoursRow.getCell(8).value = "TOTAL HORAS";
          totalHoursRow.getCell(8).font = { bold: true };
          totalHoursRow.getCell(8).alignment = { horizontal: "right" };
          totalHoursRow.getCell(9).value = { formula: `SUM(I2:I${lastDataRow})` };
          totalHoursRow.getCell(9).font = { bold: true };
          totalHoursRow.getCell(9).numFmt = "0.00";
          for (let col = 10; col <= 15; col++) {
             const colLetter = String.fromCharCode(64 + col);
             totalHoursRow.getCell(col).value = { formula: `SUM(${colLetter}2:${colLetter}${lastDataRow})` };
             totalHoursRow.getCell(col).font = { bold: true };
             totalHoursRow.getCell(col).numFmt = "0.00";
          }

          const totalAmountRow = worksheet.addRow([]);
          totalAmountRow.getCell(8).value = "TOTAL $ HORAS";
          totalAmountRow.getCell(8).font = { bold: true };
          totalAmountRow.getCell(8).alignment = { horizontal: "right" };
          for (let col = 16; col <= 22; col++) {
             const colLetter = String.fromCharCode(64 + col); // 22 is V
             totalAmountRow.getCell(col).value = { formula: `SUM(${colLetter}2:${colLetter}${lastDataRow})` };
             totalAmountRow.getCell(col).font = { bold: true };
             totalAmountRow.getCell(col).numFmt = '"$"#,##0';
          }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Horas_Totales_Trabajadas_${format(new Date(), "yyyyMMdd")}.xlsx`);
      toast.success("Reporte horas totales generado");
    } catch (error) {
      console.error(error);
      toast.error("Error al generar reporte");
    }
  };

  const handleExportRealesPagadas = async () => {
    try {
      const approvedRecords = displayRecords.filter(r => r.estado === "aprobado");
      if (approvedRecords.length === 0) {
        toast.error("No hay registros aprobados para exportar");
        return;
      }

      const buckets: Record<string, number> = {};
      const getBucketKey = (email: string, date: Date) => {
        const q = date.getDate() <= 15 ? 1 : 2;
        return `${email}-${date.getFullYear()}-${date.getMonth()}-${q}`;
      };

      const workbook = new ExcelJS.Workbook();
      
      const recordsByEmployee = approvedRecords.reduce((acc, record) => {
          const name = record.empleado?.nombre || record.nombre || "Sin Nombre";
          const cedula = record.empleado?.cedula || record.cedula || "0";
          const key = `${name} - ${cedula}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(record);
          return acc;
      }, {} as Record<string, typeof approvedRecords>);

      for (const [employeeKey, empRecords] of Object.entries(recordsByEmployee)) {
          const shortName = employeeKey.substring(0, 31).replace(/[/*?:\[\]]/g, '');
          const ws = workbook.addWorksheet(shortName);

          ws.columns = [
            { header: "Cedula", key: "cedula", width: 12 },
            { header: "Nombre", key: "nombre", width: 25 },
            { header: "Salario", key: "salario", width: 15 },
            { header: "Fecha", key: "fecha", width: 12 },
            { header: "CENTRO DE COSTO", key: "ceco", width: 20 },
            { header: "Día Semana", key: "dia", width: 12 },
            { header: "Hora Inicio", key: "inicio", width: 12 },
            { header: "Hora Final", key: "final", width: 12 },
            { header: "Total Horas", key: "cantidad", width: 15 },
            { header: "HORAS EXTRAS DIURNAS", key: "he_diurna", width: 15 },
            { header: "HORAS EXTRAS NOCTURNAS", key: "he_nocturna", width: 15 },
            { header: "HORAS EXTRAS DOMINICAL DIURNAS", key: "he_dom_diurna", width: 15 },
            { header: "HORAS EXTRAS DOMINICAL NOCTURNAS", key: "he_dom_nocturna", width: 15 },
            { header: "RECARGO DOMINICAL DIURNO", key: "rec_dom_diurno", width: 15 },
            { header: "RECARGO DOMINICAL NOCTURNO", key: "rec_dom_nocturno", width: 15 },
            { header: "$ HORAS EXTRAS DIURNAS", key: "val_he_diurna", width: 15 },
            { header: "$ HORAS EXTRAS NOCTURNAS", key: "val_he_nocturna", width: 15 },
            { header: "$ HORAS EXTRAS DOMINICAL DIURNAS", key: "val_he_dom_diurna", width: 15 },
            { header: "$ HORAS EXTRAS DOMINICAL NOCTURNAS", key: "val_he_dom_nocturna", width: 15 },
            { header: "$ RECARGO DOM/FES DIURNO", key: "val_rec_dom_diurna", width: 15 },
            { header: "$ RECARGO DOM/FES NOCTURNO", key: "val_rec_dom_nocturno", width: 15 },
            { header: "TOTAL $", key: "total_dinero", width: 15 },
            { header: "Detalle Pago", key: "detalle_pago", width: 20 },
          ];

          const headerRow = ws.getRow(1);
          headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
          headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E7490" } };
          headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          headerRow.height = 45;

          const sortedRecords = [...empRecords].sort((a, b) => {
            const dateA = getRecordDate(a)?.getTime() || 0;
            const dateB = getRecordDate(b)?.getTime() || 0;
            return dateA - dateB;
          });

          sortedRecords.forEach(record => {
            const email = (record.empleado?.email || "").toLowerCase();
            const cedula = record.empleado?.cedula || record.cedula;
            const nombre = record.empleado?.nombre || record.nombre;
            const salario = toSafeNumber(record.salario ?? record.empleado?.salario);
            const config = horariosConfig || { diarnaStart: 6, diarnaEnd: 21, nocturnaStart: 21, nocturnaEnd: 6 };
            const rates = overtimeRates;

            record.dateEntries?.forEach((entry: any) => {
              const date = parseDateValue(entry.fecha);
              if (!date) return;
              const key = getBucketKey(email, date);
              if (buckets[key] === undefined) buckets[key] = 0;

              const res = calculateDetailedOvertime(entry.horaInicio, entry.horaFinal, entry.fecha, config, holidays as string[]);
              
              const isWeekday = date.getDay() >= 1 && date.getDay() <= 5;
              if (isWeekday) {
                // max 2 hrs entre 17:30 a 19:30
                const startLimit = 17.5 * 60;
                const endLimit = 19.5 * 60;
                const [sh, sm] = entry.horaInicio.split(":").map(Number);
                const [eh, em] = entry.horaFinal.split(":").map(Number);
                const startMin = sh * 60 + sm;
                const endMin = eh * 60 + em;
                const actualStart = Math.max(startMin, startLimit);
                const actualEnd = Math.min(endMin, endLimit);

                if (actualEnd > actualStart) {
                  const hoursInSlot = (actualEnd - actualStart) / 60;
                  const remainingCap = Math.max(0, 20 - buckets[key]);
                  const paidInSlot = Math.min(hoursInSlot, remainingCap);
                  const bonoInSlot = hoursInSlot - paidInSlot;

                  const addCalculatedRow = (hCount: number, detail: string) => {
                    let d = 0, n = 0;
                    for (let m = actualStart; m < actualStart + (hCount * 60); m += 1) {
                      const hr = m / 60;
                      if (hr >= config.diarnaStart && hr < config.diarnaEnd) d += 1/60;
                      else n += 1/60;
                    }
                    const row = ws.addRow({
                      cedula, nombre, salario,
                      fecha: format(date, "dd/MM/yyyy"), ceco: getCecoLabel(record.centroCosto), 
                      dia: getRecordDay({ ...record, fecha: entry.fecha, dateEntries: [] }),
                      inicio: entry.horaInicio, final: entry.horaFinal, cantidad: hCount,
                      he_diurna: d, he_nocturna: n,
                      he_dom_diurna: 0, he_dom_nocturna: 0,
                      rec_dom_diurno: 0, rec_dom_nocturno: 0,
                      detalle_pago: detail
                    });
                    const rowNum = row.number;
                    const baseVal = `C${rowNum}/220`;
                    row.getCell(16).value = { formula: `J${rowNum}*(${baseVal})*${rates.DIURNA}` };
                    row.getCell(17).value = { formula: `K${rowNum}*(${baseVal})*${rates.NOCTURNA}` };
                    row.getCell(18).value = { formula: `L${rowNum}*(${baseVal})*${rates.DOMINICAL_DIURNA}` };
                    row.getCell(19).value = { formula: `M${rowNum}*(${baseVal})*${rates.DOMINICAL_NOCTURNA}` };
                    row.getCell(20).value = { formula: `N${rowNum}*(${baseVal})*${(rates as any).RECARGO_DOM_DIURNO || 1.8}` };
                    row.getCell(21).value = { formula: `O${rowNum}*(${baseVal})*${(rates as any).RECARGO_DOM_NOCTURNO || 2.15}` };
                    row.getCell(22).value = { formula: `SUM(P${rowNum}:U${rowNum})` };
                    
                    row.getCell(23).value = detail;

                    [3, 16, 17, 18, 19, 20, 21, 22].forEach(col => { if(row.getCell(col)) row.getCell(col).numFmt = '"$"#,##0'; });
                    [9, 10, 11, 12, 13, 14, 15].forEach(col => { if(row.getCell(col)) row.getCell(col).numFmt = '0.00'; });
                  };

                  if (paidInSlot > 0) {
                    addCalculatedRow(paidInSlot, "Pagado (Regla Max 2h)");
                    buckets[key] += paidInSlot;
                  }
                  if (bonoInSlot > 0) {
                    addCalculatedRow(bonoInSlot, "Bono (Excede 20h quincenales)"); // En Bono
                  }
                }
              } else {
                // Fines de semana o festivos
                const addDomRow = (rD: number, rN: number, eD: number, eN: number, detail: string) => {
                  const row = ws.addRow({
                    cedula, nombre, salario,
                    fecha: format(date, "dd/MM/yyyy"), ceco: getCecoLabel(record.centroCosto),
                    dia: getRecordDay({ ...record, fecha: entry.fecha, dateEntries: [] }),
                    inicio: entry.horaInicio, final: entry.horaFinal,
                    cantidad: rD + rN + eD + eN,
                    he_diurna: 0, he_nocturna: 0,
                    rec_dom_diurno: rD, rec_dom_nocturno: rN,
                    he_dom_diurna: eD, he_dom_nocturna: eN,
                    detalle_pago: detail
                  });
                  const rowNum = row.number;
                  const baseVal = `C${rowNum}/220`;

                  row.getCell(16).value = { formula: `J${rowNum}*(${baseVal})*${rates.DIURNA}` };
                  row.getCell(17).value = { formula: `K${rowNum}*(${baseVal})*${rates.NOCTURNA}` };
                  row.getCell(18).value = { formula: `L${rowNum}*(${baseVal})*${rates.DOMINICAL_DIURNA}` };
                  row.getCell(19).value = { formula: `M${rowNum}*(${baseVal})*${rates.DOMINICAL_NOCTURNA}` };
                  row.getCell(20).value = { formula: `N${rowNum}*(${baseVal})*${(rates as any).RECARGO_DOM_DIURNO || 1.8}` };
                  row.getCell(21).value = { formula: `O${rowNum}*(${baseVal})*${(rates as any).RECARGO_DOM_NOCTURNO || 2.15}` };
                  row.getCell(22).value = { formula: `SUM(P${rowNum}:U${rowNum})` };

                  row.getCell(23).value = detail;

                  [3, 16, 17, 18, 19, 20, 21, 22].forEach(col => { if(row.getCell(col)) row.getCell(col).numFmt = '"$"#,##0'; });
                  [9, 10, 11, 12, 13, 14, 15].forEach(col => { if(row.getCell(col)) row.getCell(col).numFmt = '0.00'; });
                };

                // domingos primeras 8h a recargo dom (si aplicó validación DOMINICAL), resto a HE dominical
                if (res.recargoDominicalDiurno > 0 || res.recargoDominicalNocturno > 0) {
                  addDomRow(res.recargoDominicalDiurno, res.recargoDominicalNocturno, 0, 0, "Recargo Dom/Fes Pagadas");
                }
                if (res.extraDominicalDiurna > 0 || res.extraDominicalNocturna > 0) {
                  addDomRow(0, 0, res.extraDominicalDiurna, res.extraDominicalNocturna, "Extra Dom/Fes (En Bono)");
                }
              }
            });
          });

          const lastDataRow = ws.lastRow?.number || 1;
          const totalHoursRow = ws.addRow([]);
          totalHoursRow.getCell(8).value = "TOTAL HORAS";
          totalHoursRow.getCell(8).font = { bold: true };
          totalHoursRow.getCell(8).alignment = { horizontal: "right" };
          totalHoursRow.getCell(9).value = { formula: `SUM(I2:I${lastDataRow})` };
          totalHoursRow.getCell(9).font = { bold: true };
          totalHoursRow.getCell(9).numFmt = "0.00";
          for (let col = 10; col <= 15; col++) {
             const colLetter = String.fromCharCode(64 + col);
             totalHoursRow.getCell(col).value = { formula: `SUM(${colLetter}2:${colLetter}${lastDataRow})` };
             totalHoursRow.getCell(col).font = { bold: true };
             totalHoursRow.getCell(col).numFmt = "0.00";
          }

          const totalAmountRow = ws.addRow([]);
          totalAmountRow.getCell(8).value = "TOTAL $ HORAS";
          totalAmountRow.getCell(8).font = { bold: true };
          totalAmountRow.getCell(8).alignment = { horizontal: "right" };
          for (let col = 16; col <= 22; col++) {
             const colLetter = String.fromCharCode(64 + col);
             totalAmountRow.getCell(col).value = { formula: `SUM(${colLetter}2:${colLetter}${lastDataRow})` };
             totalAmountRow.getCell(col).font = { bold: true };
             totalAmountRow.getCell(col).numFmt = '"$"#,##0';
          }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Horas_Reales_Pagadas_${format(new Date(), "yyyyMMdd")}.xlsx`);
      toast.success("Archivo de pago generado exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al generar reporte de pagadas");
    }
  };

  return {
    handleExportRealesTrabajadas,
    handleExportRealesPagadas
  };
};
