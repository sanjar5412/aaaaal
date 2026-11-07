"use client";

import { useState } from "react";
import { addDays, todayISO } from "@/lib/domain/dates";
import {
  CATEGORIES,
  COMMON_PRODUCTS,
  LOCATIONS,
  UNITS,
} from "@/lib/domain/constants";
import type { Category, Location, Product, Unit } from "@/lib/domain/types";
import {
  hasErrors,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormValues,
} from "@/lib/domain/validation";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import Field, { inputClass } from "@/components/ui/field";
import {
  AlertIcon,
  FridgeIcon,
  PantryIcon,
  PlusIcon,
  SnowflakeIcon,
} from "@/components/ui/icons";

const LOCATION_ICONS = {
  fridge: FridgeIcon,
  freezer: SnowflakeIcon,
  pantry: PantryIcon,
} as const;

const FIELD_ORDER: ReadonlyArray<keyof ProductFormValues> = [
  "name",
  "category",
  "quantity",
  "unit",
  "purchasedAt",
  "expiresAt",
  "location",
  "note",
];

function initialValues(product?: Product): ProductFormValues {
  if (product) {
    return {
      name: product.name,
      category: product.category,
      quantity: String(product.quantity).replace(".", ","),
      unit: product.unit,
      expiresAt: product.expiresAt,
      purchasedAt: product.purchasedAt ?? "",
      location: product.location,
      note: product.note ?? "",
    };
  }

  return {
    name: "",
    category: "vegetables",
    quantity: "1",
    unit: "шт",
    expiresAt: addDays(todayISO(), 5),
    purchasedAt: "",
    location: "fridge",
    note: "",
  };
}

