"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader, PanelHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  MenuIcon,
  PlusIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import { MealCard } from "@/components/menu/meal-card";
import { CookMealDialog } from "@/components/menu/cook-meal-dialog";
import { useProductDialog } from "@/components/products/product-dialog-provider";
import { useToast } from "@/components/ui/toast";
import { useAppStore } from "@/lib/store/app-store";
import {
  dayTitle,
  formatDate,
  formatDateRange,
  plural,
  todayISO,
} from "@/lib/domain/dates";
import { PLAN_PERIODS } from "@/lib/domain/constants";
import {
  collectMissingIngredients,
  planDays,
  resolveMeals,
  summarizePlan,
  type MealView,
} from "@/lib/domain/menu";
import type { Deduction } from "@/lib/domain/mutations";
import { cn } from "@/lib/cn";

export default function MenuPage() {
  const { state, actions } = useAppStore();
  const { openCreate } = useProductDialog();
  const { show } = useToast();

  const [generating, setGenerating] = useState(false);
  const [cookTarget, setCookTarget] = useState<MealView | null>(null);
  const [pendingDays, setPendingDays] = useState(state?.menu?.days ?? 3);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!state) return null;

  const today = todayISO();
  const warningDays = state.settings.warningDays;
  const plan = state.menu;
  const hasProducts = state.products.length > 0;
  const summary = plan ? summarizePlan(plan, state.products, warningDays, today) : null;
  const days = plan ? planDays(plan) : [];
  const shopping = plan
    ? collectMissingIngredients(plan, state.products, warningDays, today)
    : [];

  function generate(daysToPlan: number) {
    if (!hasProducts) {
      show("Сначала добавьте хотя бы один продукт", "info");
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setGenerating(true);

    timer.current = setTimeout(() => {
      actions.createMenu(daysToPlan);
      setGenerating(false);
      show(
        plan
          ? "Меню пересобрано с учётом текущих запасов"
          : "Меню готово — блюда подобраны из ваших продуктов",
      );
    }, 420);
  }

  function choosePeriod(daysToPlan: number) {
    if (plan) {
      if (daysToPlan !== plan.days) generate(daysToPlan);
    } else {
      setPendingDays(daysToPlan);
    }
  }

  function swap(view: MealView) {
    const swapped = actions.swapMeal(view.meal.id);
    show(
      swapped
        ? "Блюдо заменено на другой вариант"
        : "Других подходящих блюд для этого приёма нет",
      swapped ? "success" : "info",
    );
  }

  function cook(deductions: Deduction[]) {
    if (!cookTarget) return;
    const deducted = actions.cookMeal(cookTarget.meal.id, deductions);
    setCookTarget(null);
    show(
      deducted > 0
        ? `Блюдо готово, списано ${deducted} ${plural(deducted, "продукт", "продукта", "продуктов")}`
        : "Блюдо отмечено приготовленным",
    );
  }

  async function copyShoppingList() {
    const text = [
      "Список покупок — Freshloop",
      ...shopping.map((item) => `· ${item.label} — ${item.amount}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      show("Список покупок скопирован");
    } catch {
      show("Не удалось скопировать — выделите список вручную", "error");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Меню"
        title="План из того, что есть"
        description="Собираем блюда в первую очередь из продуктов, которые скоро истекут. Недостающие ингредиенты показываем отдельно."
        actions={
          <>
            <div
              className="flex rounded-full border border-line bg-surface p-1"
              role="group"
              aria-label="Период планирования"
            >
              {PLAN_PERIODS.map((period) => {
                const active =
                  (plan ? plan.days : pendingDays) === period.value;
                return (
                  <button
                    key={period.value}
                    type="button"
                    aria-pressed={active}
                    disabled={generating}
                    onClick={() => choosePeriod(period.value)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                      active
                        ? "bg-forest text-cream"
                        : "text-ink-soft hover:bg-surface-muted hover:text-ink",
                    )}
                  >
                    {period.label}
                  </button>
                );
              })}
            </div>
            <Button
              onClick={() => generate(plan ? plan.days : pendingDays)}
              loading={generating}
              disabled={!hasProducts}
            >
              {!generating ? <RefreshIcon size={16} /> : null}
              {plan ? "Пересобрать" : "Составить меню"}
            </Button>
          </>
        }
      />

      {!hasProducts ? (
        <Panel>
          <EmptyState
            icon={<MenuIcon size={22} />}
            title="Сначала нужны продукты"
            description="Добавьте то, что уже есть в холодильнике и кладовой. Меню собирается только из ваших запасов и не выдумывает продукты."
            action={
              <Button onClick={openCreate}>
                <PlusIcon size={16} />
                Добавить продукты
              </Button>
            }
          />
        </Panel>
      ) : generating ? (
        <div aria-busy="true" aria-live="polite" className="space-y-5">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
            <RefreshIcon size={16} className="animate-spin text-forest" />
            Собираем меню из ваших продуктов…
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-2xl border border-line bg-surface"
              />
            ))}
          </div>
        </div>
      ) : !plan ? (
        <Panel>
          <EmptyState
            icon={<MenuIcon size={22} />}
            title="Меню ещё не собрано"
            description="Выберите период и нажмите «Составить меню». Мы подберём блюда из имеющихся продуктов и покажем, чего не хватает."
            action={
              <Button onClick={() => generate(pendingDays)}>
                <RefreshIcon size={15} />
                Составить меню на{" "}
                {pendingDays === 1
                  ? "сегодня"
                  : `${pendingDays} ${plural(pendingDays, "день", "дня", "дней")}`}
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-line bg-surface px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                План
              </p>
              <p className="mt-1 text-sm font-medium text-ink">
                {formatDateRange(plan.startDate, plan.days)}
              </p>
            </div>
            <div className="hidden h-8 w-px bg-line sm:block" aria-hidden="true" />
            <p className="text-xs text-ink-soft">
              <span className="font-semibold text-ink">{summary?.meals ?? 0}</span>{" "}
              {plural(summary?.meals ?? 0, "блюдо", "блюда", "блюд")}
            </p>
            <p className="text-xs text-ink-soft">
              <span className="font-semibold text-ink">{summary?.usedProducts ?? 0}</span>{" "}
              {plural(summary?.usedProducts ?? 0, "продукт", "продукта", "продуктов")} из запасов
            </p>
            <p className="text-xs text-amber">
              {shopping.length > 0
                ? `${shopping.length} ${plural(shopping.length, "ингредиент", "ингредиента", "ингредиентов")} докупить`
                : "Всё необходимое есть дома"}
            </p>
            {(summary?.cooked ?? 0) > 0 ? (
              <p className="text-xs text-forest">
                <CheckIcon size={12} className="mr-1 inline" />
                {summary?.cooked} готово
              </p>
            ) : null}
            <p className="ml-auto text-[11px] text-ink-muted">
              Сначала — продукты с близким сроком
            </p>
          </div>

          <div className="space-y-8">
            {days.map((date) => {
              const views = resolveMeals(
                plan.meals.filter((meal) => meal.date === date),
                state.products,
                warningDays,
                today,
              );
              const dayUrgent = views.reduce(
                (count, view) => count + view.urgentProducts.length,
                0,
              );
              return (
                <section key={date} aria-labelledby={`day-${date}`}>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2
                      id={`day-${date}`}
                      className="flex items-baseline gap-2 font-serif text-[22px] tracking-[-0.01em]"
                    >
                      {dayTitle(date, today)}
                      <span className="font-sans text-xs font-normal text-ink-muted">
                        {formatDate(date)}
                      </span>
                    </h2>
                    <p className="text-xs text-ink-muted">
                      {views.length} {plural(views.length, "блюдо", "блюда", "блюд")}
                      {dayUrgent > 0
                        ? ` · ${dayUrgent} ${plural(dayUrgent, "продукт", "продукта", "продуктов")} ${dayUrgent === 1 ? "скоро истекает" : "скоро истекают"}`
                        : ""}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {views.map((view) => (
                      <MealCard
                        key={view.meal.id}
                        view={view}
                        onCook={setCookTarget}
                        onSwap={swap}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {shopping.length > 0 ? (
            <Panel>
              <PanelHeader
                title="Чего не хватает"
                hint="Список покупок по всем блюдам плана"
                action={
                  <Button size="sm" variant="secondary" onClick={copyShoppingList}>
                    <CopyIcon size={14} />
                    Скопировать
                  </Button>
                }
              />
              <ul className="grid gap-x-8 gap-y-2.5 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
                {shopping.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-baseline justify-between gap-3 border-b border-line/70 pb-2 text-sm text-ink-soft"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-ink-muted">
                      {item.amount}
                      {item.occurrences > 1 ? ` · ${item.occurrences}×` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-ink-muted sm:px-6">
                Количество указано по рецептам. Список нигде не сохраняется
                отдельно — он пересчитывается по текущему плану.
              </div>
            </Panel>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-line bg-surface/60 px-4 py-3 text-[11px] leading-relaxed text-ink-muted">
            <ArrowRightIcon size={13} className="mt-0.5 shrink-0" />
            <p>
              Меню собрано локальным алгоритмом по вашим продуктам и библиотеке
              рецептов. Это не рекомендации ИИ и не медицинские советы.
            </p>
          </div>
        </>
      )}

      {cookTarget ? (
        <CookMealDialog
          view={cookTarget}
          onConfirm={cook}
          onClose={() => setCookTarget(null)}
        />
      ) : null}
    </div>
  );
}
