import { ReactNode } from "react";

interface PageContainerProps {
  /** Contenido de la página */
  children: ReactNode;
  /** Padding personalizado (por defecto '1.5rem 2rem') */
  padding?: string;
  /** Ancho máximo del contenedor */
  maxWidth?: string;
  /** Centrar el contenido horizontalmente */
  centered?: boolean;
}

/**
 * Componente contenedor reutilizable para páginas y pestañas
 * Proporciona padding y estructura consistente
 * 
 * @example
 * ```tsx
 * <PageContainer padding="2rem">
 *   <h1>Mi Página</h1>
 *   <p>Contenido...</p>
 * </PageContainer>
 * ```
 */
export const PageContainer = ({
  children,
  padding = "1.5rem 2rem",
  maxWidth,
  centered = false
}: PageContainerProps) => {
  return (
    <div
      style={{
        padding,
        maxWidth,
        margin: centered ? "0 auto" : undefined,
      }}
    >
      {children}
    </div>
  );
};
