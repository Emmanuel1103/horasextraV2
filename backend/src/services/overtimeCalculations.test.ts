import { calculateOvertimeHours, calculateOvertimeValue } from "./overtimeCalculations";

test("calculate hours basic diurna", () => {
  const r = calculateOvertimeHours("18:00", "20:00", 1);
  expect(r.cantidadHoras).toBe(2);
  expect(r.horasExtraDiurna).toBeGreaterThan(0);
});

test("calculate value with salary", () => {
  const val = calculateOvertimeValue(2200000, 2, 0, 0);
  expect(val).toBeGreaterThan(0);
});
