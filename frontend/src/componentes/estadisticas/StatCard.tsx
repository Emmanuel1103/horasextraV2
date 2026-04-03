import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export interface StatCardData {
  /** Título descriptivo de la métrica */
  label: string;
  /** Valor a mostrar (puede ser número, string o ReactNode para formato personalizado) */
  value: string | number | ReactNode;
  /** Icono de Lucide React */
  icon?: LucideIcon;
  /** Color del texto del valor (opcional, por defecto '#51CB75') */
  valueColor?: string;
  /** Clase de color para el fondo del icono (ej: 'bg-primary/10') */
  iconBgColor?: string;
  /** Clase de color para el icono (ej: 'text-primary') */
  iconColor?: string;
  /** Función de formato personalizada para el valor */
  formatValue?: (value: any) => string | ReactNode;
}

interface StatCardProps {
  /** Datos de la tarjeta individual */
  data: StatCardData;
}

/**
 * Componente de tarjeta de estadística individual reutilizable
 * 
 * @example
 * ```tsx
 * <StatCard 
 *   data={{
 *     label: "Total usuarios",
 *     value: 150,
 *     icon: Users,
 *     iconBgColor: "bg-blue-100",
 *     iconColor: "text-blue-600"
 *   }}
 * />
 * ```
 */
export const StatCard = ({ data }: StatCardProps) => {
  const {
    label,
    value,
    icon: Icon,
    valueColor = '#51CB75',
    iconBgColor = 'bg-primary/10',
    iconColor = 'text-primary',
    formatValue
  } = data;

  const displayValue = formatValue ? formatValue(value) : value;
  const hasIcon = Boolean(Icon);

  return (
    <Card className="border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-4xl font-bold leading-none" style={{ color: valueColor }}>
              {displayValue}
            </p>
          </div>
          {hasIcon && (
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${iconBgColor}`}>
              <Icon className={`h-7 w-7 ${iconColor}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface StatCardsGridProps {
  /** Array de datos para las tarjetas */
  cards: StatCardData[];
  /** Número de columnas en pantallas grandes (por defecto 4) */
  columns?: 2 | 3 | 4 | 5 | 6;
}

/**
 * Componente grid contenedor para múltiples tarjetas de estadísticas
 * 
 * @example
 * ```tsx
 * <StatCardsGrid 
 *   cards={[
 *     { label: "Total", value: 100, icon: Users },
 *     { label: "Activos", value: 75, icon: CheckCircle }
 *   ]}
 *   columns={4}
 * />
 * ```
 */
export const StatCardsGrid = ({ cards, columns = 4 }: StatCardsGridProps) => {
  const gridColsClass = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  }[columns];

  return (
    <div className={`mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 ${gridColsClass}`}>
      {cards.map((card, index) => (
        <StatCard key={`${card.label}-${index}`} data={card} />
      ))}
    </div>
  );
};
