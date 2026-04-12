import { useEffect, useMemo, useRef, useState } from "react";
import { Braces, Boxes, CalendarDays, ChevronDown, ChevronUp, CircuitBoard, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStudyItemHref, TRACK_CONTENT } from "./interview-prep/content";
import { collectDue, collectScheduledEntries, type ScheduledEntry } from "./interview-prep/due";
import { localDateString, toggleCompletion } from "./interview-prep/srs";
import { loadState, saveStateDebounced } from "./interview-prep/storage";
import type { AppState, StaticTopicGroupDefinition, StudyDifficulty, TrackId } from "./interview-prep/types";
import { createEmptyState, TRACK_IDS } from "./interview-prep/types";
import appIcon from "./assets/icons/book-icon.svg";
import appIconMonochrome from "./assets/icons/book-icon-monochrome.svg";
import "./index.css";

type NavView = "home" | "schedule";
type ScheduleMode = "day" | "week" | "month";
type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "focus-follow-theme";

const accentClasses: Record<TrackId, string> = {
  leetcode: "bg-[oklch(0.93_0.06_55)] text-[oklch(0.42_0.07_40)] border-[oklch(0.85_0.04_55)]",
  hld: "bg-[oklch(0.94_0.04_300)] text-[oklch(0.4_0.07_300)] border-[oklch(0.87_0.03_300)]",
  lld: "bg-[oklch(0.95_0.04_170)] text-[oklch(0.36_0.05_170)] border-[oklch(0.88_0.03_170)]",
};

const accentBarClasses: Record<TrackId, string> = {
  leetcode: "bg-[oklch(0.78_0.08_55)]",
  hld: "bg-[oklch(0.74_0.07_300)]",
  lld: "bg-[oklch(0.74_0.06_170)]",
};

const difficultyBadgeClasses: Record<StudyDifficulty, string> = {
  easy: "border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/12 dark:text-emerald-200",
  medium: "border-amber-500/20 bg-amber-500/12 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/12 dark:text-amber-200",
  hard: "border-rose-500/20 bg-rose-500/12 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/12 dark:text-rose-200",
};

const trackIcons: Record<TrackId, typeof Braces> = {
  leetcode: Braces,
  hld: CircuitBoard,
  lld: Boxes,
};

