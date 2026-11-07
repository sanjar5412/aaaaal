import { addDays, todayISO } from "@/lib/domain/dates";
import { estimateProductValue } from "@/lib/domain/prices";
import { generateMenu } from "@/lib/domain/menu";
import type { AppState, ActivityEntry, Category, Location, Product, Unit } from "@/lib/domain/types";
import { makeId } from "@/lib/id";

interface SeedProduct {
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  location: Location;
  offset: number;
  note?: string;
}

const DEMO_PRODUCTS: readonly SeedProduct[] = [
  { name: "Молоко", category: "dairy", quantity: 1, unit: "л", location: "fridge", offset: -1, note: "Открыто вчера" },
  { name: "Шпинат", category: "vegetables", quantity: 120, unit: "г", location: "fridge", offset: 1, note: "Для салата" },
  { name: "Греческий йогурт", category: "dairy", quantity: 400, unit: "г", location: "fridge", offset: 2 },
  { name: "Помидоры", category: "vegetables", quantity: 4, unit: "шт", location: "fridge", offset: 2 },
  { name: "Куриное филе", category: "meat", quantity: 400, unit: "г", location: "fridge", offset: 2, note: "На ужин" },
  { name: "Сыр фета", category: "dairy", quantity: 150, unit: "г", location: "fridge", offset: 5 },
  { name: "Хлеб", category: "bakery", quantity: 1, unit: "шт", location: "pantry", offset: 1 },
  { name: "Авокадо", category: "fruits", quantity: 1, unit: "шт", location: "fridge", offset: 3 },
  { name: "Лимон", category: "fruits", quantity: 2, unit: "шт", location: "fridge", offset: 7 },
  { name: "Яйца", category: "dairy", quantity: 10, unit: "шт", location: "fridge", offset: 12 },
  { name: "Рис", category: "grains", quantity: 800, unit: "г", location: "pantry", offset: 180 },
  { name: "Макароны", category: "grains", quantity: 400, unit: "г", location: "pantry", offset: 240 },
  { name: "Картофель", category: "vegetables", quantity: 1, unit: "кг", location: "pantry", offset: 14 },
  { name: "Лук", category: "vegetables", quantity: 2, unit: "шт", location: "pantry", offset: 20 },
  { name: "Чеснок", category: "vegetables", quantity: 1, unit: "уп", location: "pantry", offset: 30 },
  { name: "Замороженная вишня", category: "fruits", quantity: 300, unit: "г", location: "freezer", offset: 90 },
  { name: "Оливковое масло", category: "other", quantity: 500, unit: "мл", location: "pantry", offset: 300 },
];

const DEMO_ACTIVITY: ReadonlyArray<{
  productName: string;
  category: Category;
  quantity: number;
  unit: Unit;
  daysAgo: number;
}> = [
  { productName: "Греческий йогурт", category: "dairy", quantity: 250, unit: "г", daysAgo: 2 },
  { productName: "Огурцы", category: "vegetables", quantity: 3, unit: "шт", daysAgo: 4 },
  { productName: "Куриное филе", category: "meat", quantity: 300, unit: "г", daysAgo: 6 },
];

function demoActivity(): ActivityEntry[] {
  const now = new Date();

  return DEMO_ACTIVITY.map((item, index) => {
    const at = new Date(now);
    at.setDate(at.getDate() - item.daysAgo);
    return {
      id: makeId("activity"),
      kind: index === 2 ? "cooked" : "used",
      productName: item.productName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      at: at.toISOString(),
      estimate: estimateProductValue(item.category),
      source: "demo",
    } satisfies ActivityEntry;
  });
}

/** Демо-набор для первого запуска. Все даты считаются от сегодняшнего дня. */
export function createDemoState(today: string = todayISO()): AppState {
  const createdAt = new Date().toISOString();

  const products: Product[] = DEMO_PRODUCTS.map((item, index) => ({
    id: `demo_product_${index + 1}`,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    expiresAt: addDays(today, item.offset),
    purchasedAt: addDays(today, Math.min(-1, item.offset - 5)),
    location: item.location,
    note: item.note,
    createdAt,
    source: "demo",
  }));

  const menu = generateMenu({
    products,
    days: 1,
    startDate: today,
    warningDays: 3,
    seed: "freshloop-demo-menu",
    source: "demo",
    today,
  });

  return {
    version: 1,
    products,
    menu,
    activity: demoActivity(),
    dismissals: [],
    settings: { warningDays: 3 },
  };
}
