import { formatDate, plural, todayISO } from "./dates";
import { getProductStatus } from "./products";
import { LOCATION_LABELS } from "./constants";
import { formatQuantity } from "./format";
import type { AppState, Product, ReminderDismissal } from "./types";

export type ReminderKind = "expired" | "soon";

export interface Reminder {
  key: string;
  product: Product;
  kind: ReminderKind;
  daysLeft: number;
  title: string;
  detail: string;
}

export function reminderKey(product: Pick<Product, "id" | "expiresAt">): string {
  return `${product.id}:${product.expiresAt}`;
}

export function buildReminders(
  products: readonly Product[],
  dismissals: readonly ReminderDismissal[],
  warningDays: number,
  today: string = todayISO(),
): Reminder[] {
  const dismissed = new Set(dismissals.map((item) => item.key));

  return products
    .map((product) => {
      const status = getProductStatus(product, warningDays, today);
      if (status.status === "fresh") return null;

      const key = reminderKey(product);
      if (dismissed.has(key)) return null;

      const absolute = Math.abs(status.daysLeft);
      const title =
        status.status === "expired"
          ? `${product.name} уже просрочен`
          : status.daysLeft === 0
            ? `${product.name}: срок истекает сегодня`
            : `${product.name}: осталось ${status.daysLeft} ${plural(status.daysLeft, "день", "дня", "дней")}`;

      const detail = `${formatQuantity(product.quantity, product.unit)} · ${
        LOCATION_LABELS[product.location]
      } · срок ${formatDate(product.expiresAt, "short")}${
        status.status === "expired"
          ? ` · просрочка ${absolute} ${plural(absolute, "день", "дня", "дней")}`
          : ""
      }`;

      return {
        key,
        product,
        kind: status.status,
        daysLeft: status.daysLeft,
        title,
        detail,
      } satisfies Reminder;
    })
    .filter((item): item is Reminder => item !== null)
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "expired" ? -1 : 1;
      return a.daysLeft - b.daysLeft;
    });
}

export function createdDismissal(
  reminder: Reminder,
  at: string = new Date().toISOString(),
): ReminderDismissal {
  return {
    key: reminder.key,
    productId: reminder.product.id,
    productName: reminder.product.name,
    expiresAt: reminder.product.expiresAt,
    dismissedAt: at,
  };
}

export function activeReminders(state: AppState, today: string = todayISO()): Reminder[] {
  return buildReminders(
    state.products,
    state.dismissals,
    state.settings.warningDays,
    today,
  );
}
