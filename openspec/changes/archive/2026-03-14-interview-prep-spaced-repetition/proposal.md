## Why

Interview prep spans LeetCode, high-level system design (HLD), and low-level system design (LLD). Learners need one place to track questions/topics and **revisit them on a schedule** so knowledge sticks—without the overhead of accounts or a backend.

## What Changes

- New **local-first web app** (Bun + React) with three **tracks**: LeetCode, high-level system design, low-level system design.
- Each track supports **topics** (subtopics) and **items** (questions/tasks) with title, optional URL and notes.
- **Mark reviewed**: user records a session; the app updates **spaced repetition** state and **next due date**.
- **Due today / overdue** view across all tracks.
- **Persistence**: all state in **localStorage** (versioned JSON); no login/auth.
- Optional **export/import JSON** for backup (can ship in v1 or follow-up).

## Capabilities

### New Capabilities

- `interview-prep-tracks`: Three learning components (LeetCode, HLD, LLD), nested topics and items, navigation between track → topic → item.
- `spaced-repetition`: Scheduling next review from review quality (Again / Hard / Good / Easy); SM-2–style intervals; due and overdue lists.
- `local-persistence`: Load/save app state to localStorage; schema version for future migrations.

### Modified Capabilities

- (none — greenfield app)

## Impact

- **New UI** in existing React app (`src/`), replacing or extending the default template shell.
- **New modules**: SRS pure functions, storage adapter, TypeScript domain types.
- **Dependencies**: no new required deps for v1 (browser APIs only); optional date handling stays in user land.
