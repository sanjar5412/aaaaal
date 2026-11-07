import { daysUntil, plural, todayISO } from "./dates";
import { normalizeText } from "@/lib/text";
import type { Category, Location, Product, ProductStatus } from "./types";

export interface ProductStatusInfo {
  status: ProductStatus;
  daysLeft: number;
  /** Короткая подпись для бейджа: «Сегодня», «Через 2 дня», «Просрочен». */
  shortLabel: string;
  /** Подпись предложением для напоминаний и подсказок. */
  sentence: string;
}

export function getProductStatus(
  product: Pick<Product, "expiresAt">,
  warningDays: number,
  today: string = todayISO(),
): ProductStatusInfo {
  const rawDays = daysUntil(product.expiresAt, today);
  const daysLeft = Number.isNaN(rawDays) ? 0 : rawDays;

  const status: ProductStatus =
    daysLeft < 0 ? "expired" : daysLeft <= warningDays ? "soon" : "fresh";

  const absolute = Math.abs(daysLeft);
  const shortLabel =
    status === "expired"
      ? "Просрочен"
      : daysLeft === 0
        ? "Сегодня"
        : daysLeft === 1
          ? "Завтра"
          : daysLeft <= warningDays
            ? `Через ${daysLeft} ${plural(daysLeft, "день", "дня", "дней")}`
            : "Свежий";

  const sentence =
    status === "expired"
      ? `Просрочен на ${absolute} ${plural(absolute, "день", "дня", "дней")}`
      : daysLeft === 0
        ? "Срок истекает сегодня"
        : `Осталось ${daysLeft} ${plural(daysLeft, "день", "дня", "дней")}`;

  return { status, daysLeft, shortLabel, sentence };
}

const statusRank: Record<ProductStatus, number> = {
  expired: 0,
  soon: 1,
  fresh: 2,
};

export function sortByUrgency(
  products: readonly Product[],
  warningDays: number,
  today: string = todayISO(),
): Product[] {
  return [...products].sort((a, b) => {
    const aInfo = getProductStatus(a, warningDays, today);
    const bInfo = getProductStatus(b, warningDays, today);

    if (aInfo.status !== bInfo.status) {
      return statusRank[aInfo.status] - statusRank[bInfo.status];
    }
    if (aInfo.daysLeft !== bInfo.daysLeft) {
      return aInfo.daysLeft - bInfo.daysLeft;
    }
    return a.name.localeCompare(b.name, "ru");
  });
}

export type StatusFilter = "all" | "soon" | "expired";

export interface ProductFilters {
  query: string;
  status: StatusFilter;
  category: Category | "all";
  location: Location | "all";
}

export const EMPTY_FILTERS: ProductFilters = {
  query: "",
  status: "all",
  category: "all",
  location: "all",
};

export function hasActiveFilters(filters: ProductFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.status !== "all" ||
    filters.category !== "all" ||
    filters.location !== "all"
  );
}

export function filterProducts(
  products: readonly Product[],
  filters: ProductFilters,
  warningDays: number,
  today: string = todayISO(),
): Product[] {
  const query = normalizeText(filters.query);

  const filtered = products.filter((product) => {
    if (query && !normalizeText(product.name).includes(query)) return false;
    if (filters.category !== "all" && product.category !== filters.category) {
      return false;
    }
    if (filters.location !== "all" && product.location !== filters.location) {
      return false;
    }
    if (filters.status !== "all") {
      const { status } = getProductStatus(product, warningDays, today);
      if (status !== filters.status) return false;
    }
    return true;
  });

  return sortByUrgency(filtered, warningDays, today);
}

export interface StatusCounts {
  all: number;
  fresh: number;
  soon: number;
  expired: number;
}

export function countByStatus(
  products: readonly Product[],
  warningDays: number,
  today: string = todayISO(),
): StatusCounts {
  const counts: StatusCounts = {
    all: products.length,
    fresh: 0,
    soon: 0,
    expired: 0,
  };

  for (const product of products) {
    counts[getProductStatus(product, warningDays, today).status] += 1;
  }
  return counts;
}

export interface InventorySummary {
  total: number;
  soon: number;
  expired: number;
  fridge: number;
  freezer: number;
  pantry: number;
  /** Продукты, требующие внимания: просроченные и с истекающим сроком. */
  urgent: Product[];
}

export function summarizeInventory(
  products: readonly Product[],
  warningDays: number,
  today: string = todayISO(),
): InventorySummary {
  const counts = countByStatus(products, warningDays, today);
  const urgent = sortByUrgency(
    products.filter(
      (product) =>
        getProductStatus(product, warningDays, today).status !== "fresh",
    ),
    warningDays,
    today,
  );

  return {
    total: counts.all,
    soon: counts.soon,
    expired: counts.expired,
    fridge: products.filter((product) => product.location === "fridge").length,
    freezer: products.filter((product) => product.location === "freezer").length,
    pantry: products.filter((product) => product.location === "pantry").length,
    urgent,
  };
}

export function productMonogram(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}
