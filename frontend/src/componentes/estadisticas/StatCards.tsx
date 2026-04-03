import { Clock, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StatCardsGrid, StatCardData } from "./StatCard";

interface StatCardsProps {
  totalRecords: number;
  totalHours: number;
  totalAmount: number;
}

/**
 * Componente especializado de tarjetas de estadísticas para horas extras
 * Utiliza el componente base StatCardsGrid con configuración específica
 */
export const StatCards = ({ 
  totalRecords, 
  totalHours, 
  totalAmount
}: StatCardsProps) => {
  // Configuración de las tarjetas con datos dinámicos
  const cardsData: StatCardData[] = [
    {
      label: "Total registros",
      value: totalRecords,
      icon: Users,
      iconBgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Horas totales",
      value: (totalHours ?? 0).toFixed(1),
      icon: Clock,
      iconBgColor: "bg-accent/10",
      iconColor: "text-accent",
    },
    {
      label: "Valor total",
      value: formatCurrency(totalAmount),
      iconBgColor: "bg-success/10",
      iconColor: "text-success",
    },
  ];

  return <StatCardsGrid cards={cardsData} columns={3} />;
};
