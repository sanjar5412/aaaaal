"use client";

import Link from "next/link";
import { PageHeader, PanelHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import {
  AlertIcon,
  BellIcon,
  CheckCircleIcon,
  CheckIcon,
  InfoIcon,
  PencilIcon,
  PlusIcon,
} from "@/components/ui/icons";
import { useProductDialog } from "@/components/products/product-dialog-provider";
import { useToast } from "@/components/ui/toast";
import { useAppStore } from "@/lib/store/app-store";
import {
  formatDate,
  formatTimeAgo,
  plural,
  todayISO,
} from "@/lib/domain/dates";
import {
  CATEGORY_LABELS,
  LOCATION_LABELS,
  WARNING_DAY_OPTIONS,
} from "@/lib/domain/constants";
import { formatQuantity } from "@/lib/domain/format";
import { getProductStatus } from "@/lib/domain/products";
import { buildReminders } from "@/lib/domain/reminders";
import type { ReminderKind } from "@/lib/domain/reminders";

export default function RemindersPage() {
  const { state, actions } = useAppStore();
  const { openEdit, openCreate } = useProductDialog();
  const { show } = useToast();

  if (!state) return null;

  const today = todayISO();
  const warningDays = state.settings.warningDays;
  const reminders = buildReminders(
    state.products,
    state.dismissals,
    warningDays,
    today,
  );
  const expired = reminders.filter((item) => item.kind === "expired");
  const soon = reminders.filter((item) => item.kind === "soon");
  const completed = [...state.dismissals].sort(
    (a, b) => new Date(b.dismissedAt).getTime() - new Date(a.dismissedAt).getTime(),
  );

  function dismiss(key: string) {
    const reminder = reminders.find((item) => item.key === key);
    if (!reminder) return;
    actions.dismissReminder(reminder);
    show("Напоминание отмечено выполненным");
  }

  const groups: ReadonlyArray<{
    kind: ReminderKind;
    title: string;
    items: typeof reminders;
  }> = [
    { kind: "expired", title: "Просрочено", items: expired },
    { kind: "soon", title: "Скоро истекает", items: soon },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Напоминания"
        title="Сроки под контролем"
        description="Следим за продуктами, которые пора использовать, и не даём им потеряться в глубине холодильника."
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface/70 px-4 py-3 text-xs leading-relaxed text-ink-soft">
        <InfoIcon size={15} className="mt-0.5 shrink-0 text-forest" />
        <p>
          Напоминания показываются только внутри приложения. Мы не отправляем
          push-уведомления, письма или сообщения в мессенджеры — для этого MVP
          понадобился бы отдельный сервис.
        </p>
      </div>

      <Panel>
        <div className="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">
              За сколько дней предупреждать
            </h2>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-muted">
              Продукты с этим запасом попадут в «Использовать скоро» и станут
              приоритетными в меню.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="warning-days" className="sr-only">
              За сколько дней предупреждать об истечении срока
            </label>
            <select
              id="warning-days"
              value={warningDays}
              onChange={(event) => {
                const days = Number(event.target.value);
                actions.setWarningDays(days);
                show(`Будем предупреждать за ${days} ${plural(days, "день", "дня", "дней")}`);
              }}
              className="input h-10 w-[164px]"
            >
              {WARNING_DAY_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  за {days} {plural(days, "день", "дня", "дней")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Panel>

      {reminders.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<CheckCircleIcon size={22} />}
            title="Активных напоминаний нет"
            description={
              state.products.length === 0
                ? "Добавьте продукты — и мы начнём следить за сроками годности."
                : "Все продукты в порядке. Когда срок подойдёт к концу, напоминание появится здесь и в обзоре."
            }
            action={
              <Button variant="secondary" onClick={openCreate}>
                <PlusIcon size={15} />
                Добавить продукт
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="space-y-6">
          {groups.map((group) =>
            group.items.length === 0 ? null : (
              <Panel key={group.kind}>
                <PanelHeader
                  title={group.title}
                  hint={`${group.items.length} ${plural(group.items.length, "напоминание", "напоминания", "напоминаний")}`}
                />
                <ul className="divide-y divide-line">
                  {group.items.map((reminder) => (
                    <li
                      key={reminder.key}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
                    >
                      <span
                        className={
                          group.kind === "expired"
                            ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger-tint text-danger"
                            : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-tint text-amber"
                        }
                      >
                        {group.kind === "expired" ? (
                          <AlertIcon size={15} />
                        ) : (
                          <BellIcon size={15} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-sm font-medium text-ink">
                            {reminder.product.name}
                          </p>
                          <StatusBadge
                            status={group.kind}
                            label={
                              group.kind === "expired"
                                ? "Просрочен"
                                : getProductStatus(reminder.product, warningDays, today)
                                    .shortLabel
                            }
                          />
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                          {formatQuantity(reminder.product.quantity, reminder.product.unit)} ·{" "}
                          {LOCATION_LABELS[reminder.product.location]} ·{" "}
                          {CATEGORY_LABELS[reminder.product.category]} · срок{" "}
                          {formatDate(reminder.product.expiresAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => dismiss(reminder.key)}
                        >
                          <CheckIcon size={14} />
                          Выполнено
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(reminder.product)}
                          aria-label={`Изменить «${reminder.product.name}»`}
                          title="Изменить продукт"
                        >
                          <PencilIcon size={15} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            ),
          )}
        </div>
      )}

      {completed.length > 0 ? (
        <Panel>
          <PanelHeader
            title="Выполненные"
            hint="Можно вернуть, если продукт ещё не использован"
          />
          <ul className="divide-y divide-line">
            {completed.map((item) => (
              <li
                key={item.key}
                className="flex items-center gap-3 px-5 py-3.5 sm:px-6"
              >
                <CheckIcon size={14} className="shrink-0 text-forest/60" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-soft">{item.productName}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Отмечено {formatTimeAgo(item.dismissedAt)} · срок{" "}
                    {formatDate(item.expiresAt, "short")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    actions.restoreReminder(item.key);
                    show("Напоминание возвращено");
                  }}
                >
                  Вернуть
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <p className="px-1 text-xs text-ink-muted">
        Нужен обзор всех продуктов?{" "}
        <Link href="/inventory" className="link-quiet">
          Перейти в запасы
        </Link>
      </p>
    </div>
  );
}
