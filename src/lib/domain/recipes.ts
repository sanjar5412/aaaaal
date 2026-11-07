import type { MealSlot, Unit } from "./types";

export interface RecipeIngredient {
  label: string;
  /** Как показывать количество в карточке блюда. */
  amount: string;
  /** Короткие основы слов для сопоставления с названиями продуктов. */
  stems: string[];
  /** Сколько списать по умолчанию. */
  deduct?: number;
  deductUnit?: Unit;
  /** Базовые продукты, которые не считаем недостающими. */
  staple?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  slots: MealSlot[];
  minutes: number;
  summary: string;
  ingredients: RecipeIngredient[];
}

function ing(
  label: string,
  amount: string,
  stems: string[],
  deduct?: number,
  deductUnit?: Unit,
): RecipeIngredient {
  return { label, amount, stems, deduct, deductUnit };
}

const salt: RecipeIngredient = {
  label: "соль",
  amount: "по вкусу",
  stems: ["соль"],
  staple: true,
};
const pepper: RecipeIngredient = {
  label: "перец",
  amount: "по вкусу",
  stems: ["перец"],
  staple: true,
};
const oil: RecipeIngredient = {
  label: "оливковое масло",
  amount: "по вкусу",
  stems: ["масло"],
  staple: true,
};
const honey: RecipeIngredient = {
  label: "мёд",
  amount: "1 ч. л.",
  stems: ["мед"],
  staple: true,
};

/**
 * Локальная библиотека рецептов. Никакой внешней генерации: блюда
 * подбираются по совпадению ингредиентов с продуктами пользователя.
 */
