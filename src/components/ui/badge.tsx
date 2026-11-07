import { cn } from "@/lib/cn";
import { CATEGORY_DOTS, CATEGORY_LABELS } from "@/lib/domain/constants";
import type { Category, ProductStatus } from "@/lib/domain/types";

const tones: Record<ProductStatus, string> = {
  fresh: "bg-forest-tint text-forest-dark",
  soon: "bg-amber-tint text-amber",
  expired: "bg-danger-tint text-danger",
};

const dots: Record<ProductStatus, string> = {
  fresh: "bg-[#4f7a58]",
  soon: "bg-[#b07a1e]",
  expired: "bg-[#b0453a]",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: ProductStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-medium leading-none",
        tones[status],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status])} aria-hidden="true" />
      {label}
    </span>
  );
}

export function CategoryDot({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: CATEGORY_DOTS[category] }}
      title={CATEGORY_LABELS[category]}
      aria-hidden="true"
    />
  );
}

export function NeutralBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-ink-soft",
        className,
      )}
    >
      {children}
    </span>
  );
}
