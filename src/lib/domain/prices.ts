import type { Category } from "./types";

/**
 * Демо-прайс для оценки предотвращённых отходов.
 * Это не реальные закупочные цены, поэтому в UI значение подписано как демо-оценка.
 */
export const CATEGORY_PRICE_ESTIMATE: Record<Category, number> = {
  vegetables: 90,
  fruits: 130,
  dairy: 150,
  meat: 380,
  fish: 420,
  grains: 110,
  bakery: 70,
  other: 160,
};

export function estimateProductValue(category: Category): number {
  return CATEGORY_PRICE_ESTIMATE[category];
}
