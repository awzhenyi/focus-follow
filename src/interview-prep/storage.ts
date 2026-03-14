import { getAllBundledItems } from "./content";
import type { AppContent, AppState, ItemProgress } from "./types";
import { createEmptyState, emptyProgress } from "./types";

export const STORAGE_KEY = "interview-prep-v1";

let saveTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 300;

function createProgressBuckets(content: AppContent): Record<string, ItemProgress> {
  return Object.fromEntries(getAllBundledItems(content).map(({ item }) => [item.id, emptyProgress(item.id)]));
}

function normalizeProgress(raw: Partial<ItemProgress>, itemId: string): ItemProgress {
  const completionHistory =
    raw.completionHistory ??
    (raw.lastCompletedAt
      ? Array.from({ length: Math.max(raw.completionCount ?? 1, 1) }, () => raw.lastCompletedAt!)
      : []);

  return {
    itemId,
    completionCount: completionHistory.length,
    lastCompletedAt: completionHistory[completionHistory.length - 1] ?? null,
    nextDueDate: raw.nextDueDate ?? null,
    completionHistory,
  };
}

function migrateLegacyState(raw: unknown): AppState | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as {
    version?: number;
    tracks?: Record<string, { topics?: Array<{ items?: Array<{ id: string; srs?: { repetitions?: number; lastReviewedAt?: string | null; nextDueDate?: string | null } }> }> }>;
    progress?: Record<string, unknown>;
  };

  const migrated = createEmptyState();

  if (candidate.version === 1 && candidate.tracks) {
    for (const track of Object.values(candidate.tracks)) {
      for (const topic of track.topics ?? []) {
        for (const item of topic.items ?? []) {
          migrated.progress[item.id] = normalizeProgress(
            {
              completionCount: item.srs?.repetitions ?? 0,
              lastCompletedAt: item.srs?.lastReviewedAt ?? null,
              nextDueDate: item.srs?.nextDueDate ?? null,
            },
            item.id,
          );
        }
      }
    }
    return migrated;
  }

  if (candidate.version === 2 && candidate.progress && typeof candidate.progress === "object") {
    for (const track of Object.values(candidate.progress as Record<string, Record<string, { items?: Array<{ id: string; srs?: { repetitions?: number; lastReviewedAt?: string | null; nextDueDate?: string | null } }> }>>)) {
      for (const topic of Object.values(track)) {
        for (const item of topic.items ?? []) {
          migrated.progress[item.id] = normalizeProgress(
            {
              completionCount: item.srs?.repetitions ?? 0,
              lastCompletedAt: item.srs?.lastReviewedAt ?? null,
              nextDueDate: item.srs?.nextDueDate ?? null,
            },
            item.id,
          );
        }
      }
    }
    return migrated;
  }

  return null;
}

function syncStateWithContent(state: AppState, content: AppContent): AppState {
  const synced = createEmptyState();
  synced.progress = createProgressBuckets(content);

  for (const itemId of Object.keys(synced.progress)) {
    const existing = state.progress[itemId];
    if (existing) {
      synced.progress[itemId] = normalizeProgress(existing, itemId);
    }
  }

  return synced;
}

export function loadState(content: AppContent): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return syncStateWithContent(createEmptyState(), content);
    const parsed = JSON.parse(raw) as AppState;
    const migrated = migrateLegacyState(parsed);
    if (migrated) return syncStateWithContent(migrated, content);
    if (parsed.version !== 4 || !parsed.progress) return syncStateWithContent(createEmptyState(), content);
    return syncStateWithContent(parsed, content);
  } catch {
    return syncStateWithContent(createEmptyState(), content);
  }
}

export function saveStateImmediate(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function saveStateDebounced(state: AppState): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveStateImmediate(state);
  }, DEBOUNCE_MS);
}
