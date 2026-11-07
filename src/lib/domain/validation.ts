import { parseISODate, todayISO } from "./dates";
import type { Category, Location, Unit } from "./types";
import { CATEGORIES, LOCATIONS, UNITS } from "./constants";

export interface ProductFormValues {
  name: string;
  category: Category;
  quantity: string;
  unit: Unit;
  expiresAt: string;
  purchasedAt: string;
  location: Location;
  note: string;
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

export interface ParsedQuantity {
  value: number;
  error?: string;
}

export function parseQuantity(raw: string): ParsedQuantity {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return { value: Number.NaN, error: "Укажите количество" };

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return { value: Number.NaN, error: "Количество должно быть числом" };
  }
  if (value <= 0) return { value, error: "Количество должно быть больше нуля" };
  if (value > 10_000) return { value, error: "Слишком большое количество" };
  return { value };
}

export function validateProductForm(
  values: ProductFormValues,
  today: string = todayISO(),
): ProductFormErrors {
  const errors: ProductFormErrors = {};

  const name = values.name.trim();
  if (name.length < 2) {
    errors.name = "Введите название — минимум 2 символа";
  } else if (name.length > 60) {
    errors.name = "Название не длиннее 60 символов";
  }

  if (!CATEGORIES.some((item) => item.value === values.category)) {
    errors.category = "Выберите категорию";
  }
  if (!LOCATIONS.some((item) => item.value === values.location)) {
    errors.location = "Выберите место хранения";
  }
  if (!UNITS.includes(values.unit)) {
    errors.unit = "Выберите единицу измерения";
  }

  const quantity = parseQuantity(values.quantity);
  if (quantity.error) errors.quantity = quantity.error;

  const expiresAt = parseISODate(values.expiresAt);
  if (!expiresAt) {
    errors.expiresAt = "Укажите срок годности";
  }

  if (values.purchasedAt) {
    const purchasedAt = parseISODate(values.purchasedAt);
    if (!purchasedAt) {
      errors.purchasedAt = "Некорректная дата покупки";
    } else if (values.purchasedAt > today) {
      errors.purchasedAt = "Дата покупки не может быть в будущем";
    } else if (expiresAt && values.expiresAt < values.purchasedAt) {
      errors.expiresAt = "Срок годности не может быть раньше даты покупки";
    }
  }

  if (values.note.length > 160) {
    errors.note = "Заметка не длиннее 160 символов";
  }

  return errors;
}

export function hasErrors(errors: ProductFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
