import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const POSITION_ORDER: Record<string, number> = {
  QB: 0, RB: 1, WR: 2, TE: 3, FLEX: 4, K: 5, DEF: 6, BENCH: 7, TAXI: 8, IR: 9,
};

export function positionSortKey(pos: string): number {
  return POSITION_ORDER[pos] ?? 99;
}

export function getPositionColor(position: string): string {
  const colors: Record<string, string> = {
    QB: "text-accent-purple",
    RB: "text-accent-green",
    WR: "text-brand-light",
    TE: "text-accent-yellow",
    K: "text-gray-400",
    DEF: "text-gray-400",
    FLEX: "text-gray-300",
    BENCH: "text-gray-500",
    TAXI: "text-orange-400",
    IR: "text-accent-red",
  };
  return colors[position] ?? "text-gray-400";
}

export function getPositionBadgeClass(position: string): string {
  const classes: Record<string, string> = {
    QB: "bg-purple-900/50 text-purple-300 border border-purple-700",
    RB: "bg-green-900/50 text-green-300 border border-green-700",
    WR: "bg-blue-900/50 text-blue-300 border border-blue-700",
    TE: "bg-yellow-900/50 text-yellow-300 border border-yellow-700",
    K: "bg-gray-800 text-gray-400 border border-gray-700",
    DEF: "bg-gray-800 text-gray-400 border border-gray-700",
    FLEX: "bg-gray-700 text-gray-300 border border-gray-600",
    BENCH: "bg-gray-900 text-gray-500 border border-gray-800",
    TAXI: "bg-orange-900/50 text-orange-300 border border-orange-700",
    IR: "bg-red-900/50 text-red-300 border border-red-700",
  };
  return classes[position] ?? "bg-gray-800 text-gray-400";
}
