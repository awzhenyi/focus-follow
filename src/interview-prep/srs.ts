import type { ItemProgress } from "./types";

export const REVISIT_LADDER_DAYS = [3, 7, 14, 30] as const;

export function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysFromToday(todayYmd: string, days: number): string {
  const [y, m, d] = todayYmd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return localDateString(dt);
}

function nextIntervalDays(completionCount: number): number {
  const index = Math.max(0, Math.min(completionCount - 1, REVISIT_LADDER_DAYS.length - 1));
  return REVISIT_LADDER_DAYS[index]!;
}

function progressFromHistory(itemId: string, completionHistory: string[]): ItemProgress {
  if (completionHistory.length === 0) {
    return {
      itemId,
      completionCount: 0,
      lastCompletedAt: null,
      nextDueDate: null,
      completionHistory: [],
    };
  }

  const lastCompletedAt = completionHistory[completionHistory.length - 1]!;
  const completedOn = localDateString(new Date(lastCompletedAt));
  return {
    itemId,
    completionCount: completionHistory.length,
    lastCompletedAt,
    nextDueDate: addDaysFromToday(completedOn, nextIntervalDays(completionHistory.length)),
    completionHistory,
  };
}

export function isDue(progress: ItemProgress | undefined, now: Date = new Date()): boolean {
  const today = localDateString(now);
  return !progress?.nextDueDate || progress.nextDueDate <= today;
}

export function toggleCompletion(itemId: string, progress: ItemProgress | undefined, now: Date = new Date()): ItemProgress {
  const current = progress ?? {
    itemId,
    completionCount: 0,
    lastCompletedAt: null,
    nextDueDate: null,
    completionHistory: [],
  };

  // If the item is currently in a completed state for this stage, allow one-click rollback.
  if (current.completionHistory.length > 0 && !isDue(current, now)) {
    return progressFromHistory(itemId, current.completionHistory.slice(0, -1));
  }

  const nextHistory = [...current.completionHistory, now.toISOString()];
  return progressFromHistory(itemId, nextHistory);
}
