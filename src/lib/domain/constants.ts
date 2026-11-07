import type { Category, Location, MealSlot, Unit } from "./types";

export const CATEGORIES: ReadonlyArray<{ value: Category; label: string }> = [
  { value: "vegetables", label: "Овощи" },
  { value: "fruits", label: "Фрукты и ягоды" },
  { value: "dairy", label: "Молочное и яйца" },
  { value: "meat", label: "Мясо и птица" },
  { value: "fish", label: "Рыба" },
  { value: "grains", label: "Крупы и макароны" },
  { value: "bakery", label: "Хлеб и выпечка" },
  { value: "other", label: "Другое" },
];

export const CATEGORY_LABELS: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((item) => [item.value, item.label]),
) as Record<Category, string>;

/** Приглушённые цвета для точек категорий — без «светящихся» акцентов. */
export const CATEGORY_DOTS: Record<Category, string> = {
  vegetables: "#5f7f4e",
  fruits: "#b0603a",
  dairy: "#b8923c",
  meat: "#a45858",
  fish: "#5b7c86",
  grains: "#a88b5a",
  bakery: "#8f6a43",
  other: "#7d8578",
};

export const LOCATIONS: ReadonlyArray<{ value: Location; label: string }> = [
  { value: "fridge", label: "Холодильник" },
  { value: "freezer", label: "Морозилка" },
  { value: "pantry", label: "Кладовая" },
];

export const LOCATION_LABELS: Record<Location, string> = {
  fridge: "Холодильник",
  freezer: "Морозилка",
  pantry: "Кладовая",
};

export const UNITS: readonly Unit[] = ["шт", "г", "кг", "мл", "л", "уп"];

export const MEAL_SLOTS: ReadonlyArray<{ value: MealSlot; label: string }> = [
  { value: "breakfast", label: "Завтрак" },
  { value: "lunch", label: "Обед" },
  { value: "dinner", label: "Ужин" },
];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
};

export const WARNING_DAY_OPTIONS: readonly number[] = [1, 2, 3, 4, 5, 6, 7];

export const PLAN_PERIODS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1, label: "Сегодня" },
  { value: 3, label: "3 дня" },
  { value: 7, label: "Неделя" },
];

export interface CommonProduct {
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  location: Location;
  shelfLifeDays: number;
}

/** Быстрые кнопки в форме добавления. */
export const COMMON_PRODUCTS: readonly CommonProduct[] = [
  { name: "Яйца", category: "dairy", quantity: 10, unit: "шт", location: "fridge", shelfLifeDays: 14 },
  { name: "Молоко", category: "dairy", quantity: 1, unit: "л", location: "fridge", shelfLifeDays: 5 },
  { name: "Помидоры", category: "vegetables", quantity: 4, unit: "шт", location: "fridge", shelfLifeDays: 5 },
  { name: "Куриное филе", category: "meat", quantity: 400, unit: "г", location: "fridge", shelfLifeDays: 3 },
  { name: "Хлеб", category: "bakery", quantity: 1, unit: "шт", location: "pantry", shelfLifeDays: 3 },
  { name: "Сыр", category: "dairy", quantity: 150, unit: "г", location: "fridge", shelfLifeDays: 10 },
];
