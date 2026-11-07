import type { ActivityEntry } from "./types";

export interface ImpactSummary {
  savedItems: number;
  savedValue: number;
  discardedItems: number;
  hasDemoEntries: boolean;
}

/** Считаем только продукты, использованные до истечения срока. */
export function summarizeImpact(activity: readonly ActivityEntry[]): ImpactSummary {
  const saved = activity.filter(
    (entry) => entry.kind === "used" || entry.kind === "cooked",
  );

  return {
    savedItems: saved.length,
    savedValue: saved.reduce((sum, entry) => sum + entry.estimate, 0),
    discardedItems: activity.filter((entry) => entry.kind === "discarded").length,
    hasDemoEntries: activity.some((entry) => entry.source === "demo"),
  };
}
