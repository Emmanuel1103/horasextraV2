import { reconcileApproversByCeco, transitionState } from "./requestWorkflow";
import { describe, expect, it } from "@jest/globals";

describe("requestWorkflow.transitionState", () => {
  it("permite transicion de pendiente a en_revision", () => {
    expect(transitionState("pendiente", "REQUEST_REVIEW")).toBe("en_revision");
  });

  it("rechaza transiciones invalidas", () => {
    expect(() => transitionState("aprobado", "REJECT")).toThrow(/Transicion no permitida/i);
  });
});

describe("requestWorkflow.reconcileApproversByCeco", () => {
  it("preserva token existente y detecta removidos", () => {
    const result = reconcileApproversByCeco({
      existingApprovers: [
        {
          email: "jefe@empresa.com",
          name: "Jefe",
          estado: "aprobado",
          token: "tok-01",
          centrosCosto: ["100"],
          fechaAprobacion: "2026-01-01T00:00:00.000Z",
        },
        {
          email: "jefe2@empresa.com",
          name: "Jefe 2",
          estado: "pendiente",
          token: "tok-02",
          centrosCosto: ["200"],
        },
      ],
      targetCecos: ["100"],
      unidades: [
        {
          id: "u1",
          nombre: "Unidad 1",
          director: { id: "d1", nombre: "Jefe", email: "jefe@empresa.com" },
          centrosCosto: [{ id: "c1", numero: "100", nombre: "CC 100" }],
        },
      ],
    });

    expect(result.approvers).toHaveLength(1);
    expect(result.approvers[0].token).toBe("tok-01");
    expect(result.approvers[0].estado).toBe("pendiente");
    expect(result.removed).toEqual([{ email: "jefe2@empresa.com", ceco: "200" }]);
  });

  it("usa fallback con aprobadores existentes cuando no hay unidades", () => {
    const result = reconcileApproversByCeco({
      existingApprovers: [
        {
          email: "jefe@empresa.com",
          name: "Jefe",
          estado: "en_revision",
          token: "tok-01",
          centrosCosto: ["300"],
          motivoRevision: "Ajustar porcentaje",
        },
      ],
      targetCecos: ["300"],
      unidades: [],
    });

    expect(result.approvers).toHaveLength(1);
    expect(result.approvers[0].estado).toBe("pendiente");
    expect(result.approvers[0].motivoRevision).toBeUndefined();
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
  });
});
