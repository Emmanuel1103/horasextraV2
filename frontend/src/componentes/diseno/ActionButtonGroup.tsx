import { ReactNode } from "react";

interface ActionButtonGroupProps {
  /** Elementos de botones a renderizar */
  children: ReactNode;
  /** Espacio entre botones (por defecto '0.75rem') */
  gap?: string;
  /** Alineación horizontal (por defecto 'flex-end') */
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between';
  /** Alineación vertical (por defecto 'center') */
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
}

/**
 * Componente contenedor reutilizable para grupos de botones de acción
 * 
 * @example
 * ```tsx
 * <ActionButtonGroup gap="1rem" justify="flex-end">
 *   <Button variant="outline">Cancelar</Button>
 *   <Button>Guardar</Button>
 * </ActionButtonGroup>
 * ```
 */
export const ActionButtonGroup = ({
  children,
  gap = "0.75rem",
  justify = "flex-end",
  align = "center"
}: ActionButtonGroupProps) => {
  return (
    <div
      style={{
        display: "flex",
        gap,
        justifyContent: justify,
        alignItems: align,
      }}
    >
      {children}
    </div>
  );
};