export function ProductFormDialog({
  product,
  onClose,
}: {
  product?: Product;
  onClose: () => void;
}) {
  const { actions } = useAppStore();
  const { show } = useToast();
  const formId = "product-form";
  const today = todayISO();

  const [values, setValues] = useState<ProductFormValues>(() => initialValues(product));
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const editing = Boolean(product);

  function update<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function applyPreset(index: number) {
    const preset = COMMON_PRODUCTS[index];
    setValues((current) => ({
      ...current,
      name: preset.name,
      category: preset.category,
      quantity: String(preset.quantity),
      unit: preset.unit,
      location: preset.location,
      expiresAt: addDays(today, preset.shelfLifeDays),
    }));
    setErrors({});
  }

  function focusFirstError(nextErrors: ProductFormErrors) {
    const first = FIELD_ORDER.find((field) => nextErrors[field]);
    if (!first) return;
    const id =
      first === "expiresAt"
        ? "product-expires"
        : first === "purchasedAt"
          ? "product-purchased"
          : first === "name"
            ? "product-name"
            : first === "quantity"
              ? "product-quantity"
              : first === "category"
                ? "product-category"
                : first === "unit"
                  ? "product-unit"
                  : first === "location"
                    ? "product-location"
                    : "product-note";
    document.getElementById(id)?.focus();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateProductForm(values, today);
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    const quantity = Number(values.quantity.replace(",", "."));
    setSubmitting(true);

    const input = {
      name: values.name.trim(),
      category: values.category,
      quantity,
      unit: values.unit,
      expiresAt: values.expiresAt,
      purchasedAt: values.purchasedAt || undefined,
      location: values.location,
      note: values.note.trim() || undefined,
    };

    if (product) {
      actions.updateProduct(product.id, input);
      show(`«${input.name}» обновлён`);
    } else {
      actions.addProduct(input);
      show(`«${input.name}» добавлен в запасы`);
    }
    onClose();
  }

  const showExpiredWarning =
    Boolean(values.expiresAt) && values.expiresAt < today && !errors.expiresAt;

  return (
    <Modal
      title={editing ? "Редактировать продукт" : "Добавить продукт"}
      description={
        editing
          ? "Измените количество, срок или место хранения."
          : "Запишите то, что уже есть дома — мы напомним, когда пора использовать."
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            {editing ? "Сохранить" : "Добавить продукт"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        {!editing ? (
          <div>
            <p className="mb-2 text-xs font-medium text-ink-soft">Часто добавляют</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_PRODUCTS.map((preset, index) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(index)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs transition-colors",
                    values.name === preset.name
                      ? "border-forest/35 bg-forest-tint text-forest-dark"
                      : "border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-surface-muted",
                  )}
                >
                  <PlusIcon size={12} />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {hasErrors(errors) ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-tint px-3.5 py-2.5 text-xs leading-relaxed text-danger"
          >
            <AlertIcon size={14} className="mt-0.5 shrink-0" />
            Проверьте отмеченные поля — без них продукт не сохранится.
          </p>
        ) : null}

        <Field label="Название" htmlFor="product-name" error={errors.name} required>
          <input
            id="product-name"
            name="name"
            data-autofocus
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Например, греческий йогурт"
            maxLength={60}
            autoComplete="off"
            className={inputClass(Boolean(errors.name))}
            aria-invalid={Boolean(errors.name) || undefined}
            aria-describedby={errors.name ? "product-name-error" : undefined}
          />
        </Field>

        <Field label="Категория" htmlFor="product-category" error={errors.category} required>
          <select
            id="product-category"
            name="category"
            value={values.category}
            onChange={(event) => update("category", event.target.value as Category)}
            className={inputClass(Boolean(errors.category))}
            aria-invalid={Boolean(errors.category) || undefined}
          >
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-3">
          <Field label="Количество" htmlFor="product-quantity" error={errors.quantity} required>
            <input
              id="product-quantity"
              name="quantity"
              type="text"
              inputMode="decimal"
              value={values.quantity}
              onChange={(event) => update("quantity", event.target.value)}
              className={inputClass(Boolean(errors.quantity))}
              aria-invalid={Boolean(errors.quantity) || undefined}
            />
          </Field>
          <Field label="Единица" htmlFor="product-unit" error={errors.unit} required>
            <select
              id="product-unit"
              name="unit"
              value={values.unit}
              onChange={(event) => update("unit", event.target.value as Unit)}
              className={inputClass(Boolean(errors.unit))}
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Дата покупки"
            htmlFor="product-purchased"
            error={errors.purchasedAt}
            hint="Если не помните — оставьте пустым."
          >
            <input
              id="product-purchased"
              name="purchasedAt"
              type="date"
              max={today}
              value={values.purchasedAt}
              onChange={(event) => update("purchasedAt", event.target.value)}
              className={inputClass(Boolean(errors.purchasedAt))}
              aria-invalid={Boolean(errors.purchasedAt) || undefined}
            />
          </Field>
          <Field label="Срок годности" htmlFor="product-expires" error={errors.expiresAt} required>
            <input
              id="product-expires"
              name="expiresAt"
              type="date"
              value={values.expiresAt}
              onChange={(event) => update("expiresAt", event.target.value)}
              className={inputClass(Boolean(errors.expiresAt))}
              aria-invalid={Boolean(errors.expiresAt) || undefined}
            />
          </Field>
        </div>

        {showExpiredWarning ? (
          <p className="flex items-start gap-2 rounded-xl bg-amber-tint px-3.5 py-2.5 text-xs leading-relaxed text-amber">
            <AlertIcon size={14} className="mt-0.5 shrink-0" />
            Срок уже прошёл — продукт сохранится, но попадёт в просроченные.
          </p>
        ) : null}

        <fieldset>
          <legend className="field-label">
            Место хранения
            <span className="ml-1 text-clay" aria-hidden="true">
              *
            </span>
          </legend>
          <div className="grid grid-cols-3 gap-2" aria-describedby={errors.location ? "product-location-error" : undefined}>
            {LOCATIONS.map((location) => {
              const Icon = LOCATION_ICONS[location.value as Location];
              const active = values.location === location.value;
              return (
                <button
                  key={location.value}
                  type="button"
                  id={location.value === values.location ? "product-location" : undefined}
                  aria-pressed={active}
                  onClick={() => update("location", location.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs transition-colors",
                    active
                      ? "border-forest/40 bg-forest-tint font-medium text-forest-dark"
                      : "border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-surface-muted",
                  )}
                >
                  <Icon size={17} />
                  {location.label}
                </button>
              );
            })}
          </div>
          {errors.location ? (
            <p id="product-location-error" className="mt-1.5 text-xs text-danger">
              {errors.location}
            </p>
          ) : null}
        </fieldset>

        <Field
          label="Заметка"
          htmlFor="product-note"
          error={errors.note}
          hint="Например: открыто вчера, купить ещё одну упаковку."
        >
          <textarea
            id="product-note"
            name="note"
            rows={2}
            maxLength={160}
            value={values.note}
            onChange={(event) => update("note", event.target.value)}
            placeholder="Дополнительная деталь"
            className={cn("input h-auto min-h-[64px] resize-y py-2.5", errors.note && "input-invalid")}
            aria-invalid={Boolean(errors.note) || undefined}
          />
        </Field>
      </form>
    </Modal>
  );
}
