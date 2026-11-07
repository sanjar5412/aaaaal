"use client";

import { formatQuantity } from "@/lib/domain/format";
import { formatDate } from "@/lib/domain/dates";
import { LOCATION_LABELS, CATEGORY_LABELS } from "@/lib/domain/constants";
import { getProductStatus } from "@/lib/domain/products";
import type { Product } from "@/lib/domain/types";
import { CategoryDot, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon, PencilIcon, TrashIcon } from "@/components/ui/icons";

export function ProductRow({
  product,
  warningDays,
  today,
  onEdit,
  onMarkUsed,
  onDelete,
}: {
  product: Product;
  warningDays: number;
  today: string;
  onEdit: (product: Product) => void;
  onMarkUsed: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const status = getProductStatus(product, warningDays, today);

  return (
    <li className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-surface-muted/35 sm:px-5 lg:grid lg:grid-cols-[minmax(0,2.6fr)_0.7fr_1fr_1.15fr_1.05fr_auto] lg:items-center lg:gap-5">
      <div className="flex items-start justify-between gap-3 lg:block">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{product.name}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
            <CategoryDot category={product.category} />
            {CATEGORY_LABELS[product.category]}
            {product.note ? (
              <span className="hidden truncate lg:inline">· {product.note}</span>
            ) : null}
          </p>
        </div>
        <StatusBadge
          status={status.status}
          label={status.shortLabel}
          className="lg:hidden"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft lg:contents">
        <div>
          <span className="text-ink-muted lg:hidden">Кол-во: </span>
          {formatQuantity(product.quantity, product.unit)}
        </div>
        <div>
          <span className="text-ink-muted lg:hidden">Место: </span>
          {LOCATION_LABELS[product.location]}
        </div>
        <div>
          <span className="text-ink-muted lg:hidden">Срок: </span>
          {formatDate(product.expiresAt)}
        </div>
      </div>

      <StatusBadge
        status={status.status}
        label={status.shortLabel}
        className="hidden lg:inline-flex lg:justify-self-start"
      />

      <div className="flex items-center justify-end gap-0.5 lg:justify-end">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onMarkUsed(product)}
          aria-label={`Отметить «${product.name}» использованным`}
          title="Использовано"
          className="text-ink-muted hover:text-forest"
        >
          <CheckIcon size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(product)}
          aria-label={`Редактировать «${product.name}»`}
          title="Редактировать"
          className="text-ink-muted hover:text-ink"
        >
          <PencilIcon size={15} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(product)}
          aria-label={`Удалить «${product.name}»`}
          title="Удалить"
          className="text-ink-muted hover:text-danger"
        >
          <TrashIcon size={16} />
        </Button>
      </div>
    </li>
  );
}
