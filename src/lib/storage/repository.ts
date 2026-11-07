import { parseISODate } from "@/lib/domain/dates";
import { isKnownRecipe } from "@/lib/domain/recipes";
import { MEAL_SLOTS } from "@/lib/domain/constants";
import type {
  ActivityEntry,
  AppState,
  Category,
  DataSource,
  Location,
  Meal,
  MealSlot,
  MenuPlan,
  Product,
  ReminderDismissal,
  Unit,
} from "@/lib/domain/types";

export const STORAGE_KEY = "freshloop.state.v1";
const CORRUPT_KEY = "freshloop.state.corrupt";

export type SaveResult =
  | { ok: true }
  | { ok: false; message: string };

export interface LoadResult {
  state: AppState | null;
  storageAvailable: boolean;
  error: string | null;
}

const CATEGORY_VALUES: readonly Category[] = [
  "vegetables",
  "fruits",
  "dairy",
  "meat",
  "fish",
  "grains",
  "bakery",
  "other",
];
const UNIT_VALUES: readonly Unit[] = ["шт", "г", "кг", "мл", "л", "уп"];
const LOCATION_VALUES: readonly Location[] = ["fridge", "freezer", "pantry"];
const SLOT_VALUES: readonly MealSlot[] = MEAL_SLOTS.map((slot) => slot.value);

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const storage = window.localStorage;
    const probe = "__freshloop_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIso(value: unknown): value is string {
  return typeof value === "string" && parseISODate(value) !== null;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function isSource(value: unknown): value is DataSource {
  return value === "demo" || value === "user";
}

function sanitizeProduct(value: unknown): Product | null {
  if (!isRecord(value)) return null;
  const { id, name, category, quantity, unit, expiresAt, location, createdAt } = value;

  if (typeof id !== "string" || id.length === 0) return null;
  if (typeof name !== "string" || name.trim().length === 0) return null;
  if (!CATEGORY_VALUES.includes(category as Category)) return null;
  if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }
  if (!UNIT_VALUES.includes(unit as Unit)) return null;
  if (!isIso(expiresAt)) return null;
  if (!LOCATION_VALUES.includes(location as Location)) return null;
  if (!isTimestamp(createdAt)) return null;

  return {
    id,
    name: name.trim().slice(0, 60),
    category: category as Category,
    quantity,
    unit: unit as Unit,
    expiresAt,
    purchasedAt: isIso(value.purchasedAt) ? value.purchasedAt : undefined,
    location: location as Location,
    note:
      typeof value.note === "string" ? value.note.slice(0, 160) : undefined,
    createdAt,
    source: isSource(value.source) ? value.source : "user",
  };
}

function sanitizeMeal(value: unknown): Meal | null {
  if (!isRecord(value)) return null;
  const { id, date, slot, recipeId, variant } = value;

  if (typeof id !== "string" || id.length === 0) return null;
  if (!isIso(date)) return null;
  if (!SLOT_VALUES.includes(slot as MealSlot)) return null;
  if (typeof recipeId !== "string" || !isKnownRecipe(recipeId)) return null;
  if (typeof variant !== "number" || !Number.isFinite(variant)) return null;

  return {
    id,
    date,
    slot: slot as MealSlot,
    recipeId,
    variant: Math.max(0, Math.round(variant)),
    cookedAt: isTimestamp(value.cookedAt) ? value.cookedAt : undefined,
    cookedProductLabels: Array.isArray(value.cookedProductLabels)
      ? value.cookedProductLabels.filter(
          (item): item is string => typeof item === "string",
        )
      : undefined,
  };
}

function sanitizeMenu(value: unknown): MenuPlan | null {
  if (!isRecord(value)) return null;
  const { id, startDate, days, createdAt, meals } = value;

  if (typeof id !== "string" || id.length === 0) return null;
  if (!isIso(startDate)) return null;
  if (typeof days !== "number" || !Number.isFinite(days) || days < 1 || days > 14) {
    return null;
  }
  if (!isTimestamp(createdAt)) return null;
  if (!Array.isArray(meals)) return null;

  const cleanMeals = meals
    .map(sanitizeMeal)
    .filter((meal): meal is Meal => meal !== null);
  if (cleanMeals.length === 0) return null;

  return {
    id,
    startDate,
    days: Math.round(days),
    createdAt,
    source: isSource(value.source) ? value.source : "user",
    meals: cleanMeals,
  };
}

