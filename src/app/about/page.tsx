"use client";

import Link from "next/link";
import { useState } from "react";
import { brand } from "@/config/brand";
import { PageHeader, PanelHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ArrowRightIcon,
  DownloadIcon,
  InventoryIcon,
  LeafIcon,
  LockIcon,
  MenuIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
  ClockIcon,
} from "@/components/ui/icons";
import { useProductDialog } from "@/components/products/product-dialog-provider";
import { useToast } from "@/components/ui/toast";
import { useAppStore } from "@/lib/store/app-store";
import { hasDemoContent } from "@/lib/domain/mutations";
import { summarizeImpact } from "@/lib/domain/impact";
import { formatMoney } from "@/lib/domain/format";
import { todayISO } from "@/lib/domain/dates";

type ConfirmKind = "clear" | "demo" | "load" | null;

const PRINCIPLES = [
  {
    title: "Сроки на виду",
    text: "Цвет и подпись показывают, что пора готовить. Без таблиц и ручных подсчётов.",
  },
  {
    title: "Меню из того, что есть",
    text: "План на день, три дня или неделю — с приоритетом продуктов, которые скоро истекут.",
  },
  {
    title: "Покупки осознаннее",
    text: "Недостающие ингредиенты собраны в один список, а лишнее не покупается повторно.",
  },
];

const STEPS = [
  "Добавьте продукты из холодильника, морозилки и кладовой.",
  "Приложение само отметит то, что пора использовать в первую очередь.",
  "Соберите меню и спишите продукты, когда блюдо готово.",
];

