import type { Unit } from "./types";

/** 1.5 → «1,5 кг»; лишние нули убираются. */
export function formatQuantity(value: number, unit: Unit): string {
  const rounded = Math.round(value * 100) / 100;
  return `${String(rounded).replace(".", ",")} ${unit}`;
}

const moneyFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

export function formatMoney(value: number): string {
  return `${moneyFormatter.format(Math.round(value))} ₽`;
}