function sanitizeActivity(value: unknown): ActivityEntry | null {
  if (!isRecord(value)) return null;
  const { id, kind, productName, category, quantity, unit, at, estimate } = value;

  if (typeof id !== "string" || id.length === 0) return null;
  if (kind !== "used" && kind !== "cooked" && kind !== "discarded") return null;
  if (typeof productName !== "string" || productName.length === 0) return null;
  if (!CATEGORY_VALUES.includes(category as Category)) return null;
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) return null;
  if (!UNIT_VALUES.includes(unit as Unit)) return null;
  if (!isTimestamp(at)) return null;
  if (typeof estimate !== "number" || !Number.isFinite(estimate)) return null;

  return {
    id,
    kind,
    productName,
    category: category as Category,
    quantity,
    unit: unit as Unit,
    at,
    estimate: Math.max(0, estimate),
    source: isSource(value.source) ? value.source : "user",
  };
}

function sanitizeDismissal(value: unknown): ReminderDismissal | null {
  if (!isRecord(value)) return null;
  const { key, productId, productName, expiresAt, dismissedAt } = value;

  if (typeof key !== "string" || key.length === 0) return null;
  if (typeof productId !== "string" || productId.length === 0) return null;
  if (typeof productName !== "string") return null;
  if (!isIso(expiresAt)) return null;
  if (!isTimestamp(dismissedAt)) return null;

  return { key, productId, productName, expiresAt, dismissedAt };
}

/** Приводит произвольный JSON к безопасному AppState. */
export function sanitizeState(value: unknown): AppState | null {
  if (!isRecord(value) || value.version !== 1) return null;
  if (!Array.isArray(value.products)) return null;

  const products = value.products
    .map(sanitizeProduct)
    .filter((product): product is Product => product !== null);

  const warningDaysRaw = isRecord(value.settings)
    ? value.settings.warningDays
    : 3;
  const warningDays =
    typeof warningDaysRaw === "number" && Number.isFinite(warningDaysRaw)
      ? Math.min(7, Math.max(1, Math.round(warningDaysRaw)))
      : 3;

  return {
    version: 1,
    products,
    menu: sanitizeMenu(value.menu),
    activity: Array.isArray(value.activity)
      ? value.activity
          .map(sanitizeActivity)
          .filter((entry): entry is ActivityEntry => entry !== null)
      : [],
    dismissals: Array.isArray(value.dismissals)
      ? value.dismissals
          .map(sanitizeDismissal)
          .filter((entry): entry is ReminderDismissal => entry !== null)
      : [],
    settings: { warningDays },
  };
}

export function loadState(): LoadResult {
  const storage = getStorage();
  if (!storage) {
    return {
      state: null,
      storageAvailable: false,
      error: "Браузер не разрешает локальное хранилище — изменения не сохранятся.",
    };
  }

  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      state: null,
      storageAvailable: false,
      error: "Не удалось прочитать локальное хранилище.",
    };
  }

  if (!raw) return { state: null, storageAvailable: true, error: null };

  try {
    const parsed: unknown = JSON.parse(raw);
    const state = sanitizeState(parsed);
    if (!state) {
      storage.setItem(CORRUPT_KEY, raw);
      return {
        state: null,
        storageAvailable: true,
        error: "Сохранённые данные повреждены. Мы начали с демо-набора.",
      };
    }
    return { state, storageAvailable: true, error: null };
  } catch {
    try {
      storage.setItem(CORRUPT_KEY, raw);
    } catch {
      // Резервная копия не критична.
    }
    return {
      state: null,
      storageAvailable: true,
      error: "Сохранённые данные повреждены. Мы начали с демо-набора.",
    };
  }
}

export function saveState(state: AppState): SaveResult {
  const storage = getStorage();
  if (!storage) {
    return { ok: false, message: "Локальное хранилище недоступно — изменения не сохранятся." };
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Не удалось сохранить данные: возможно, закончилось место в хранилище.",
    };
  }
}