function parseLocalDate(dateString: string): Date {
  const [year = 1970, month = 1, day = 1] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function shiftLocalDate(dateString: string, offsetDays: number): string {
  const next = parseLocalDate(dateString);
  next.setDate(next.getDate() + offsetDays);
  return localDateString(next);
}

function startOfWeek(dateString: string): string {
  const date = parseLocalDate(dateString);
  const day = date.getDay();
  const mondayOffset = (day + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return localDateString(date);
}

function getWeekDates(anchorDate: string): string[] {
  const first = startOfWeek(anchorDate);
  return Array.from({ length: 7 }, (_, index) => shiftLocalDate(first, index));
}

function getMonthGrid(anchorDate: string): string[] {
  const date = parseLocalDate(anchorDate);
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = startOfWeek(localDateString(monthStart));
  return Array.from({ length: 42 }, (_, index) => shiftLocalDate(gridStart, index));
}

function formatDateLabel(dateString: string, options: Intl.DateTimeFormatOptions): string {
  return parseLocalDate(dateString).toLocaleDateString(undefined, options);
}

function scheduleLabel(mode: ScheduleMode, anchorDate: string): string {
  if (mode === "day") {
    return formatDateLabel(anchorDate, { weekday: "long", month: "long", day: "numeric" });
  }
  if (mode === "week") {
    const dates = getWeekDates(anchorDate);
    return `${formatDateLabel(dates[0]!, { month: "short", day: "numeric" })} - ${formatDateLabel(dates[6]!, {
      month: "short",
      day: "numeric",
    })}`;
  }
  return formatDateLabel(anchorDate, { month: "long", year: "numeric" });
}

function completionLabel(entry: ScheduledEntry): string {
  if (entry.progress.completionHistory.length === 0) return "Not started";
  if (entry.isDueToday || entry.isOverdue) return "Ready to revisit";
  return `Done · next ${entry.dueDate ?? "TBD"}`;
}

function getStartedCount(entries: ScheduledEntry[]): number {
  return entries.filter((entry) => entry.progress.completionHistory.length > 0).length;
}

function getProgressPercent(startedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return (startedCount / totalCount) * 100;
}

function DifficultyBadge({
  difficulty,
  compact = false,
}: {
  difficulty?: StudyDifficulty;
  compact?: boolean;
}) {
  if (!difficulty) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border font-medium uppercase tracking-[0.14em] ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      } ${difficultyBadgeClasses[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function App() {
  const [state, setState] = useState<AppState>(() => loadState(TRACK_CONTENT));
  const [navView, setNavView] = useState<NavView>("home");
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("week");
  const [scheduleDate, setScheduleDate] = useState(localDateString(new Date()));
  const [openTracks, setOpenTracks] = useState<Record<TrackId, boolean>>({
    leetcode: false,
    hld: false,
    lld: false,
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TRACK_IDS.flatMap((trackId) => TRACK_CONTENT[trackId].groups.map((group) => [group.id, true]))),
  );
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    saveStateDebounced(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const allEntries = useMemo(() => collectScheduledEntries(state, TRACK_CONTENT), [state]);
  const dueEntries = useMemo(() => collectDue(state, TRACK_CONTENT), [state]);
  const startedItemCount = useMemo(() => getStartedCount(allEntries), [allEntries]);
  const totalItemCount = allEntries.length;

  const toggleTrack = (trackId: TrackId) => {
    setOpenTracks((current) => ({ ...current, [trackId]: !current[trackId] }));
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  };

  const toggleItem = (itemId: string) => {
    setState((current) => {
      const next = structuredClone(current) as AppState;
      const currentProgress = next.progress[itemId];
      next.progress[itemId] = toggleCompletion(itemId, currentProgress, new Date());
      return next;
    });
  };

  const resetAllProgress = () => {
    setState(createEmptyState());
    setIsResetDialogOpen(false);
  };

  return (
    <div className="min-h-[100dvh] text-foreground">
      <header className="py-4">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6">
          <div className="flex flex-col gap-3 rounded-[24px] border border-border/60 bg-card/80 px-4 py-3 shadow-[0_18px_60px_oklch(0.2_0.04_300_/_0.12)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-white/8 dark:bg-[linear-gradient(180deg,oklch(0.26_0.026_302_/_0.92),oklch(0.22_0.022_290_/_0.88))]">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center overflow-hidden rounded-2xl shadow-[inset_0_1px_0_oklch(1_0_0_/_0.45),0_10px_30px_oklch(0.42_0.08_305_/_0.15)] ring-1 ring-white/10">
                <img src={theme === "dark" ? appIconMonochrome : appIcon} alt="Focus Follow icon" className="size-full object-cover" />
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground">
                  FOCUS FOLLOW
                </span>
                <span className="text-xs text-muted-foreground/80">
                  Interview prep, one calm session at a time
                </span>
              </div>
            </div>
            <nav className="flex w-full items-center justify-center gap-1 rounded-full bg-background/75 p-1.5 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.32),0_12px_30px_oklch(0.2_0.04_300_/_0.08)] sm:w-auto sm:justify-start dark:bg-black/15">
              <Button
                variant={navView === "home" ? "default" : "ghost"}
                size="sm"
                className="transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                onClick={() => setNavView("home")}
              >
                Home
              </Button>
              <Button
                variant={navView === "schedule" ? "default" : "ghost"}
                size="sm"
                className="transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                onClick={() => setNavView("schedule")}
              >
                Schedule
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 pb-10 pt-2 sm:px-6">
        <div className="relative overflow-hidden rounded-[30px] border border-border/60 bg-card/72 p-3 shadow-[0_28px_80px_oklch(0.17_0.03_290_/_0.12)] backdrop-blur-xl sm:rounded-[36px] sm:p-4 dark:border-white/8 dark:bg-[linear-gradient(180deg,oklch(0.24_0.022_296_/_0.82),oklch(0.18_0.018_286_/_0.76))]">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-40 bg-[radial-gradient(circle_at_center,oklch(0.74_0.08_310_/_0.12),transparent_68%)] dark:bg-[radial-gradient(circle_at_center,oklch(0.72_0.08_308_/_0.18),transparent_68%)]" />
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(18rem,20rem)_minmax(0,1fr)] xl:gap-5">
            <aside
            className="flex min-w-0 w-full flex-col overflow-hidden rounded-[26px] border border-sidebar-border/70 bg-sidebar/88 text-sidebar-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.25),0_24px_60px_oklch(0.18_0.03_290_/_0.14)] transition-all xl:max-h-[calc(100dvh-8rem)] xl:w-[320px] dark:border-white/8 dark:bg-[linear-gradient(180deg,oklch(0.28_0.024_296_/_0.86),oklch(0.22_0.018_288_/_0.82))]"
          >
          <div className="flex items-center justify-between border-b border-sidebar-border/80 px-4 py-4">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground">LIBRARY</div>
            </div>
          </div>

          <div className="space-y-2 p-3 xl:sidebar-scroll xl:flex-1 xl:overflow-y-auto">
            {TRACK_IDS.map((trackId) => {
              const track = TRACK_CONTENT[trackId];
              const isOpen = openTracks[trackId];
              const TrackIcon = trackIcons[trackId];
              const trackEntries = allEntries.filter((entry) => entry.trackId === trackId);
              const startedCount = getStartedCount(trackEntries);
              const progressPercent = getProgressPercent(startedCount, trackEntries.length);

              return (
                <div key={trackId} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleTrack(trackId)}
                    className={`flex w-full items-center gap-3 rounded-[22px] border px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      isOpen
                        ? "border-border/70 bg-background/92 text-foreground shadow-[0_16px_34px_oklch(0.2_0.04_290_/_0.08)]"
                        : "border-transparent bg-sidebar/88 text-muted-foreground hover:bg-background/60 hover:text-foreground dark:bg-[oklch(0.26_0.02_292_/_0.82)]"
                    }`}
                  >
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-2xl bg-secondary/90 text-secondary-foreground shadow-sm">
                      <TrackIcon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{track.label}</div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {startedCount} / {trackEntries.length} in progress
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/80 shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all ${accentBarClasses[trackId]}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 text-muted-foreground">
                      {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="space-y-2 pl-2 pr-1 xl:sidebar-scroll xl:max-h-[min(28rem,calc(100dvh-18rem))] xl:overflow-y-auto">
                      {track.groups.map((group) => (
                        <SidebarGroup
                          key={group.id}
                          trackId={trackId}
                          group={group}
                          entries={allEntries.filter((entry) => entry.trackId === trackId && entry.topicId === group.id)}
                          isOpen={openGroups[group.id] ?? true}
                          onToggleGroup={() => toggleGroup(group.id)}
                          onToggleItem={toggleItem}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
            </aside>

            <main className="min-w-0 space-y-6">
            {navView === "home" ? (
              <HomeView
                dueEntries={dueEntries}
                startedItemCount={startedItemCount}
                totalItemCount={totalItemCount}
                onToggleItem={toggleItem}
                onRequestResetAllProgress={() => setIsResetDialogOpen(true)}
              />
            ) : (
              <ScheduleView
                entries={allEntries}
                scheduleMode={scheduleMode}
                scheduleDate={scheduleDate}
                onModeChange={setScheduleMode}
                onDateChange={setScheduleDate}
              />
            )}
            </main>
          </div>
        </div>
      </div>

      {isResetDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-destructive/30 bg-card shadow-2xl shadow-primary/10">
            <CardHeader>
              <CardTitle>Reset all progress?</CardTitle>
              <CardDescription>
                This will clear every completion history and return all study items to a clean not-started state.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={resetAllProgress}>
                Confirm reset
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SidebarGroup({
  trackId,
  group,
  entries,
  isOpen,
  onToggleGroup,
  onToggleItem,
}: {
  trackId: TrackId;
  group: StaticTopicGroupDefinition;
  entries: ScheduledEntry[];
  isOpen: boolean;
  onToggleGroup: () => void;
  onToggleItem: (itemId: string) => void;
}) {
  const startedCount = getStartedCount(entries);
  const progressPercent = getProgressPercent(startedCount, group.items.length);

  return (
    <div className="overflow-hidden rounded-[22px] bg-background/52 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.14)]">
      <button
        type="button"
        onClick={onToggleGroup}
        className="sticky top-0 z-10 flex w-full items-start justify-between gap-2 bg-background/92 px-3 py-3 text-left text-sm font-medium text-foreground backdrop-blur-xl"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate">{group.title}</div>
          <div className="mt-1 truncate text-[11px] font-normal text-muted-foreground">
            {startedCount} / {group.items.length} in progress
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/80">
            <div
              className={`h-full rounded-full transition-all ${accentBarClasses[trackId]}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="space-y-1 px-2 pb-2 xl:sidebar-scroll xl:max-h-72 xl:overflow-y-auto">
          {group.items.map((item) => {
            const entry = entries.find((candidate) => candidate.itemId === item.id);
            const checked =
              entry !== undefined
                ? entry.progress.completionHistory.length > 0 && !entry.isDueToday && !entry.isOverdue
                : false;
            const href = getStudyItemHref(trackId, group, item);
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-2xl px-2 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-background/75 hover:text-foreground"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleItem(item.id)}
                  className="mt-0.5 size-3.5 rounded-sm border border-border bg-background accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="min-w-0 flex-1">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className={`block truncate underline-offset-4 hover:underline ${
                            checked ? "text-muted-foreground line-through" : "text-foreground"
                          }`}
                        >
                          {item.title}
                        </a>
                      ) : (
                        <div className={`truncate ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.title}</div>
                      )}
                    </div>
                    <DifficultyBadge difficulty={item.difficulty} compact />
                  </div>
                  {entry && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{completionLabel(entry)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HomeView({
  dueEntries,
  startedItemCount,
  totalItemCount,
  onToggleItem,
  onRequestResetAllProgress,
}: {
  dueEntries: ScheduledEntry[];
  startedItemCount: number;
  totalItemCount: number;
  onToggleItem: (itemId: string) => void;
  onRequestResetAllProgress: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/60 bg-[linear-gradient(145deg,oklch(1_0_0_/_0.18),transparent_32%),linear-gradient(180deg,oklch(0.99_0.008_18_/_0.92),oklch(0.97_0.012_320_/_0.84))] shadow-[0_26px_70px_oklch(0.2_0.04_300_/_0.1)] dark:border-white/8 dark:bg-[linear-gradient(145deg,oklch(0.7_0.06_310_/_0.12),transparent_35%),linear-gradient(180deg,oklch(0.31_0.028_304_/_0.96),oklch(0.24_0.022_292_/_0.92))] dark:shadow-[0_28px_80px_oklch(0.08_0.015_285_/_0.45)]">
        <CardHeader className="gap-8 p-7 sm:p-8">
          <div className="editorial-heading text-4xl leading-none tracking-[-0.02em] text-foreground sm:text-5xl">
            <span>Welcome </span>
            <span className="text-primary drop-shadow-[0_4px_12px_oklch(0.7_0.08_310_/_0.18)]">Back</span>
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.9fr)] lg:items-end">
            <div>
              <CardTitle className="max-w-3xl text-4xl font-semibold leading-[0.96] tracking-[-0.045em] sm:text-5xl">
                Keep your interview prep organized and easy to revisit.
              </CardTitle>
              <CardDescription className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground sm:text-base dark:text-foreground/76">
                Cross off a task when you finish it, and it automatically gets scheduled for the next revisit.
                Nothing starts until you do.
              </CardDescription>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[22px] border border-border/60 bg-background/70 p-4 shadow-sm dark:border-white/10 dark:bg-black/18 dark:shadow-none">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground dark:text-foreground/60">DUE TODAY</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{dueEntries.length}</div>
              </div>
              <div className="rounded-[22px] border border-border/60 bg-background/70 p-4 shadow-sm dark:border-white/10 dark:bg-black/18 dark:shadow-none">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground dark:text-foreground/60">STARTED</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{startedItemCount}</div>
              </div>
              <div className="rounded-[22px] border border-border/60 bg-background/70 p-4 shadow-sm dark:border-white/10 dark:bg-black/18 dark:shadow-none">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground dark:text-foreground/60">LIBRARY SIZE</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{totalItemCount}</div>
              </div>
            </div>
          </div>
          <div className="rounded-[24px] border border-border/60 bg-background/60 p-4 sm:p-5 dark:border-white/10 dark:bg-black/15">
            <div className="text-sm font-medium text-foreground">How it works</div>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-6 dark:text-foreground/74">
              Your first check-in sets the schedule in motion. After that, each revisit follows the spaced repetition ladder, and accidental clicks can still be rolled back.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/60 bg-card/86 shadow-[0_20px_50px_oklch(0.2_0.04_300_/_0.08)]">
        <CardHeader>
          <CardTitle className="text-2xl tracking-[-0.03em]">Topics to recap today</CardTitle>
          <CardDescription className="max-w-[65ch] text-sm leading-6">
            Only items you have already started and that are due now or overdue appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dueEntries.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border/70 bg-background/65 p-5 text-sm leading-6 text-muted-foreground">
              Nothing is due yet. Start by completing an item in the sidebar, and its first revisit will be scheduled automatically.
            </div>
          ) : (
            <div className="space-y-3">
              {dueEntries.map((entry) => (
                <DueItemCard key={entry.itemId} entry={entry} onToggleItem={onToggleItem} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/84 shadow-[0_20px_50px_oklch(0.2_0.04_300_/_0.08)]">
        <CardHeader>
          <CardTitle className="text-2xl tracking-[-0.03em]">Track overview</CardTitle>
          <CardDescription className="max-w-[65ch] text-sm leading-6">
            A quick snapshot of the bundled study paths and what is due today.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {TRACK_IDS.map((trackId) => {
            const track = TRACK_CONTENT[trackId];
            const dueCount = dueEntries.filter((entry) => entry.trackId === trackId).length;
            const itemCount = track.groups.reduce((sum, group) => sum + group.items.length, 0);
            return (
              <div key={trackId} className="rounded-[24px] border border-border/60 bg-background/68 p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${accentClasses[trackId]}`}>{track.label}</span>
                </div>
                <div className="mt-4 text-sm leading-6 text-muted-foreground">{track.summary}</div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-card px-2.5 py-1">{track.groups.length} groups</span>
                  <span className="rounded-full bg-card px-2.5 py-1">{itemCount} items</span>
                  <span className="rounded-full bg-card px-2.5 py-1">{dueCount} due today</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-destructive/25 bg-card/82 shadow-[0_16px_40px_oklch(0.2_0.04_300_/_0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl tracking-[-0.03em]">Reset progress</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Use this if you want to restart all items to day 0.
          </p>
          <Button
            variant="destructive"
            className="transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
            onClick={onRequestResetAllProgress}
          >
            Reset all progress
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DueItemCard({ entry, onToggleItem }: { entry: ScheduledEntry; onToggleItem: (itemId: string) => void }) {
  return (
    <div className="flex items-start gap-3 rounded-[24px] border border-border/60 bg-background/72 p-4 shadow-sm">
      <input
        type="checkbox"
        checked={false}
        onChange={() => onToggleItem(entry.itemId)}
        className="mt-1 size-4 rounded-sm border border-border accent-primary"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${accentClasses[entry.trackId]}`}>{entry.trackLabel}</span>
          <span className="text-xs text-muted-foreground">{entry.topicTitle}</span>
          <DifficultyBadge difficulty={entry.itemDifficulty} />
          <span className="ml-auto text-xs text-muted-foreground">
            {entry.isOverdue ? `Overdue since ${entry.dueDate}` : `Due ${entry.dueDate}`}
          </span>
        </div>
        <div className="mt-3 min-w-0 font-medium">
          {entry.itemHref ? (
            <a href={entry.itemHref} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
              {entry.itemTitle}
            </a>
          ) : (
            entry.itemTitle
          )}
        </div>
      </div>
    </div>
  );
}

function ScheduleView({
  entries,
  scheduleMode,
  scheduleDate,
  onModeChange,
  onDateChange,
}: {
  entries: ScheduledEntry[];
  scheduleMode: ScheduleMode;
  scheduleDate: string;
  onModeChange: (mode: ScheduleMode) => void;
  onDateChange: (date: string) => void;
}) {
  const shift = scheduleMode === "day" ? 1 : scheduleMode === "week" ? 7 : 28;
  const entriesByDate = new Map<string, ScheduledEntry[]>();

  for (const entry of entries.filter((candidate) => candidate.progress.lastCompletedAt !== null)) {
    const dueDate = entry.dueDate;
    if (dueDate === null) continue;
    const list = entriesByDate.get(dueDate) ?? [];
    list.push(entry);
    entriesByDate.set(dueDate, list);
  }

  const weekDates = getWeekDates(scheduleDate);
  const monthGrid = getMonthGrid(scheduleDate);
  const dayEntries = entriesByDate.get(scheduleDate) ?? [];

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-[linear-gradient(145deg,oklch(1_0_0_/_0.12),transparent_30%),linear-gradient(180deg,oklch(0.99_0.008_18_/_0.9),oklch(0.97_0.01_320_/_0.82))] shadow-[0_24px_70px_oklch(0.2_0.04_300_/_0.09)] dark:border-white/8 dark:bg-[linear-gradient(145deg,oklch(0.7_0.06_308_/_0.1),transparent_32%),linear-gradient(180deg,oklch(0.3_0.028_302_/_0.95),oklch(0.23_0.022_290_/_0.9))] dark:shadow-[0_28px_80px_oklch(0.08_0.015_285_/_0.42)]">
        <CardHeader className="gap-6 p-7 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-4xl font-semibold tracking-[-0.04em]">Schedule</CardTitle>
              <CardDescription className="mt-3 max-w-[65ch] text-sm leading-6 dark:text-foreground/76">
                Upcoming revisit dates generated from your completion checkboxes.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-full bg-background/75 p-1.5 shadow-sm dark:bg-black/15">
              {(["day", "week", "month"] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={scheduleMode === mode ? "default" : "ghost"}
                  size="sm"
                  className="transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  onClick={() => onModeChange(mode)}
                >
                  {mode[0]!.toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              onClick={() => onDateChange(shiftLocalDate(scheduleDate, -shift))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              onClick={() => onDateChange(localDateString(new Date()))}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              onClick={() => onDateChange(shiftLocalDate(scheduleDate, shift))}
            >
              Next
            </Button>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/72 px-3 py-2 text-sm font-medium shadow-sm dark:border-white/10 dark:bg-black/15">
              <CalendarDays className="size-4 text-muted-foreground" />
              {scheduleLabel(scheduleMode, scheduleDate)}
            </div>
          </div>
        </CardHeader>
      </Card>

      {scheduleMode === "day" && (
        <Card className="border-border/60 bg-card/84 shadow-[0_18px_48px_oklch(0.2_0.04_300_/_0.08)]">
          <CardHeader>
            <CardTitle>Day view</CardTitle>
            <CardDescription>All study items scheduled for this date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dayEntries.length === 0 ? (
              <EmptyScheduleState />
            ) : (
              dayEntries.map((entry) => <ScheduledListCard key={entry.itemId} entry={entry} />)
            )}
          </CardContent>
        </Card>
      )}

      {scheduleMode === "week" && (
        <Card className="border-border/60 bg-card/84 shadow-[0_18px_48px_oklch(0.2_0.04_300_/_0.08)]">
          <CardHeader>
            <CardTitle>Week view</CardTitle>
            <CardDescription>Your next seven days of revisits.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            {weekDates.map((dateString) => {
              const list = entriesByDate.get(dateString) ?? [];
              return (
                <div key={dateString} className="rounded-[22px] border border-border/60 bg-background/68 p-3 shadow-sm">
                  <div className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground">
                    {formatDateLabel(dateString, { weekday: "short" })}
                  </div>
                  <div className="mt-1 font-medium">{formatDateLabel(dateString, { month: "short", day: "numeric" })}</div>
                  <div className="mt-3 space-y-2">
                    {list.length === 0 ? (
                      <div className="rounded-xl bg-card/70 px-3 py-2 text-xs text-muted-foreground">No revisits</div>
                    ) : (
                      list.map((entry) => <MiniScheduleEntry key={entry.itemId} entry={entry} />)
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {scheduleMode === "month" && (
        <Card className="border-border/60 bg-card/84 shadow-[0_18px_48px_oklch(0.2_0.04_300_/_0.08)]">
          <CardHeader>
            <CardTitle>Month view</CardTitle>
            <CardDescription>See how your scheduled revisits spread across the month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {monthGrid.map((dateString) => {
                const list = entriesByDate.get(dateString) ?? [];
                const inCurrentMonth = parseLocalDate(dateString).getMonth() === parseLocalDate(scheduleDate).getMonth();
                return (
                  <div
                    key={dateString}
                    className={`min-h-28 rounded-[22px] border p-2 ${
                      inCurrentMonth ? "border-border/60 bg-background/68" : "border-border/35 bg-background/40 opacity-70"
                    }`}
                  >
                    <div className="text-sm font-medium">{formatDateLabel(dateString, { day: "numeric" })}</div>
                    <div className="mt-2 space-y-1">
                      {list.slice(0, 3).map((entry) => (
                        <MiniScheduleEntry key={entry.itemId} entry={entry} />
                      ))}
                      {list.length > 3 && (
                        <div className="rounded-xl bg-card/70 px-2 py-1 text-[11px] text-muted-foreground">
                          +{list.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScheduledListCard({ entry }: { entry: ScheduledEntry }) {
  return (
    <div className="rounded-[24px] border border-border/60 bg-background/72 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${accentClasses[entry.trackId]}`}>{entry.trackLabel}</span>
        <span className="text-xs text-muted-foreground">{entry.topicTitle}</span>
        <DifficultyBadge difficulty={entry.itemDifficulty} />
        <span className="ml-auto text-xs text-muted-foreground">Due {entry.dueDate}</span>
      </div>
      <div className="mt-3 min-w-0 font-medium">
        {entry.itemHref ? (
          <a href={entry.itemHref} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
            {entry.itemTitle}
          </a>
        ) : (
          entry.itemTitle
        )}
      </div>
    </div>
  );
}

function MiniScheduleEntry({ entry }: { entry: ScheduledEntry }) {
  return (
    <div className="rounded-2xl border border-border/55 bg-card/72 px-2 py-1.5 text-xs shadow-sm">
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1 truncate font-medium">
          {entry.itemHref ? (
            <a href={entry.itemHref} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
              {entry.itemTitle}
            </a>
          ) : (
            entry.itemTitle
          )}
        </div>
        <DifficultyBadge difficulty={entry.itemDifficulty} compact />
      </div>
      <div className="truncate text-muted-foreground">{entry.topicTitle}</div>
    </div>
  );
}

function EmptyScheduleState() {
  return (
    <div className="rounded-[24px] border border-dashed border-border/70 bg-background/65 p-4 text-sm leading-6 text-muted-foreground">
      No revisits scheduled for this period yet. Once you complete an item, it will appear here automatically.
    </div>
  );
}

export default App;
