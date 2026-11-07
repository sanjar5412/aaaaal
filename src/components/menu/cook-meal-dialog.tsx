"use client";

import { useState } from "react";
import type { MealView } from "@/lib/domain/menu";
import type { Deduction } from "@/lib/domain/mutations";
import { formatQuantity } from "@/lib/domain/format";
import type { Unit } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function CookMealDialog({
  view,
  onConfirm,
  onClose,
}: {
  view: MealView;
  onConfirm: (deductions: Deduction[]) => void;
  onClose: () => void;
}) {
  const uniqueProducts = new Map<
    string,
    { name: string; unit: Unit; available: number; suggested: number }
  >();
  for (const item of view.ingredients) {
    const product = item.product;
    if (!product) continue;

    const existing = uniqueProducts.get(product.id);
    if (existing) {
      existing.suggested = Math.min(
        existing.available,
        existing.suggested + item.suggestedDeduction,
      );
    } else {
      uniqueProducts.set(product.id, {
        name: product.name,
        unit: product.unit,
        available: product.quantity,
        suggested: item.suggestedDeduction,
      });
    }
  }

  const rows = [...uniqueProducts.entries()];
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      rows.map(([id, row]) => [
        id,
        String(Math.round(row.suggested * 1000) / 1000).replace(".", ","),
      ]),
    ),
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const deductions: Deduction[] = [];
    for (const [id, row] of rows) {
      const raw = (amounts[id] ?? "").replace(",", ".").trim();
      const value = raw === "" ? 0 : Number(raw);

      if (!Number.isFinite(value) || value < 0) {
        setError("Количество должно быть неотрицательным числом.");
        return;
      }
      if (value > row.available) {
        setError(`«${row.name}»: в запасе только ${formatQuantity(row.available, row.unit)}.`);
        return;
      }
      if (value > 0) {
        deductions.push({ productId: id, quantity: value });
      }
    }

    onConfirm(deductions);
  }

  return (
    <Modal
      title="Отметить блюдо приготовленным?"
      description={`«${view.recipe.title}». Проверьте, сколько продуктов списать из запасов.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" form="cook-form">
            Приготовлено
          </Button>
        </>
      }
    >
      <form id="cook-form" onSubmit={handleSubmit} className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm leading-relaxed text-ink-soft">
            Сейчас ни один продукт для этого блюда не найден в запасах. Отметим
            блюдо готовым, не меняя список продуктов.
          </p>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink-soft">
              Можно уменьшить количество или указать 0, если продукт не
              использовали. Продукт с нулевым остатком исчезнет из запасов.
            </p>
            <ul className="space-y-2.5">
              {rows.map(([id, row]) => (
                <li
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted/40 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{row.name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      В запасе: {formatQuantity(row.available, row.unit)}
                    </p>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amounts[id] ?? ""}
                    onChange={(event) => {
                      setAmounts((current) => ({ ...current, [id]: event.target.value }));
                      setError(null);
                    }}
                    aria-label={`Сколько списать: ${row.name}`}
                    className={cn(
                      "h-10 w-20 rounded-lg border border-line bg-surface px-2.5 text-right text-sm focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15",
                      error && "border-danger",
                    )}
                  />
                  <span className="w-6 shrink-0 text-xs text-ink-muted">{row.unit}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {error ? (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        ) : null}

        {view.missing.length > 0 ? (
          <p className="text-[11px] leading-relaxed text-ink-muted">
            Не отслеживаются: {view.missing.map((item) => item.ingredient.label).join(", ")}.
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
