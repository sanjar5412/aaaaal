"use client";

import { cn } from "@/lib/cn";
import { MEAL_SLOT_LABELS } from "@/lib/domain/constants";
import { formatQuantity } from "@/lib/domain/format";
import type { MealView } from "@/lib/domain/menu";
import { NeutralBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  RefreshIcon,
  UtensilsIcon,
} from "@/components/ui/icons";

export function MealCard({
  view,
  onCook,
  onSwap,
}: {
  view: MealView;
  onCook: (view: MealView) => void;
  onSwap: (view: MealView) => void;
}) {
  const { meal, recipe, ingredients, missing, pantryNotes, availableCount, requiredCount, urgentProducts } =
    view;

  if (meal.cookedAt) {
    return (
      <article className="flex h-full flex-col rounded-2xl border border-line bg-surface-muted/55 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">{MEAL_SLOT_LABELS[meal.slot]}</span>
          <NeutralBadge className="bg-forest-tint text-forest-dark">
            <CheckCircleIcon size={11} />
            Приготовлено
          </NeutralBadge>
        </div>
        <h3 className="mt-2 font-serif text-[19px] leading-snug text-ink-soft">
          {recipe.title}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          {meal.cookedProductLabels && meal.cookedProductLabels.length > 0
            ? `Списано: ${meal.cookedProductLabels.join(", ")}`
            : "Продукты не списывались — отмечено вручную."}
        </p>
        <p className="mt-auto pt-4 text-[11px] text-ink-muted">
          Блюдо готово. Продукты обновлены в запасах.
        </p>
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">{MEAL_SLOT_LABELS[meal.slot]}</span>
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
          <ClockIcon size={12} />
          {recipe.minutes} мин
        </span>
      </div>

      <h3 className="mt-2 font-serif text-[19px] leading-snug text-ink">
        {recipe.title}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{recipe.summary}</p>

      {urgentProducts.length > 0 ? (
        <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-tint px-2 py-1 text-[10.5px] font-medium leading-tight text-amber">
          <ClockIcon size={11} className="shrink-0" />
          Сначала используйте: {urgentProducts.map((product) => product.name).join(", ")}
        </p>
      ) : null}

      <ul className="mt-4 space-y-1.5 text-[12.5px]">
        {ingredients.map((item) => (
          <li
            key={item.ingredient.label}
            className="flex items-start justify-between gap-3"
          >
            <span
              className={cn(
                "flex min-w-0 items-start gap-1.5",
                item.product ? "text-ink-soft" : "text-amber",
              )}
            >
              {item.product ? (
                <CheckIcon size={13} className="mt-0.5 shrink-0 text-forest/55" />
              ) : (
                <PlusIcon size={13} className="mt-0.5 shrink-0" />
              )}
              <span className="truncate">{item.ingredient.label}</span>
            </span>
            <span
              className="shrink-0 text-[11.5px] text-ink-muted"
              title={
                item.product
                  ? `В запасе: ${formatQuantity(item.product.quantity, item.product.unit)}`
                  : "Нужно докупить"
              }
            >
              {item.ingredient.amount}
            </span>
          </li>
        ))}
      </ul>

      {pantryNotes.length > 0 ? (
        <p className="mt-2 text-[11px] text-ink-muted">
          Плюс {pantryNotes.join(", ")}
        </p>
      ) : null}

      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <p className="text-[11px] text-ink-muted">
            {availableCount} из {requiredCount} продуктов есть
            {missing.length > 0 ? ` · ${missing.length} докупить` : ""}
          </p>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Button size="sm" variant="soft" onClick={() => onCook(view)}>
            <UtensilsIcon size={14} />
            Приготовлено
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onSwap(view)}>
            <RefreshIcon size={14} />
            Заменить
          </Button>
        </div>
      </div>
    </article>
  );
}
