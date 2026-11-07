import { makeId } from "@/lib/id";
import { normalizeText } from "@/lib/text";
import { addDays, todayISO } from "./dates";
import { getProductStatus } from "./products";
import { findRecipe, RECIPES, type Recipe, type RecipeIngredient } from "./recipes";
import type {
  Meal,
  MealSlot,
  MenuPlan,
  Product,
  Unit,
} from "./types";

export const MEAL_ORDER: readonly MealSlot[] = ["breakfast", "lunch", "dinner"];

export interface ResolvedIngredient {
  ingredient: RecipeIngredient;
  product: Product | null;
  suggestedDeduction: number;
}

export interface MealView {
  meal: Meal;
  recipe: Recipe;
  ingredients: ResolvedIngredient[];
  missing: ResolvedIngredient[];
  pantryNotes: string[];
  availableCount: number;
  requiredCount: number;
  urgentProducts: Product[];
}

export function normalizeUnitAmount(amount: number): number {
  return Math.round(amount * 1000) / 1000;
}

function unitFactor(from: Unit, to: Unit): number | null {
  if (from === to) return 1;
  if (from === "г" && to === "кг") return 0.001;
  if (from === "кг" && to === "г") return 1000;
  if (from === "мл" && to === "л") return 0.001;
  if (from === "л" && to === "мл") return 1000;
  return null;
}

/** Сколько единиц продукта списать по умолчанию при готовке. */
export function suggestedDeduction(
  ingredient: RecipeIngredient,
  product: Product,
): number {
  const fallback = Math.min(1, product.quantity);

  if (!ingredient.deduct || ingredient.deduct <= 0) return fallback;

  if (!ingredient.deductUnit) {
    return normalizeUnitAmount(Math.min(ingredient.deduct, product.quantity));
  }

  const factor = unitFactor(ingredient.deductUnit, product.unit);
  if (factor === null) return fallback;

  const converted = normalizeUnitAmount(ingredient.deduct * factor);
  return Math.min(converted, product.quantity);
}

export function matchesIngredient(
  product: Pick<Product, "name">,
  ingredient: RecipeIngredient,
): boolean {
  // Сравниваем с началом слова, иначе «йогурт» совпадает с «огурцом».
  const words = normalizeText(product.name).split(/[^\p{L}\p{N}]+/u);
  return ingredient.stems.some((stem) => {
    const normalizedStem = normalizeText(stem);
    return words.some((word) => word.startsWith(normalizedStem));
  });
}

export function findMatchingProduct(
  ingredient: RecipeIngredient,
  products: readonly Product[],
  warningDays: number,
  today: string = todayISO(),
): Product | null {
  const candidates = products.filter(
    (product) => product.quantity > 0 && matchesIngredient(product, ingredient),
  );
  if (candidates.length === 0) return null;

  // Просроченные продукты не предлагаем в меню.
  const usable = candidates.filter(
    (product) =>
      getProductStatus(product, warningDays, today).status !== "expired",
  );
  if (usable.length === 0) return null;

  usable.sort((a, b) => {
    const aInfo = getProductStatus(a, warningDays, today);
    const bInfo = getProductStatus(b, warningDays, today);
    if (aInfo.daysLeft !== bInfo.daysLeft) return aInfo.daysLeft - bInfo.daysLeft;
    return b.quantity - a.quantity;
  });

  return usable[0];
}

