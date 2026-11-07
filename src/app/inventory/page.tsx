"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { inputClass } from "@/components/ui/field";
import { PlusIcon, SearchIcon, InventoryIcon, XIcon } from "@/components/ui/icons";
import { ProductRow } from "@/components/inventory/product-row";
import { useProductDialog } from "@/components/products/product-dialog-provider";
import { useToast } from "@/components/ui/toast";
import { useAppStore } from "@/lib/store/app-store";
import { todayISO } from "@/lib/domain/dates";
import {
  CATEGORIES,
  LOCATION_LABELS,
  LOCATIONS,
} from "@/lib/domain/constants";
import {
  countByStatus,
  EMPTY_FILTERS,
  filterProducts,
  getProductStatus,
  hasActiveFilters,
  type ProductFilters,
  type StatusFilter,
} from "@/lib/domain/products";
import type { Category, Location, Product } from "@/lib/domain/types";
import { cn } from "@/lib/cn";

const TABS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Все продукты" },
  { value: "soon", label: "Скоро истекает" },
  { value: "expired", label: "Просрочено" },
];

export default function InventoryPage() {
  const { state, actions } = useAppStore();
  const { openCreate, openEdit } = useProductDialog();
  const { show } = useToast();

  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const today = todayISO();

  const visible = useMemo(() => {
    if (!state) return [];
    return filterProducts(state.products, filters, state.settings.warningDays, today);
  }, [state, filters, today]);

  if (!state) return null;

  const warningDays = state.settings.warningDays;
  const counts = countByStatus(state.products, warningDays, today);
  const active = hasActiveFilters(filters);

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
  }

  function markUsed(product: Product) {
    const expired =
      getProductStatus(product, warningDays, today).status === "expired";
    actions.markUsed(product.id);
    show(
      expired
        ? `«${product.name}» списан из запасов`
        : `«${product.name}» отмечен использованным`,
      expired ? "info" : "success",
    );
  }

  function confirmDelete() {
    if (!deleting) return;
    actions.deleteProduct(deleting.id);
    show(`«${deleting.name}» удалён из запасов`, "info");
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Запасы"
        title="Что есть дома"
        description={
          state.products.length === 0
            ? "Пока пусто. Добавьте первый продукт — дальше всё будет под контролем."
            : `${counts.all} ${counts.all === 1 ? "продукт" : "продуктов"} · ${counts.soon} скоро истекают · ${counts.expired} просрочено`
        }
        actions={
          <Button onClick={openCreate}>
            <PlusIcon size={17} />
            Добавить продукт
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            value={filters.query}
            onChange={(event) =>
              setFilters((current) => ({ ...current, query: event.target.value }))
            }
            placeholder="Найти продукт по названию"
            aria-label="Поиск по названию продукта"
            className={inputClass(false, "pl-10")}
          />
        </div>
        <select
          value={filters.category}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              category: event.target.value as Category | "all",
            }))
          }
          aria-label="Фильтр по категории"
          className={inputClass(false, "sm:w-[190px]")}
        >
          <option value="all">Все категории</option>
          {CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        <select
          value={filters.location}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              location: event.target.value as Location | "all",
            }))
          }
          aria-label="Фильтр по месту хранения"
          className={inputClass(false, "sm:w-[184px]")}
        >
          <option value="all">Везде</option>
          {LOCATIONS.map((location) => (
            <option key={location.value} value={location.value}>
              {LOCATION_LABELS[location.value]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Фильтр по сроку">
          {TABS.map((tab) => {
            const selected = filters.status === tab.value;
            const tabCount =
              tab.value === "all"
                ? counts.all
                : tab.value === "soon"
                  ? counts.soon
                  : counts.expired;
            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  setFilters((current) => ({ ...current, status: tab.value }))
                }
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
                  selected
                    ? "border-forest bg-forest text-cream"
                    : "border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-surface-muted",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] leading-4",
                    selected ? "bg-cream/15 text-cream/90" : "bg-surface-muted text-ink-muted",
                  )}
                >
                  {tabCount}
                </span>
              </button>
            );
          })}
        </div>

        {active ? (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <XIcon size={13} />
            Сбросить фильтры
          </button>
        ) : null}
      </div>

      <Panel className="overflow-hidden">
        {state.products.length === 0 ? (
          <EmptyState
            icon={<InventoryIcon size={22} />}
            title="Холодильник и кладовая пусты"
            description="Добавьте продукты, которые уже есть дома. Мы посчитаем сроки и предложим меню."
            action={
              <Button onClick={openCreate}>
                <PlusIcon size={16} />
                Добавить первый продукт
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<SearchIcon size={22} />}
            title="Ничего не найдено"
            description="Попробуйте изменить запрос или сбросить фильтры — в запасах есть другие продукты."
            action={
              <Button variant="secondary" onClick={resetFilters}>
                Сбросить фильтры
              </Button>
            }
          />
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,2.6fr)_0.7fr_1fr_1.15fr_1.05fr_auto] gap-5 border-b border-line bg-surface-muted/50 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted lg:grid">
              <span>Продукт</span>
              <span>Количество</span>
              <span>Место</span>
              <span>Срок</span>
              <span>Статус</span>
              <span className="sr-only">Действия</span>
            </div>
            <ul className="divide-y divide-line">
              {visible.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  warningDays={warningDays}
                  today={today}
                  onEdit={openEdit}
                  onMarkUsed={markUsed}
                  onDelete={setDeleting}
                />
              ))}
            </ul>
            <div className="border-t border-line px-5 py-3 text-xs text-ink-muted">
              Показано {visible.length} из {state.products.length}
              {filters.query.trim() ? ` · по запросу «${filters.query.trim()}»` : ""}
            </div>
          </>
        )}
      </Panel>

      <p className="px-1 text-xs leading-relaxed text-ink-muted">
        Статус считается автоматически по сроку годности. Отметка
        «использовано» убирает продукт из запасов и учитывается в сводке
        предотвращённых отходов.
      </p>

      {deleting ? (
        <ConfirmDialog
          title="Удалить продукт?"
          description={`«${deleting.name}» исчезнет из запасов. Это действие нельзя отменить.`}
          confirmLabel="Удалить"
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}
