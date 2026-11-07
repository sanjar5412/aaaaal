export type Category =
  | "vegetables"
  | "fruits"
  | "dairy"
  | "meat"
  | "fish"
  | "grains"
  | "bakery"
  | "other";

export type Location = "fridge" | "freezer" | "pantry";

export type Unit = "шт" | "г" | "кг" | "мл" | "л" | "уп";

/** Статус вычисляется из даты, а не хранится в данных. */
export type ProductStatus = "fresh" | "soon" | "expired";

export type DataSource = "demo" | "user";

export interface Product {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  /** Дата по ISO: YYYY-MM-DD */
  expiresAt: string;
  purchasedAt?: string;
  location: Location;
  note?: string;
  createdAt: string;
  source: DataSource;
}

export type MealSlot = "breakfast" | "lunch" | "dinner";

export interface Meal {
  id: string;
  /** Дата по ISO: YYYY-MM-DD */
  date: string;
  slot: MealSlot;
  recipeId: string;
  /** Счётчик замен, чтобы «Заменить» предлагало другой вариант. */
  variant: number;
  cookedAt?: string;
  cookedProductLabels?: string[];
}

export interface MenuPlan {
  id: string;
  startDate: string;
  days: number;
  createdAt: string;
  source: DataSource;
  meals: Meal[];
}

export type ActivityKind = "used" | "cooked" | "discarded";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  productName: string;
  category: Category;
  quantity: number;
  unit: Unit;
  at: string;
  /** Демо-оценка стоимости продукта в рублях. */
  estimate: number;
  source: DataSource;
}

export interface ReminderDismissal {
  /** productId + expiresAt — новый срок снова включает напоминание. */
  key: string;
  productId: string;
  productName: string;
  expiresAt: string;
  dismissedAt: string;
}

export interface Settings {
  warningDays: number;
}

export interface AppState {
  version: 1;
  products: Product[];
  menu: MenuPlan | null;
  activity: ActivityEntry[];
  dismissals: ReminderDismissal[];
  settings: Settings;
}