export function resolveMeal(
  meal: Meal,
  products: readonly Product[],
  warningDays: number,
  today: string = todayISO(),
): MealView | null {
  const recipe = findRecipe(meal.recipeId);
  if (!recipe) return null;

  const tracked = recipe.ingredients.filter((ingredient) => !ingredient.staple);
  const ingredients: ResolvedIngredient[] = tracked.map((ingredient) => {
    const product = findMatchingProduct(ingredient, products, warningDays, today);
    return {
      ingredient,
      product,
      suggestedDeduction: product ? suggestedDeduction(ingredient, product) : 0,
    };
  });

  const missing = ingredients.filter((item) => !item.product);
  const urgentMap = new Map<string, Product>();
  for (const item of ingredients) {
    if (!item.product) continue;
    const status = getProductStatus(item.product, warningDays, today).status;
    if (status === "soon") urgentMap.set(item.product.id, item.product);
  }

  return {
    meal,
    recipe,
    ingredients,
    missing,
    pantryNotes: recipe.ingredients
      .filter((ingredient) => ingredient.staple)
      .map((ingredient) => ingredient.label),
    availableCount: ingredients.length - missing.length,
    requiredCount: ingredients.length,
    urgentProducts: [...urgentMap.values()],
  };
}

export function resolveMeals(
  meals: readonly Meal[],
  products: readonly Product[],
  warningDays: number,
  today: string = todayISO(),
): MealView[] {
  return meals
    .map((meal) => resolveMeal(meal, products, warningDays, today))
    .filter((view): view is MealView => view !== null);
}

/* ---------------------------- генерация меню ---------------------------- */

interface RecipeScore {
  recipe: Recipe;
  score: number;
  matchedCount: number;
  urgentCount: number;
  missingCount: number;
}

function scoreRecipe(
  recipe: Recipe,
  products: readonly Product[],
  warningDays: number,
  today: string,
): RecipeScore {
  const tracked = recipe.ingredients.filter((ingredient) => !ingredient.staple);
  let matchedCount = 0;
  let urgentCount = 0;
  let urgencyWeight = 0;

  for (const ingredient of tracked) {
    const product = findMatchingProduct(ingredient, products, warningDays, today);
    if (!product) continue;

    matchedCount += 1;
    const status = getProductStatus(product, warningDays, today);
    if (status.status === "soon") {
      urgentCount += 1;
      urgencyWeight += warningDays + 1 - status.daysLeft;
    }
  }

  const missingCount = tracked.length - matchedCount;
  return {
    recipe,
    matchedCount,
    urgentCount,
    missingCount,
    score: matchedCount * 10 + urgencyWeight * 6 + urgentCount * 4 - missingCount * 4,
  };
}

function createRng(seed: string): () => number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedPick<T>(items: readonly T[], rng: () => number): T {
  const weights = items.map((_, index) => items.length - index);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let threshold = rng() * total;

  for (let index = 0; index < items.length; index += 1) {
    threshold -= weights[index];
    if (threshold <= 0) return items[index];
  }
  return items[items.length - 1];
}

export interface GenerateMenuInput {
  products: readonly Product[];
  days: number;
  startDate?: string;
  warningDays: number;
  seed: string;
  source?: "demo" | "user";
  today?: string;
}

/**
 * Детерминированная подборка блюд: сначала рецепты, которые покрывают
 * больше продуктов и используют то, что скоро истечёт. Seed позволяет
 * получить другой вариант по кнопке «Пересобрать».
 */