export const RECIPES: readonly Recipe[] = [
  {
    id: "omelette-spinach",
    title: "Омлет со шпинатом и томатами",
    slots: ["breakfast"],
    minutes: 15,
    summary: "Быстрый завтрак на одной сковороде.",
    ingredients: [
      ing("яйца", "3 шт", ["яйц"], 3, "шт"),
      ing("шпинат", "100 г", ["шпинат"], 100, "г"),
      ing("помидоры", "2 шт", ["помидор", "томат"], 2, "шт"),
      oil,
      salt,
    ],
  },
  {
    id: "avocado-toast",
    title: "Тост с авокадо и яйцом",
    slots: ["breakfast"],
    minutes: 10,
    summary: "Хрустящий хлеб, немного лимона и яйцо.",
    ingredients: [
      ing("хлеб", "2 ломтика", ["хлеб", "багет", "тост"], 2, "шт"),
      ing("авокадо", "1 шт", ["авокадо"], 1, "шт"),
      ing("яйца", "2 шт", ["яйц"], 2, "шт"),
      ing("лимон", "½ шт", ["лимон"], 1, "шт"),
      salt,
    ],
  },
  {
    id: "yogurt-cherry",
    title: "Йогурт с вишней и мёдом",
    slots: ["breakfast"],
    minutes: 5,
    summary: "Без готовки — если утро идёт не по плану.",
    ingredients: [
      ing("греческий йогурт", "200 г", ["йогурт"], 200, "г"),
      ing("вишня", "100 г", ["вишн"], 100, "г"),
      honey,
    ],
  },
  {
    id: "shakshuka",
    title: "Шакшука с фетой",
    slots: ["breakfast", "lunch"],
    minutes: 25,
    summary: "Яйца в томатном соусе, одна сковорода.",
    ingredients: [
      ing("яйца", "4 шт", ["яйц"], 4, "шт"),
      ing("помидоры", "4 шт", ["помидор", "томат"], 4, "шт"),
      ing("лук", "1 шт", ["лук"], 1, "шт"),
      ing("чеснок", "2 зубчика", ["чеснок"], 1),
      ing("фета", "80 г", ["фет", "брынз"], 80, "г"),
      oil,
      salt,
    ],
  },
  {
    id: "pasta-spinach",
    title: "Паста с томатами и шпинатом",
    slots: ["lunch", "dinner"],
    minutes: 25,
    summary: "Тёплая паста из того, что уже на полке.",
    ingredients: [
      ing("макароны", "200 г", ["макарон", "паст", "спагетти"], 200, "г"),
      ing("помидоры", "3 шт", ["помидор", "томат"], 3, "шт"),
      ing("шпинат", "100 г", ["шпинат"], 100, "г"),
      ing("чеснок", "2 зубчика", ["чеснок"], 1),
      oil,
      salt,
    ],
  },
  {
    id: "chicken-soup",
    title: "Куриный суп с картофелем",
    slots: ["lunch"],
    minutes: 45,
    summary: "Домашний бульон на два обеда.",
    ingredients: [
      ing("куриное филе", "300 г", ["кури", "филе"], 300, "г"),
      ing("картофель", "3 шт", ["картоф", "картош"], 3, "шт"),
      ing("лук", "1 шт", ["лук"], 1, "шт"),
      ing("морковь", "1 шт", ["морков", "моркв"], 1, "шт"),
      salt,
      pepper,
    ],
  },
  {
    id: "rice-chicken-lemon",
    title: "Рис с курицей и лимоном",
    slots: ["lunch", "dinner"],
    minutes: 30,
    summary: "Сытное блюдо с лёгкой кислинкой.",
    ingredients: [
      ing("рис", "200 г", ["рис"], 200, "г"),
      ing("куриное филе", "300 г", ["кури", "филе"], 300, "г"),
      ing("лимон", "½ шт", ["лимон"], 1, "шт"),
      ing("чеснок", "1 зубчик", ["чеснок"], 1),
      oil,
      salt,
    ],
  },
  {
    id: "potato-feta-bake",
    title: "Запечённый картофель с фетой",
    slots: ["dinner"],
    minutes: 40,
    summary: "Противень, специи и минимум внимания.",
    ingredients: [
      ing("картофель", "500 г", ["картоф", "картош"], 500, "г"),
      ing("фета", "100 г", ["фет", "брынз"], 100, "г"),
      ing("чеснок", "2 зубчика", ["чеснок"], 1),
      oil,
      pepper,
    ],
  },
  {
    id: "spinach-feta-salad",
    title: "Салат из шпината с фетой",
    slots: ["lunch"],
    minutes: 10,
    summary: "Свежий обед без плиты.",
    ingredients: [
      ing("шпинат", "100 г", ["шпинат"], 100, "г"),
      ing("фета", "80 г", ["фет", "брынз"], 80, "г"),
      ing("помидоры", "2 шт", ["помидор", "томат"], 2, "шт"),
      ing("лимон", "½ шт", ["лимон"], 1, "шт"),
      oil,
    ],
  },
  {
    id: "chicken-salad-yogurt",
    title: "Куриный салат с йогуртовым соусом",
    slots: ["lunch"],
    minutes: 20,
    summary: "Остатки курицы превращаются в полноценный обед.",
    ingredients: [
      ing("куриное филе", "250 г", ["кури", "филе"], 250, "г"),
      ing("греческий йогурт", "100 г", ["йогурт"], 100, "г"),
      ing("помидоры", "2 шт", ["помидор", "томат"], 2, "шт"),
      ing("лимон", "½ шт", ["лимон"], 1, "шт"),
      salt,
    ],
  },
  {
    id: "veggie-rice-stew",
    title: "Овощное рагу с рисом",
    slots: ["dinner"],
    minutes: 35,
    summary: "Овощи, которые пора использовать, — в одном казане.",
    ingredients: [
      ing("картофель", "3 шт", ["картоф", "картош"], 3, "шт"),
      ing("помидоры", "2 шт", ["помидор", "томат"], 2, "шт"),
      ing("лук", "1 шт", ["лук"], 1, "шт"),
      ing("рис", "150 г", ["рис"], 150, "г"),
      oil,
      salt,
    ],
  },
  {
    id: "greek-salad",
    title: "Греческий салат",
    slots: ["lunch", "dinner"],
    minutes: 15,
    summary: "Быстро, свежо и почти без готовки.",
    ingredients: [
      ing("помидоры", "3 шт", ["помидор", "томат"], 3, "шт"),
      ing("фета", "100 г", ["фет", "брынз"], 100, "г"),
      ing("огурец", "1 шт", ["огур"], 1, "шт"),
      ing("лук", "½ шт", ["лук"], 1, "шт"),
      oil,
      salt,
    ],
  },
  {
    id: "pasta-feta-bake",
    title: "Паста с томатами и фетой",
    slots: ["dinner"],
    minutes: 30,
    summary: "Запеканка, которая собирается за пять минут.",
    ingredients: [
      ing("макароны", "250 г", ["макарон", "паст", "спагетти"], 250, "г"),
      ing("помидоры", "4 шт", ["помидор", "томат"], 4, "шт"),
      ing("фета", "100 г", ["фет", "брынз"], 100, "г"),
      ing("чеснок", "2 зубчика", ["чеснок"], 1),
      oil,
    ],
  },
  {
    id: "fried-rice-eggs",
    title: "Жареный рис с овощами и яйцом",
    slots: ["lunch", "dinner"],
    minutes: 20,
    summary: "Лучший способ доесть вчерашний рис.",
    ingredients: [
      ing("рис", "200 г", ["рис"], 200, "г"),
      ing("яйца", "2 шт", ["яйц"], 2, "шт"),
      ing("лук", "1 шт", ["лук"], 1, "шт"),
      ing("морковь", "1 шт", ["морков", "моркв"], 1, "шт"),
      oil,
      salt,
    ],
  },
  {
    id: "oatmeal-banana",
    title: "Овсянка с бананом",
    slots: ["breakfast"],
    minutes: 10,
    summary: "Тёплый завтрак на молоке.",
    ingredients: [
      ing("овсяные хлопья", "60 г", ["овсян", "геркулес", "хлопья"], 60, "г"),
      ing("молоко", "200 мл", ["молок"], 200, "мл"),
      ing("банан", "1 шт", ["банан"], 1, "шт"),
      honey,
    ],
  },
  {
    id: "cheese-omelette",
    title: "Сырный омлет с луком",
    slots: ["breakfast"],
    minutes: 12,
    summary: "Минимум ингредиентов, максимум сытости.",
    ingredients: [
      ing("яйца", "3 шт", ["яйц"], 3, "шт"),
      ing("сыр", "60 г", ["сыр"], 60, "г"),
      ing("лук", "½ шт", ["лук"], 1),
      oil,
    ],
  },
];

const recipeMap = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

export function findRecipe(id: string): Recipe | null {
  return recipeMap.get(id) ?? null;
}

export function isKnownRecipe(id: string): boolean {
  return recipeMap.has(id);
}
