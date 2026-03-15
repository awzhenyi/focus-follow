import { useEffect, useMemo, useRef, useState } from "react";
import { Braces, Boxes, CalendarDays, ChevronDown, ChevronUp, CircuitBoard, Moon, PanelLeftClose, PanelLeftOpen, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TRACK_CONTENT } from "./interview-prep/content";
import { collectDue, collectScheduledEntries, type ScheduledEntry } from "./interview-prep/due";
import { localDateString, toggleCompletion } from "./interview-prep/srs";
import { loadState, saveStateDebounced } from "./interview-prep/storage";
import type { AppState, StaticTopicGroupDefinition, TrackId } from "./interview-prep/types";
import { createEmptyState, TRACK_IDS } from "./interview-prep/types";
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

const accentDotClasses: Record<TrackId, string> = {
  leetcode: "bg-[oklch(0.86_0.06_55)]",
  hld: "bg-[oklch(0.84_0.04_300)]",
  lld: "bg-[oklch(0.84_0.04_170)]",
};

const accentBarClasses: Record<TrackId, string> = {
  leetcode: "bg-[oklch(0.78_0.08_55)]",
  hld: "bg-[oklch(0.74_0.07_300)]",
  lld: "bg-[oklch(0.74_0.06_170)]",
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/88 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Sparkles className="size-4" />
            </span>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Focus Follow</p>
          </div>
          <nav className="flex items-center gap-2 rounded-full p-1">
            <Button variant={navView === "home" ? "default" : "ghost"} size="sm" onClick={() => setNavView("home")}>
              Home
            </Button>
            <Button variant={navView === "schedule" ? "default" : "ghost"} size="sm" onClick={() => setNavView("schedule")}>
              Schedule
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside
          className={`sticky top-24 self-start rounded-[28px] border border-sidebar-border/80 bg-sidebar/95 text-sidebar-foreground shadow-xl shadow-primary/8 transition-all ${
            sidebarCollapsed ? "w-[92px]" : "w-[320px]"
          }`}
        >
          <div className="flex items-center justify-between border-b border-sidebar-border/80 px-4 py-4">
            {!sidebarCollapsed && (
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Library</div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:bg-background/80 hover:text-foreground"
              onClick={() => setSidebarCollapsed((current) => !current)}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </Button>
          </div>

          <div className="space-y-2 p-3">
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
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                      isOpen
                        ? "border-border/70 bg-background/90 text-foreground shadow-md shadow-primary/5"
                        : "border-transparent bg-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground"
                    }`}
                  >
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-secondary-foreground">
                      <TrackIcon className="size-4" />
                    </span>
                    {!sidebarCollapsed && (
                      <>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{track.label}</div>
                          <div className="mt-1 truncate text-xs text-muted-foreground">
                            {startedCount} / {trackEntries.length} in progress
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/80">
                            <div
                              className={`h-full rounded-full transition-all ${accentBarClasses[trackId]}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                        <span className="shrink-0 text-muted-foreground">
                        {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </span>
                      </>
                    )}
                  </button>

                  {!sidebarCollapsed && isOpen && (
                    <div className="space-y-2 pl-2">
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

        <main className="min-w-0 flex-1 space-y-6">
          {navView === "home" ? (
            <HomeView
              dueEntries={dueEntries}
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
    <div className="rounded-2xl bg-background/55">
      <button
        type="button"
        onClick={onToggleGroup}
        className="flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground"
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
        <div className="space-y-1 px-2 pb-2">
          {group.items.map((item) => {
            const entry = entries.find((candidate) => candidate.itemId === item.id);
            const checked =
              entry !== undefined
                ? entry.progress.completionHistory.length > 0 && !entry.isDueToday && !entry.isOverdue
                : false;
            return (
              <label
                key={item.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 text-sm text-muted-foreground transition hover:bg-background/75 hover:text-foreground"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleItem(item.id)}
                  className="mt-0.5 size-3.5 rounded-sm border border-border bg-background accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <div className={`truncate ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.title}</div>
                  {entry && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{completionLabel(entry)}</div>}
                </div>
                <span className={`mt-0.5 size-2 rounded-full ${accentDotClasses[trackId]}`} />
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HomeView({
  dueEntries,
  onToggleItem,
  onRequestResetAllProgress,
}: {
  dueEntries: ScheduledEntry[];
  onToggleItem: (itemId: string) => void;
  onRequestResetAllProgress: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 bg-card/92 shadow-xl shadow-primary/5">
        <CardHeader className="gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Welcome back
          </div>
          <div>
            <CardTitle className="text-3xl leading-tight">A calmer, cleaner place to revisit what matters.</CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-base">
              Focus on one structured path at a time. When you check an item off, it gets scheduled for its next revisit automatically.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Topics to recap today</CardTitle>
          <CardDescription>Only items you have already started and that are due now or overdue appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          {dueEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-background/65 p-4 text-sm text-muted-foreground">
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

      <Card className="border-border/70 bg-card/88 shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Track Overview</CardTitle>
          <CardDescription>A quick snapshot of the bundled study paths and what is due today.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {TRACK_IDS.map((trackId) => {
            const track = TRACK_CONTENT[trackId];
            const dueCount = dueEntries.filter((entry) => entry.trackId === trackId).length;
            const itemCount = track.groups.reduce((sum, group) => sum + group.items.length, 0);
            return (
              <div key={trackId} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${accentClasses[trackId]}`}>{track.label}</span>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">{track.summary}</div>
                <div className="mt-3 text-sm text-muted-foreground">
                  {track.groups.length} group(s) · {itemCount} item(s) · {dueCount} due today
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-destructive/30 bg-card/88 shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Reset progress</CardTitle>
          <CardDescription>
            Clear all completion history and return every study item to a clean not-started state.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Use this if you want to restart your schedule from scratch.
          </p>
          <Button variant="destructive" onClick={onRequestResetAllProgress}>
            Reset all progress
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DueItemCard({ entry, onToggleItem }: { entry: ScheduledEntry; onToggleItem: (itemId: string) => void }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
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
          <span className="ml-auto text-xs text-muted-foreground">
            {entry.isOverdue ? `Overdue since ${entry.dueDate}` : `Due ${entry.dueDate}`}
          </span>
        </div>
        <div className="mt-3 font-medium">{entry.itemTitle}</div>
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
      <Card className="border-border/70 bg-card/92 shadow-xl shadow-primary/5">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>Upcoming revisit dates generated from your completion checkboxes.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["day", "week", "month"] as const).map((mode) => (
                <Button key={mode} variant={scheduleMode === mode ? "default" : "outline"} size="sm" onClick={() => onModeChange(mode)}>
                  {mode[0]!.toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onDateChange(shiftLocalDate(scheduleDate, -shift))}>
              Prev
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDateChange(localDateString(new Date()))}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDateChange(shiftLocalDate(scheduleDate, shift))}>
              Next
            </Button>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium">
              <CalendarDays className="size-4 text-muted-foreground" />
              {scheduleLabel(scheduleMode, scheduleDate)}
            </div>
          </div>
        </CardHeader>
      </Card>

      {scheduleMode === "day" && (
        <Card className="border-border/70 bg-card/88 shadow-lg shadow-primary/5">
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
        <Card className="border-border/70 bg-card/88 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>Week view</CardTitle>
            <CardDescription>Your next seven days of revisits.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            {weekDates.map((dateString) => {
              const list = entriesByDate.get(dateString) ?? [];
              return (
                <div key={dateString} className="rounded-2xl border border-border/70 bg-background/70 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
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
        <Card className="border-border/70 bg-card/88 shadow-lg shadow-primary/5">
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
                    className={`min-h-28 rounded-2xl border p-2 ${
                      inCurrentMonth ? "border-border/70 bg-background/70" : "border-border/35 bg-background/40 opacity-70"
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
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${accentClasses[entry.trackId]}`}>{entry.trackLabel}</span>
        <span className="text-xs text-muted-foreground">{entry.topicTitle}</span>
        <span className="ml-auto text-xs text-muted-foreground">Due {entry.dueDate}</span>
      </div>
      <div className="mt-3 font-medium">{entry.itemTitle}</div>
    </div>
  );
}

function MiniScheduleEntry({ entry }: { entry: ScheduledEntry }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/70 px-2 py-1.5 text-xs">
      <div className="truncate font-medium">{entry.itemTitle}</div>
      <div className="truncate text-muted-foreground">{entry.topicTitle}</div>
    </div>
  );
}

function EmptyScheduleState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-background/65 p-4 text-sm text-muted-foreground">
      No revisits scheduled for this period yet. Once you complete an item, it will appear here automatically.
    </div>
  );
}

export default App;
