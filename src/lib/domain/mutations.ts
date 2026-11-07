import { makeId } from "@/lib/id";
import { daysUntil, todayISO } from "./dates";
import { pickAlternativeRecipe } from "./menu";
import { estimateProductValue } from "./prices";
import type { Reminder } from "./reminders";
import type {
  ActivityEntry,
  AppState,
  Category,
  DataSource,
  Location,
  Meal,
  Product,
  Unit,
} from "./types";

export interface ProductInput {
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  expiresAt: string;
  purchasedAt?: string;
  location: Location;
  note?: string;
}

export interface Deduction {
  productId: string;
  quantity: number;
}

function withoutProductDismissals(state: AppState, productId: string): AppState["dismissals"] {
  return state.dismissals.filter((item) => item.productId !== productId);
}

export function createProduct(
  input: ProductInput,
  source: DataSource = "user",
): Product {
  return {
    id: makeId("product"),
    name: input.name.trim(),
    category: input.category,
    quantity: Math.round(input.quantity * 1000) / 1000,
    unit: input.unit,
    expiresAt: input.expiresAt,
    purchasedAt: input.purchasedAt || undefined,
    location: input.location,
    note: input.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
    source,
  };
}

export function addProduct(state: AppState, input: ProductInput): AppState {
  return { ...state, products: [createProduct(input), ...state.products] };
}

export function updateProduct(
  state: AppState,
  id: string,
  input: ProductInput,
): AppState {
  return {
    ...state,
    products: state.products.map((product) =>
      product.id === id
        ? {
            ...product,
            name: input.name.trim(),
            category: input.category,
            quantity: Math.round(input.quantity * 1000) / 1000,
            unit: input.unit,
            expiresAt: input.expiresAt,
            purchasedAt: input.purchasedAt || undefined,
            location: input.location,
            note: input.note?.trim() || undefined,
          }
        : product,
    ),
    dismissals: state.dismissals.filter((item) => item.productId !== id),
  };
}

/** Удаление без записи в активность: это не «спасённый» продукт. */
export function removeProduct(state: AppState, id: string): AppState {
  return {
    ...state,
    products: state.products.filter((product) => product.id !== id),
    dismissals: withoutProductDismissals(state, id),
  };
}

/** Отметка «использовано». Просроченный продукт списывается без экономии. */
export function markProductUsed(
  state: AppState,
  id: string,
  today: string = todayISO(),
): AppState {
  const product = state.products.find((item) => item.id === id);
  if (!product) return state;

  const expired = daysUntil(product.expiresAt, today) < 0;
  const entry: ActivityEntry = {
    id: makeId("activity"),
    kind: expired ? "discarded" : "used",
    productName: product.name,
    category: product.category,
    quantity: product.quantity,
    unit: product.unit,
    at: new Date().toISOString(),
    estimate: expired ? 0 : estimateProductValue(product.category),
    source: product.source,
  };

  return {
    ...state,
    products: state.products.filter((item) => item.id !== id),
    dismissals: withoutProductDismissals(state, id),
    activity: [entry, ...state.activity],
  };
}

export function dismissReminder(
  state: AppState,
  reminder: Reminder,
): AppState {
  if (state.dismissals.some((item) => item.key === reminder.key)) return state;

  return {
    ...state,
    dismissals: [
      {
        key: reminder.key,
        productId: reminder.product.id,
        productName: reminder.product.name,
        expiresAt: reminder.product.expiresAt,
        dismissedAt: new Date().toISOString(),
      },
      ...state.dismissals,
    ],
  };
}

export function restoreReminder(state: AppState, key: string): AppState {
  return {
    ...state,
    dismissals: state.dismissals.filter((item) => item.key !== key),
  };
}

export function setWarningDays(state: AppState, days: number): AppState {
  const warningDays = Math.min(7, Math.max(1, Math.round(days)));
  return { ...state, settings: { ...state.settings, warningDays } };
}

