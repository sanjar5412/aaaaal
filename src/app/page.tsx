"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader, PanelHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryDot, NeutralBadge, StatusBadge } from "@/components/ui/badge";
import {
  AlertIcon,
  ArrowRightIcon,
  BellIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  RefreshIcon,
  UtensilsIcon,
} from "@/components/ui/icons";
import { useProductDialog } from "@/components/products/product-dialog-provider";
import { useToast } from "@/components/ui/toast";
import { useAppStore } from "@/lib/store/app-store";
import {
  capitalize,
  formatDate,
  formatFullDate,
  plural,
  todayISO,
} from "@/lib/domain/dates";
import {
  CATEGORY_LABELS,
  LOCATION_LABELS,
  MEAL_SLOT_LABELS,
} from "@/lib/domain/constants";
import { formatMoney, formatQuantity } from "@/lib/domain/format";
import { resolveMeals } from "@/lib/domain/menu";
import { getProductStatus, summarizeInventory } from "@/lib/domain/products";
import { buildReminders } from "@/lib/domain/reminders";
import { summarizeImpact } from "@/lib/domain/impact";
import type { Product } from "@/lib/domain/types";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export default function OverviewPage() {
  const { state, actions } = useAppStore();
  const { openCreate } = useProductDialog();
  const { show } = useToast();
  const [planning, setPlanning] = useState(false);

  if (!state) return null;

  const today = todayISO();
  const warningDays = state.settings.warningDays;
  const summary = summarizeInventory(state.products, warningDays, today);
  const reminders = buildReminders(
    state.products,
    state.dismissals,
    warningDays,
    today,
  ).slice(0, 3);
  const todayViews = state.menu
    ? resolveMeals(
        state.menu.meals.filter((meal) => meal.date === today),
        state.products,
        warningDays,
        today,
      )
    : [];
  const impact = summarizeImpact(state.activity);
  const urgent = summary.urgent.slice(0, 5);

  function markUsed(product: Product) {
    const expired = getProductStatus(product, warningDays, today).status === "expired";
    actions.markUsed(product.id);
    show(
      expired
        ? `«${product.name}» списан из запасов`
        : `«${product.name}» отмечен использованным`,
      expired ? "info" : "success",
    );
  }

  function planToday() {
    setPlanning(true);
    window.setTimeout(() => {
      actions.createMenu(1);
      setPlanning(false);
      show("Меню на сегодня собрано");
    }, 350);
  }

  const description =
    summary.total === 0
      ? "Добавьте первый продукт — приложение подскажет, когда его пора использовать."
      : summary.soon > 0
        ? `Дома ${summary.total} ${plural(summary.total, "продукт", "продукта", "продуктов")}. ${summary.soon} ${plural(summary.soon, "продукт", "продукта", "продуктов")} стоит использовать в ближайшие ${warningDays} ${plural(warningDays, "день", "дня", "дней")}.`
        : "Все сроки под контролем. Самое время спланировать меню из того, что уже есть.";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={capitalize(formatFullDate(today))}
        title={`${greeting()}.`}
        description={description}
        actions={
          <Button onClick={openCreate}>
            <PlusIcon size={17} />
            Добавить продукт
          </Button>
        }
      />

      <dl className="grid overflow-hidden rounded-2xl border border-line bg-surface sm:grid-cols-3 sm:divide-x sm:divide-line">
        <div className="px-5 py-5 sm:px-6">
          <dt className="text-xs font-medium text-ink-muted">Запасов дома</dt>
          <dd className="mt-2 font-serif text-[30px] leading-none text-ink">
            {summary.total}
          </dd>
          <p className="mt-2 text-xs text-ink-muted">
            {summary.total === 0
              ? "холодильник пока пуст"
              : `${plural(summary.total, "продукт", "продукта", "продуктов")} в трёх местах хранения`}
          </p>
        </div>
        <div className="border-t border-line px-5 py-5 sm:border-t-0 sm:px-6">
          <dt className="text-xs font-medium text-ink-muted">Использовать скоро</dt>
          <dd className="mt-2 font-serif text-[30px] leading-none text-amber">
            {summary.soon}
          </dd>
          <p className="mt-2 text-xs text-ink-muted">
            {summary.soon === 0
              ? "срочных продуктов нет"
              : `в ближайшие ${warningDays} ${plural(warningDays, "день", "дня", "дней")}`}
          </p>
        </div>
        <div className="border-t border-line px-5 py-5 sm:border-t-0 sm:px-6">
          <dt className="text-xs font-medium text-ink-muted">Просрочено</dt>
          <dd className="mt-2 font-serif text-[30px] leading-none text-danger">
            {summary.expired}
          </dd>
          <p className="mt-2 text-xs text-ink-muted">
            {summary.expired === 0 ? "ни одного продукта" : "пора убрать из запасов"}
          </p>
        </div>
      </dl>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Использовать скоро"
              hint="Сначала — то, что истекает раньше всего"
              action={
                <Link
                  href="/inventory"
                  className="inline-flex items-center gap-0.5 text-xs font-medium text-forest hover:underline"
                >
                  Все запасы
                  <ArrowRightIcon size={13} />
                </Link>
              }
            />
            {urgent.length === 0 ? (
              <EmptyState
                compact
                icon={<CheckCircleIcon size={20} />}
                title="Всё свежее"
                description="Нет продуктов, которым нужно уделить внимание в ближайшие дни."
                action={
                  <Button size="sm" variant="secondary" onClick={openCreate}>
                    <PlusIcon size={14} />
                    Добавить продукт
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {urgent.map((product) => {
                  const status = getProductStatus(product, warningDays, today);
                  const expired = status.status === "expired";
                  return (
                    <li
                      key={product.id}
                      className="flex items-center gap-3 px-5 py-3.5 sm:px-6"
                    >
                      <CategoryDot category={product.category} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {product.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-muted">
                          {formatQuantity(product.quantity, product.unit)} ·{" "}
                          {LOCATION_LABELS[product.location]} · до{" "}
                          {formatDate(product.expiresAt, "short")}
                        </p>
                      </div>
                      <StatusBadge
                        status={status.status}
                        label={status.shortLabel}
                        className="hidden sm:inline-flex"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markUsed(product)}
                        className="shrink-0 text-ink-soft"
                        aria-label={`Отметить «${product.name}» ${expired ? "списанным" : "использованным"}`}
                      >
                        <CheckIcon size={14} />
                        <span className="hidden sm:inline">
                          {expired ? "Убрать" : "Использовано"}
                        </span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              title="Меню на сегодня"
              hint={
                state.menu
                  ? "Блюда, собранные из ваших продуктов"
                  : "Пока не составлено"
              }
              action={
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-0.5 text-xs font-medium text-forest hover:underline"
                >
                  Открыть
                  <ArrowRightIcon size={13} />
                </Link>
              }
            />
            {todayViews.length === 0 ? (
              <EmptyState
                compact
                icon={<UtensilsIcon size={20} />}
                title="На сегодня блюд нет"
                description="Соберём меню из того, что есть дома, и выделим продукты, которые скоро истекут."
                action={
                  <Button size="sm" onClick={planToday} loading={planning}>
                    {!planning ? <RefreshIcon size={14} /> : null}
                    Составить меню на сегодня
                  </Button>
                }
              />
            ) : (
              <>
                <ul className="divide-y divide-line">
                  {todayViews.map((view) => (
                    <li
                      key={view.meal.id}
                      className="flex items-center gap-3 px-5 py-3.5 sm:px-6"
                    >
                      <span className="w-[68px] shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                        {MEAL_SLOT_LABELS[view.meal.slot]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {view.recipe.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-muted">
                          {view.meal.cookedAt
                            ? "Приготовлено"
                            : `${view.availableCount} из ${view.requiredCount} продуктов дома`}
                          {view.missing.length > 0
                            ? ` · ${view.missing.length} ${plural(view.missing.length, "ингредиент", "ингредиента", "ингредиентов")} докупить`
                            : ""}
                        </p>
                      </div>
                      {view.meal.cookedAt ? (
                        <NeutralBadge className="hidden sm:inline-flex">
                          <CheckIcon size={11} />
                          Готово
                        </NeutralBadge>
                      ) : view.urgentProducts.length > 0 ? (
                        <NeutralBadge className="hidden items-center gap-1 bg-amber-tint text-amber sm:inline-flex">
                          <ClockIcon size={11} />
                          Срок
                        </NeutralBadge>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-line px-5 py-3 sm:px-6">
                  <Link href="/menu" className="link-quiet text-xs">
                    Посмотреть весь план
                    <ArrowRightIcon size={13} />
                  </Link>
                </div>
              </>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Напоминания"
              hint="Показываются только внутри приложения"
              action={
                <Link
                  href="/reminders"
                  className="inline-flex items-center gap-0.5 text-xs font-medium text-forest hover:underline"
                >
                  Все
                  <ArrowRightIcon size={13} />
                </Link>
              }
            />
            {reminders.length === 0 ? (
              <div className="flex flex-col items-start gap-2 px-5 py-6 sm:px-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-tint text-forest">
                  <CheckCircleIcon size={17} />
                </span>
                <p className="text-sm font-medium text-ink">Активных напоминаний нет</p>
                <p className="text-xs leading-relaxed text-ink-muted">
                  Когда срок продукта подойдёт к концу, он появится здесь.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {reminders.map((reminder) => (
                  <li key={reminder.key} className="flex items-start gap-3 px-5 py-3.5 sm:px-6">
                    <span
                      className={
                        reminder.kind === "expired"
                          ? "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger-tint text-danger"
                          : "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-tint text-amber"
                      }
                    >
                      {reminder.kind === "expired" ? (
                        <AlertIcon size={14} />
                      ) : (
                        <BellIcon size={14} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-snug text-ink">
                        {reminder.product.name}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                        {reminder.kind === "expired"
                          ? "Срок истёк — проверьте продукт и списывайте, если испортился."
                          : reminder.detail.split(" · ")[0] +
                            " · " +
                            (reminder.daysLeft === 0
                              ? "истекает сегодня"
                              : `осталось ${reminder.daysLeft} ${plural(reminder.daysLeft, "день", "дня", "дней")}`)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Отметить напоминание о «${reminder.product.name}» выполненным`}
                      title="Выполнено"
                      onClick={() => {
                        actions.dismissReminder(reminder);
                        show("Напоминание отмечено выполненным");
                      }}
                      className="mt-0.5 shrink-0 text-ink-muted hover:text-forest"
                    >
                      <CheckIcon size={15} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <section className="rounded-2xl border border-forest-dark bg-forest p-6 text-cream">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
              Предотвращено отходов
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="font-serif text-[34px] leading-none">
                {impact.savedItems}
              </span>
              <span className="pb-1 text-xs text-cream/70">
                {plural(impact.savedItems, "продукт", "продукта", "продуктов")}
              </span>
            </div>
            <p className="mt-2 text-sm text-cream/80">
              ≈ {formatMoney(impact.savedValue)} по демо-оценке
            </p>
            <div className="mt-5 border-t border-cream/15 pt-4">
              <p className="text-[11px] leading-relaxed text-cream/60">
                Демо-оценка: средняя стоимость продукта по категории. Считаются
                только продукты, отмеченные использованными до истечения срока.
                {impact.hasDemoEntries ? " Включая демо-данные." : ""}
              </p>
              <Link
                href="/about#data"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-cream/85 underline-offset-4 hover:underline"
              >
                Как это работает
                <ArrowRightIcon size={12} />
              </Link>
            </div>
          </section>

          {summary.total > 0 ? (
            <p className="px-1 text-[11px] leading-relaxed text-ink-muted">
              Категории:{" "}
              {[...new Set(state.products.map((product) => product.category))]
                .slice(0, 4)
                .map((category) => CATEGORY_LABELS[category])
                .join(" · ")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
