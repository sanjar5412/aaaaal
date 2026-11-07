"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/config/brand";
import { cn } from "@/lib/cn";
import { buildReminders } from "@/lib/domain/reminders";
import { todayISO } from "@/lib/domain/dates";
import { useAppStore } from "@/lib/store/app-store";
import { Button } from "@/components/ui/button";
import {
  BellIcon,
  InfoIcon,
  InventoryIcon,
  LeafIcon,
  LockIcon,
  MenuIcon,
  OverviewIcon,
  PlusIcon,
  AlertIcon,
} from "@/components/ui/icons";
import { useProductDialog } from "@/components/products/product-dialog-provider";

const navigation = [
  { href: "/", label: "Обзор", icon: OverviewIcon },
  { href: "/inventory", label: "Запасы", icon: InventoryIcon },
  { href: "/menu", label: "Меню", icon: MenuIcon },
  { href: "/reminders", label: "Напоминания", icon: BellIcon },
  { href: "/about", label: "О проекте", icon: InfoIcon },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${brand.name} — на главную`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-forest text-cream">
        <LeafIcon size={17} />
      </span>
      <span className="font-serif text-[19px] font-medium tracking-[-0.01em] text-ink">
        {brand.name}
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, ready, storageError } = useAppStore();
  const { openCreate } = useProductDialog();

  const reminderCount = state
    ? buildReminders(
        state.products,
        state.dismissals,
        state.settings.warningDays,
        todayISO(),
      ).length
    : 0;

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-sm focus:text-cream"
      >
        К содержимому
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-canvas px-5 py-6 lg:flex">
        <Wordmark />

        <nav className="mt-10" aria-label="Основная навигация">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-forest font-medium text-cream"
                        : "text-ink-soft hover:bg-surface hover:text-ink",
                    )}
                  >
                    <Icon size={18} className={active ? "text-cream/85" : "text-ink-muted"} />
                    <span className="flex-1">{item.label}</span>
                    {item.href === "/reminders" && reminderCount > 0 ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                          active
                            ? "bg-cream/15 text-cream"
                            : "bg-amber-tint text-amber",
                        )}
                      >
                        {reminderCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto space-y-4 pt-8">
          <div className="rounded-2xl border border-line bg-surface/70 p-4">
            <div className="flex items-center gap-2 text-forest">
              <LockIcon size={14} />
              <p className="text-xs font-medium">Данные остаются у вас</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
              MVP хранит запасы в локальном хранилище браузера.
            </p>
            <Link href="/about#data" className="link-quiet mt-2 text-xs">
              Подробнее
            </Link>
          </div>
          <p className="px-1 text-[10px] uppercase tracking-[0.14em] text-ink-muted/80">
            {brand.event} · MVP
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur lg:hidden">
        <Wordmark />
        <Button
          variant="primary"
          size="icon"
          onClick={openCreate}
          aria-label="Добавить продукт"
        >
          <PlusIcon size={18} />
        </Button>
      </header>

      <main id="main" className="lg:pl-[248px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          {storageError ? (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber/25 bg-amber-tint px-4 py-3 text-xs leading-relaxed text-amber"
            >
              <AlertIcon size={15} className="mt-0.5 shrink-0" />
              <p>{storageError}</p>
            </div>
          ) : null}
          {ready && state ? children : <PageSkeleton />}
        </div>
      </main>

      <nav
        aria-label="Мобильная навигация"
        className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between gap-0.5 rounded-2xl border border-line bg-surface/95 p-1 shadow-[0_10px_30px_-14px_rgba(30,42,34,0.4)] backdrop-blur">
          {navigation.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] transition-colors",
                    active
                      ? "bg-forest-tint font-medium text-forest-dark"
                      : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                  )}
                >
                  <Icon size={19} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Загрузка данных">
      <div className="space-y-3">
        <div className="h-2.5 w-28 rounded-full bg-canvas-deep" />
        <div className="h-8 w-72 max-w-full rounded-lg bg-canvas-deep" />
        <div className="h-3 w-96 max-w-full rounded-full bg-canvas-deep" />
      </div>
      <div className="h-28 rounded-2xl border border-line bg-surface" />
      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          <div className="h-72 rounded-2xl border border-line bg-surface" />
          <div className="h-56 rounded-2xl border border-line bg-surface" />
        </div>
        <div className="space-y-6">
          <div className="h-64 rounded-2xl border border-line bg-surface" />
          <div className="h-48 rounded-2xl border border-line bg-surface" />
        </div>
      </div>
      <span className="sr-only">Загружаем данные из локального хранилища…</span>
    </div>
  );
}