export function generateMenu(input: GenerateMenuInput): MenuPlan {
  const today = input.today ?? todayISO();
  const startDate = input.startDate ?? today;
  const days = Math.min(14, Math.max(1, Math.round(input.days)));
  const rng = createRng(input.seed);

  const scored = RECIPES.map((recipe) =>
    scoreRecipe(recipe, input.products, input.warningDays, today),
  );
  const allEmpty = scored.every((item) => item.matchedCount === 0);

  const usage = new Map<string, number>();
  const meals: Meal[] = [];
  const maxRepeat = days <= 3 ? 2 : 3;

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const date = addDays(startDate, dayIndex);
    const usedToday = new Set<string>();

    for (const slot of MEAL_ORDER) {
      const eligible = scored.filter(
        (item) =>
          item.recipe.slots.includes(slot) && (allEmpty || item.matchedCount > 0),
      );
      if (eligible.length === 0) continue;

      const unusedToday = eligible.filter(
        (item) => !usedToday.has(item.recipe.id),
      );
      const withinRepeats = unusedToday.filter(
        (item) => (usage.get(item.recipe.id) ?? 0) < maxRepeat,
      );

      let pool =
        withinRepeats.length > 0
          ? withinRepeats
          : unusedToday.length > 0
            ? unusedToday
            : eligible;

      // В первый день отдаём приоритет блюдам из продуктов с истекающим сроком.
      if (dayIndex === 0) {
        const urgent = pool.filter((item) => item.urgentCount > 0);
        if (urgent.length > 0) pool = urgent;
      }

      const top = [...pool]
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      const picked = weightedPick(top, rng);
      usedToday.add(picked.recipe.id);
      usage.set(picked.recipe.id, (usage.get(picked.recipe.id) ?? 0) + 1);

      meals.push({
        id: `${date}-${slot}`,
        date,
        slot,
        recipeId: picked.recipe.id,
        variant: 0,
      });
    }
  }

  return {
    id: makeId("plan"),
    startDate,
    days,
    createdAt: new Date().toISOString(),
    source: input.source ?? "user",
    meals,
  };
}

/** Следующий вариант блюда для замены. null — других вариантов нет. */
export function pickAlternativeRecipe(
  meal: Meal,
  plan: MenuPlan,
  products: readonly Product[],
  warningDays: number,
  today: string = todayISO(),
): Recipe | null {
  const usedToday = new Set(
    plan.meals
      .filter((item) => item.date === meal.date && item.id !== meal.id)
      .map((item) => item.recipeId),
  );

  const ranked = RECIPES.filter(
    (recipe) =>
      recipe.slots.includes(meal.slot) &&
      recipe.id !== meal.recipeId &&
      !usedToday.has(recipe.id),
  )
    .map((recipe) => scoreRecipe(recipe, products, warningDays, today))
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) return null;
  const index = meal.variant % ranked.length;
  return ranked[index].recipe;
}

export interface MissingItem {
  label: string;
  amount: string;
  occurrences: number;
}

/** Агрегированный список покупок по несготовленным блюдам. */
export function collectMissingIngredients(
  plan: MenuPlan,
  products: readonly Product[],
  warningDays: number,
  today: string = todayISO(),
): MissingItem[] {
  const map = new Map<string, MissingItem>();

  for (const meal of plan.meals) {
    if (meal.cookedAt) continue;
    const view = resolveMeal(meal, products, warningDays, today);
    if (!view) continue;

    for (const item of view.missing) {
      const existing = map.get(item.ingredient.label);
      if (existing) {
        existing.occurrences += 1;
      } else {
        map.set(item.ingredient.label, {
          label: item.ingredient.label,
          amount: item.ingredient.amount,
          occurrences: 1,
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "ru"));
}

export interface PlanSummary {
  meals: number;
  cooked: number;
  missing: number;
  usedProducts: number;
  urgentProducts: number;
}

export function summarizePlan(
  plan: MenuPlan,
  products: readonly Product[],
  warningDays: number,
  today: string = todayISO(),
): PlanSummary {
  const views = resolveMeals(plan.meals, products, warningDays, today);
  const used = new Set<string>();
  const urgent = new Set<string>();

  for (const view of views) {
    for (const item of view.ingredients) {
      if (item.product) used.add(item.product.id);
    }
    for (const product of view.urgentProducts) urgent.add(product.id);
  }

  return {
    meals: plan.meals.length,
    cooked: plan.meals.filter((meal) => Boolean(meal.cookedAt)).length,
    missing: collectMissingIngredients(plan, products, warningDays, today).length,
    usedProducts: used.size,
    urgentProducts: urgent.size,
  };
}

export function planDays(plan: MenuPlan): string[] {
  return Array.from({ length: plan.days }, (_, index) =>
    addDays(plan.startDate, index),
  );
}
