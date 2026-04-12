import { getAllBundledItems } from "./content";
import type { AppContent, AppState, ItemProgress, StudyDifficulty, TrackId } from "./types";
import { localDateString } from "./srs";

export interface ScheduledEntry {
  trackId: TrackId;
  trackLabel: string;
  topicId: string;
  topicTitle: string;
  dueDate: string | null;
  isDueToday: boolean;
  isOverdue: boolean;
  completionCount: number;
  progress: ItemProgress;
  itemId: string;
  itemTitle: string;
  itemDifficulty?: StudyDifficulty;
  itemHref: string | null;
}

export function collectScheduledEntries(state: AppState, content: AppContent, now: Date = new Date()): ScheduledEntry[] {
  const today = localDateString(now);
  const out: ScheduledEntry[] = getAllBundledItems(content).map(({ trackId, trackLabel, groupId, groupTitle, itemHref, item }) => {
    const progress = state.progress[item.id] ?? {
      itemId: item.id,
      completionCount: 0,
      lastCompletedAt: null,
      nextDueDate: null,
      completionHistory: [],
    };
    const dueDate = progress.nextDueDate;
    return {
      trackId,
      trackLabel,
      topicId: groupId,
      topicTitle: groupTitle,
      dueDate,
      isDueToday: dueDate === today,
      isOverdue: dueDate !== null && dueDate < today,
      completionCount: progress.completionCount,
      progress,
      itemId: item.id,
      itemTitle: item.title,
      itemDifficulty: item.difficulty,
      itemHref,
    };
  });

  return out.sort((a, b) => {
    const left = a.dueDate ?? "9999-12-31";
    const right = b.dueDate ?? "9999-12-31";
    return left.localeCompare(right) || a.itemTitle.localeCompare(b.itemTitle);
  });
}

export function collectDue(state: AppState, content: AppContent, now: Date = new Date()): ScheduledEntry[] {
  const today = localDateString(now);
  return collectScheduledEntries(state, content, now).filter((entry) => entry.dueDate !== null && entry.dueDate <= today);
}
