const MS_PER_DAY = 86_400_000;

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Строгий разбор YYYY-MM-DD без сдвигов часового пояса. */
export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900 || year > 2200) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function utcMillis(iso: string): number | null {
  const date = parseISODate(iso);
  if (!date) return null;
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Количество календарных дней до даты; отрицательное значение — просрочка. */
export function daysUntil(iso: string, from: string = todayISO()): number {
  const target = utcMillis(iso);
  const base = utcMillis(from);
  if (target === null || base === null) return Number.NaN;
  return Math.round((target - base) / MS_PER_DAY);
}

export function addDays(iso: string, amount: number): string {
  const date = parseISODate(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

const longDate = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
});
const shortDate = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});
const weekdayLong = new Intl.DateTimeFormat("ru-RU", { weekday: "long" });
const fullDate = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function formatDate(iso: string, style: "long" | "short" = "long"): string {
  const date = parseISODate(iso);
  if (!date) return iso;

  if (date.getFullYear() !== new Date().getFullYear()) {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: style === "long" ? "long" : "short",
      year: "numeric",
    }).format(date);
  }
  return (style === "long" ? longDate : shortDate).format(date);
}

/** «пятница, 7 ноября» */
export function formatFullDate(iso: string): string {
  const date = parseISODate(iso);
  return date ? fullDate.format(date) : iso;
}

export function formatWeekday(iso: string): string {
  const date = parseISODate(iso);
  return date ? weekdayLong.format(date) : iso;
}

/** Заголовок дня плана: «Сегодня», «Завтра» или день недели. */
export function dayTitle(iso: string, today: string = todayISO()): string {
  const diff = daysUntil(iso, today);
  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Завтра";
  return capitalize(formatWeekday(iso));
}

export function formatDateRange(start: string, days: number): string {
  if (days <= 1) return formatDate(start);

  const end = addDays(start, days - 1);
  const startDate = parseISODate(start);
  const endDate = parseISODate(end);
  if (!startDate || !endDate) return `${formatDate(start)} — ${formatDate(end)}`;

  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return `${startDate.getDate()}–${formatDate(end, "long")}`;
  }

  return `${formatDate(start, "short")} — ${formatDate(end)}`;
}

export function plural(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function countLabel(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  return `${count} ${plural(count, one, few, many)}`;
}

export function capitalize(value: string): string {
  if (!value) return value;
  return value[0].toUpperCase() + value.slice(1);
}

export function formatTimeAgo(isoDateTime: string, now: Date = new Date()): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return "";

  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (diffMinutes < 1) return "только что";
  if (diffMinutes < 60) return `${diffMinutes} мин назад`;
  if (diffMinutes < 24 * 60) return `${Math.floor(diffMinutes / 60)} ч назад`;
  if (diffMinutes < 48 * 60) return "вчера";
  return formatDate(toISODate(date));
}
