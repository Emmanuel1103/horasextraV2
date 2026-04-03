import { ReactNode } from "react";

interface SectionHeaderProps {
  /** Título principal de la sección */
  title: string;
  /** Descripción o subtítulo opcional */
  description?: string;
  /** Acciones adicionales para mostrar a la derecha del título */
  actions?: ReactNode;
  /** Margen inferior personalizado (por defecto '1.5rem') */
  marginBottom?: string;
  /** Tamaño del título (por defecto 'large') */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Componente reutilizable para encabezados de sección
 * 
 * @example
 * ```tsx
 * <SectionHeader 
 *   title="Estadísticas de ventas"
 *   description="Resumen del período actual"
 *   actions={<Button>Exportar</Button>}
 * />
 * ```
 */
export const SectionHeader = ({
  title,
  description,
  actions,
  marginBottom = "1.5rem",
  size = "large"
}: SectionHeaderProps) => {
  const titleSizes = {
    small: "1.125rem",
    medium: "1.25rem",
    large: "1.5rem"
  };

  const descriptionSizes = {
    small: "0.75rem",
    medium: "0.8125rem",
    large: "0.875rem"
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: actions ? "center" : "flex-start",
        marginBottom,
      }}
    >
      <div>
        <h2
          style={{
            fontSize: titleSizes[size],
            fontWeight: "600",
            color: "#1f2937",
            marginBottom: description ? "0.5rem" : "0",
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              fontSize: descriptionSizes[size],
              color: "#6b7280",
            }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
};
