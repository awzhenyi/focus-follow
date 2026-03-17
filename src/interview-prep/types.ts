export const TRACK_IDS = ["leetcode", "hld", "lld"] as const;
export type TrackId = (typeof TRACK_IDS)[number];

export const TRACK_LABELS: Record<TrackId, string> = {
  leetcode: "LeetCode",
  hld: "High-level System Design",
  lld: "Low-level System Design",
};

export interface StaticStudyItemDefinition {
  id: string;
  title: string;
}

export interface StaticTopicGroupDefinition {
  id: string;
  title: string;
  items: StaticStudyItemDefinition[];
}

export interface StaticTrackDefinition {
  id: TrackId;
  label: string;
  summary: string;
  accent: "peach" | "lavender" | "mint";
  groups: StaticTopicGroupDefinition[];
}

export type AppContent = Record<TrackId, StaticTrackDefinition>;

export interface ItemProgress {
  itemId: string;
  completionCount: number;
  lastCompletedAt: string | null;
  nextDueDate: string | null;
  completionHistory: string[];
}

export interface AppState {
  version: number;
  progress: Record<string, ItemProgress>;
}

export function emptyProgress(itemId: string): ItemProgress {
  return {
    itemId,
    completionCount: 0,
    lastCompletedAt: null,
    nextDueDate: null,
    completionHistory: [],
  };
}

export function createEmptyState(): AppState {
  return {
    version: 4,
    progress: {},
  };
}
