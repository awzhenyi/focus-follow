## Context

Greenfield feature on existing **Bun + React 19 + Tailwind** template. No backend; users are single-device, anonymous. Interview prep is organized into three tracks with topics and items; **spaced repetition** drives when each item is due again.

## Goals / Non-Goals

**Goals:**

- Three tracks: **LeetCode**, **High-level system design**, **Low-level system design**.
- CRUD-light: add/edit/delete **topics** and **items** (title, optional URL, optional notes).
- **Review session**: user picks quality **Again | Hard | Good | Easy**; system updates interval and **next due** (date-only, local timezone).
- **Due list**: items with `nextDueDate <= today` (or never reviewed) surfaced on a home/dashboard view.
- **localStorage**: single JSON document, version field, debounced writes.

**Non-Goals:**

- Login, sync, multi-device.
- LeetCode API or embedded judge.
- Server-side analytics.

## Decisions

1. **SRS algorithm (SM-2–style)**  
   - Store per item: `ease` (default 2.5), `intervalDays` (default 0 until first review), `repetitions`, `lastReviewedAt`, `nextDueDate`.  
   - On review, map quality → numeric grade: Again=0, Hard=1, Good=2, Easy=3.  
   - If grade < 2: reset repetitions to 0, set interval to 1 day (Again) or min(1, previous) for Hard—use simple rule: **Again → 1 day**, **Hard → max(1, floor(interval/2)) or 1**, **Good/Easy → SM-2 interval update** (standard formula: interval = previous * ease; repetitions++; adjust ease by grade).  
   - **nextDueDate** = start of local day + intervalDays.  
   - Rationale: one pure module (`srs.ts`) keeps UI testable.

2. **Data model**  
   - `AppState`: `{ version, tracks: { leetcode|hld|lld: { topics: Topic[] } } }`  
   - `Topic`: `{ id, title, itemIds[] }` or nested `items[]` — prefer **flat items with topicId** for simpler updates: `items: Item[]` per track keyed by track id, topics hold metadata only. Simpler: each track has `topics: { id, title, items: Item[] }`.  
   - `Item`: `{ id, title, url?, notes?, srs }`.

3. **Routing**  
   - Hash or path segments: `/`, `/track/:id`, `/track/:id/topic/:topicId`, `/item/:trackId/:topicId/:itemId`, `/due`. Template may use minimal client router (state in React) to avoid new deps.

4. **Persistence**  
   - Key `interview-prep-v1`. On load: parse JSON; if missing, seed empty structure + optional demo topics. On change: debounce 300ms write.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| localStorage quota | Keep notes short; export JSON for backup |
| Clock change / timezone | Date-only due compares using local calendar day |
| Schema drift | `version` field + migration function stub |

## Migration Plan

N/A (new app state). Future: bump version and migrate in load path.

## Open Questions

- Export/import in v1 vs v2 — **include minimal export/import** in v1 for safety.