export default function AboutPage() {
  const { state, actions, storageAvailable } = useAppStore();
  const { openCreate } = useProductDialog();
  const { show } = useToast();
  const [confirm, setConfirm] = useState<ConfirmKind>(null);

  if (!state) return null;

  const impact = summarizeImpact(state.activity);
  const demoCount = state.products.filter((product) => product.source === "demo").length;
  const demo = hasDemoContent(state);

  function downloadBackup() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `freshloop-backup-${todayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    show("Копия данных скачана");
  }

  function handleConfirm() {
    if (confirm === "clear") {
      actions.clearAllData();
      show("Все данные удалены", "info");
    }
    if (confirm === "demo") {
      actions.removeDemoData();
      show("Демо-данные удалены", "info");
    }
    if (confirm === "load") {
      actions.loadDemoData();
      show("Демо-данные загружены");
    }
    setConfirm(null);
  }

  const confirmCopy: Record<Exclude<ConfirmKind, null>, { title: string; description: string; label: string; tone: "danger" | "primary" }> = {
    clear: {
      title: "Очистить все данные?",
      description:
        "Будут удалены продукты, меню, напоминания и история. Настройка срока предупреждения сохранится.",
      label: "Очистить всё",
      tone: "danger",
    },
    demo: {
      title: "Удалить демо-данные?",
      description:
        "Исчезнут только продукты, история и меню из демо-набора. Всё, что вы добавили сами, останется.",
      label: "Удалить демо",
      tone: "danger",
    },
    load: {
      title: "Загрузить демо-данные?",
      description:
        "Текущие запасы, меню и история будут заменены демонстрационным набором.",
      label: "Загрузить демо",
      tone: "primary",
    },
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="О проекте"
        title="Спокойный способ не выбрасывать еду"
        description={`${brand.name} — MVP для домохозяйств: помогает помнить о продуктах, планировать меню и покупать меньше лишнего.`}
      />

      <section className="rounded-3xl bg-forest px-6 py-8 text-cream sm:px-10 sm:py-10">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
          <LeafIcon size={14} />
          {brand.tagline}
        </p>
        <h2 className="mt-4 max-w-2xl font-serif text-[28px] leading-[1.15] tracking-[-0.015em] sm:text-[34px]">
          Хорошая еда не должна попадать в мусор.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/80">
          Чаще всего продукты выбрасывают не из-за небрежности, а потому что о
          них забыли. {brand.name} переносит внимание с «что купить» на «что уже
          есть» — и превращает остатки в понятный план.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button
            onClick={openCreate}
            className="bg-cream text-forest-dark hover:bg-white"
          >
            <PlusIcon size={16} />
            Добавить продукт
          </Button>
          <Link href="/inventory" className={buttonStyles("secondary", "md")}>
            Открыть запасы
            <ArrowRightIcon size={15} />
          </Link>
        </div>
      </section>

      <section aria-labelledby="principles">
        <h2 id="principles" className="font-serif text-[22px] tracking-[-0.01em]">
          Что даёт продукт
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {PRINCIPLES.map((principle, index) => (
            <article
              key={principle.title}
              className="rounded-2xl border border-line bg-surface p-5"
            >
              <span className="font-serif text-sm text-clay">
                0{index + 1}
              </span>
              <h3 className="mt-2 font-serif text-[18px] leading-snug">
                {principle.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                {principle.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <Panel>
        <PanelHeader
          title="Как это работает"
          hint="Три шага без сложных настроек"
        />
        <ol className="divide-y divide-line">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-4 px-5 py-4 sm:px-6">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-tint font-serif text-[13px] text-forest-dark">
                {index + 1}
              </span>
              <p className="pt-0.5 text-sm leading-relaxed text-ink-soft">{step}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-4 border-t border-line px-5 py-4 text-xs text-ink-muted sm:px-6">
          <span className="inline-flex items-center gap-1.5">
            <InventoryIcon size={14} /> {state.products.length} продуктов
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MenuIcon size={14} /> {state.menu?.meals.length ?? 0} блюд в плане
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon size={14} /> предупреждение за {state.settings.warningDays}{" "}
            дн.
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LeafIcon size={14} /> {impact.savedItems} спасено ·{" "}
            {formatMoney(impact.savedValue)} (демо)
          </span>
        </div>
      </Panel>

      <Panel>
        <div id="data" className="scroll-mt-24">
          <PanelHeader
            title="Данные и приватность"
            hint="Честно о том, как устроен MVP"
          />
          <div className="space-y-4 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3 rounded-xl bg-forest-tint/70 px-4 py-3">
              <LockIcon size={16} className="mt-0.5 shrink-0 text-forest" />
              <div className="text-[13px] leading-relaxed text-ink-soft">
                <p className="font-medium text-ink">
                  Данные хранятся в этом браузере
                </p>
                <p className="mt-1">
                  Запасы, меню, настройки и история записываются в{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[11px]">
                    localStorage
                  </code>{" "}
                  и не отправляются на сервер. Это осознанный MVP-вариант, а не
                  полноценный бэкенд: синхронизации между устройствами, аккаунтов
                  и восстановления на сервере нет.
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Продуктов", value: state.products.length },
                { label: "Демо-продуктов", value: demoCount },
                { label: "Записей истории", value: state.activity.length },
                { label: "Напоминаний выполнено", value: state.dismissals.length },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-line bg-surface-muted/40 px-3.5 py-3"
                >
                  <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                    {item.label}
                  </dt>
                  <dd className="mt-1 font-serif text-xl leading-none text-ink">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            {!storageAvailable ? (
              <p className="rounded-xl border border-amber/25 bg-amber-tint px-3.5 py-2.5 text-xs leading-relaxed text-amber">
                Браузер не даёт доступ к локальному хранилищу. Приложение
                работает, но изменения пропадут после перезагрузки.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={downloadBackup}>
                <DownloadIcon size={14} />
                Скачать копию данных
              </Button>
              {demo ? (
                <Button
                  variant="danger-ghost"
                  size="sm"
                  onClick={() => setConfirm("demo")}
                >
                  <TrashIcon size={14} />
                  Удалить демо-данные
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirm("load")}
                >
                  <RefreshIcon size={14} />
                  Загрузить демо-данные
                </Button>
              )}
              <Button
                variant="danger-ghost"
                size="sm"
                onClick={() => setConfirm("clear")}
              >
                <TrashIcon size={14} />
                Очистить всё
              </Button>
            </div>

            <p className="text-[11px] leading-relaxed text-ink-muted">
              Резервная копия — это JSON-файл с вашими данными. Импорт в этом MVP
              не предусмотрен. Оценка сэкономленных средств считается по
              демо-прайсу и не является финансовым отчётом.
            </p>
          </div>
        </div>
      </Panel>

      <section className="rounded-2xl border border-line bg-surface/60 p-5 sm:p-6">
        <h2 className="font-serif text-lg">Ограничения MVP</h2>
        <ul className="mt-3 grid gap-2 text-[13px] leading-relaxed text-ink-muted sm:grid-cols-2">
          <li>· Нет аккаунтов и синхронизации между устройствами.</li>
          <li>· Нет push- и e-mail-уведомлений.</li>
          <li>· Меню собирается локальным алгоритмом, без внешнего ИИ.</li>
          <li>· Цены и «предотвращённые отходы» — демо-оценка.</li>
        </ul>
      </section>

      <footer className="border-t border-line pt-5 text-xs leading-relaxed text-ink-muted">
        <p>
          {brand.name} · MVP для {brand.event}. Название и описание продукта
          задаются в одном месте —{" "}
          <code className="rounded bg-surface-muted px-1 py-0.5 text-[11px]">
            src/config/brand.ts
          </code>
          .
        </p>
      </footer>

      {confirm ? (
        <ConfirmDialog
          title={confirmCopy[confirm].title}
          description={confirmCopy[confirm].description}
          confirmLabel={confirmCopy[confirm].label}
          tone={confirmCopy[confirm].tone}
          onConfirm={handleConfirm}
          onClose={() => setConfirm(null)}
        />
      ) : null}
    </div>
  );
}
