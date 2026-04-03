import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined) {
  const n = Number(value) || 0;
  return `$ ${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}