export function setMenu(state: AppState, menu: AppState["menu"]): AppState {
  return { ...state, menu };
}

/** Замена блюда на следующий подходящий рецепт того же приёма пищи. */
export function swapMealInPlan(state: AppState, mealId: string): AppState {
  const plan = state.menu;
  if (!plan) return state;

  const meal = plan.meals.find((item) => item.id === mealId);
  if (!meal) return state;

  const recipe = pickAlternativeRecipe(
    meal,
    plan,
    state.products,
    state.settings.warningDays,
  );
  if (!recipe) return state;

  return {
    ...state,
    menu: {
      ...plan,
      meals: plan.meals.map((item) =>
        item.id === mealId
          ? { ...item, recipeId: recipe.id, variant: item.variant + 1, cookedAt: undefined }
          : item,
      ),
    },
  };
}

export interface CookResult {
  state: AppState;
  deducted: string[];
}

/** Списывает продукты, использованные в блюде, и отмечает блюдо готовым. */
export function cookMeal(
  state: AppState,
  mealId: string,
  deductions: readonly Deduction[],
  today: string = todayISO(),
): CookResult {
  const plan = state.menu;
  const meal = plan?.meals.find((item) => item.id === mealId);
  if (!plan || !meal || meal.cookedAt) return { state, deducted: [] };

  const entries: ActivityEntry[] = [];
  const deductedLabels: string[] = [];
  const usedIds = new Set<string>();

  const products = state.products.flatMap((product) => {
    const deduction = deductions.find((item) => item.productId === product.id);
    if (!deduction || deduction.quantity <= 0) return [product];

    const quantity = Math.min(deduction.quantity, product.quantity);
    const remaining = Math.round((product.quantity - quantity) * 1000) / 1000;
    deductedLabels.push(product.name);

    if (remaining > 0.001) {
      return [{ ...product, quantity: remaining }];
    }

    usedIds.add(product.id);
    const expired = daysUntil(product.expiresAt, today) < 0;
    entries.push({
      id: makeId("activity"),
      kind: expired ? "discarded" : "cooked",
      productName: product.name,
      category: product.category,
      quantity: product.quantity,
      unit: product.unit,
      at: new Date().toISOString(),
      estimate: expired ? 0 : estimateProductValue(product.category),
      source: product.source,
    });
    return [];
  });

  const nextMeal: Meal = {
    ...meal,
    cookedAt: new Date().toISOString(),
    cookedProductLabels: deductedLabels,
  };

  return {
    state: {
      ...state,
      products,
      dismissals: state.dismissals.filter(
        (item) => !usedIds.has(item.productId),
      ),
      activity: [...entries, ...state.activity],
      menu: {
        ...plan,
        meals: plan.meals.map((item) => (item.id === mealId ? nextMeal : item)),
      },
    },
    deducted: deductedLabels,
  };
}

/** Удаляет только демо-наполнение, сохраняя данные пользователя. */
export function removeDemoData(state: AppState): AppState {
  const demoProductIds = new Set(
    state.products.filter((product) => product.source === "demo").map((p) => p.id),
  );

  return {
    ...state,
    products: state.products.filter((product) => product.source !== "demo"),
    activity: state.activity.filter((entry) => entry.source !== "demo"),
    menu: state.menu?.source === "demo" ? null : state.menu,
    dismissals: state.dismissals.filter(
      (item) => !demoProductIds.has(item.productId),
    ),
  };
}

export function clearAllData(state: AppState): AppState {
  return {
    version: 1,
    products: [],
    menu: null,
    activity: [],
    dismissals: [],
    settings: state.settings,
  };
}

export function hasDemoContent(state: AppState): boolean {
  return (
    state.products.some((product) => product.source === "demo") ||
    state.activity.some((entry) => entry.source === "demo") ||
    state.menu?.source === "demo"
  );
}
