## Context

The archived baseline change established a pastel learning app with `Home` and `Schedule`, but the current interaction model still feels fragmented: multiple panels compete for attention, the right-side study nook does not advance the core workflow, and the UI still includes authoring behaviors for items even though the study content is intended to come from bundled files. The new direction is to make the app feel closer to a conventional study navigator: a collapsible left sidebar with structured topics and questions, a cleaner primary content area, and one clear interaction for completion.

The user also provided a sidebar reference showing a nested tree of categories and items. That implies the bundled content should no longer stop at topics alone; it should support nested question/item definitions so the UI can render them directly without creation forms.

## Goals / Non-Goals

**Goals:**

- Replace the current multi-panel composition with a cleaner layout centered on a traditional collapsible left sidebar and a primary content surface.
- Remove non-essential UI pieces such as the right-side study nook.
- Treat bundled content files as the full source of display structure for tracks, topics, and study items.
- Show questions/items directly in the sidebar, with a small checkbox beside each one for marking completion.
- Record the completion date when an item is checked and use that event to compute the next scheduled revisit date.
- Reflect scheduled revisits in `Home` and `Schedule`.

**Non-Goals:**

- Freeform creation or editing of study items, URLs, or notes in the UI.
- Multiple review-quality actions such as Again / Hard / Good / Easy for this iteration.
- New backend services, auth, sync, or collaborative features.

## Decisions

1. **Bundled content becomes a nested tree**
   - Change the bundled content schema from track -> topics to track -> topic groups -> items (or topic -> items where nesting depth can be represented as expandable groups).
   - Every displayed item must have a stable identifier so persisted completion state survives content reloads and schedule calculations.
   - Rationale: the requested sidebar reference is item-dense and navigational; the app should render that structure directly instead of generating items from user input.
   - Alternative considered: keep sidebar only for topics and render items in the main panel. Rejected because the request explicitly points to a sidebar with visible item rows and checkboxes.

2. **Checkbox completion replaces authored review controls**
   - Replace rich review actions with a single completion checkbox on each bundled item.
   - Checking an item records a completion event `{ completedAt, completionCount }` and recomputes the next revisit date.
   - Rationale: this matches the simpler requested flow and reduces friction.
   - Alternative considered: preserve the existing Again / Hard / Good / Easy controls behind a detail panel. Rejected because the user explicitly asked to remove extra features and keep display-focused interaction.

3. **Scheduling uses a deterministic ladder**
   - Because the interaction is now binary (completed vs not completed), use a fixed revisit ladder such as `1d -> 3d -> 7d -> 14d -> 30d`.
   - Each completion advances the item to the next interval; first completion starts at the first interval.
   - Persist `lastCompletedAt`, `completionCount`, and `nextDueDate`.
   - Rationale: predictable, easy to explain, and compatible with checkbox-only input.
   - Alternative considered: adapt SM-2 to a binary checkbox. Rejected because it introduces invisible complexity without meaningful extra signal.

4. **Sidebar-first layout**
   - The left sidebar contains track selection plus nested collapsible groups for the active track's topics/items.
   - The sidebar supports collapsed and expanded states; collapse preserves navigation but reduces width for focus.
   - The main area is simplified to `Home` and `Schedule` content, without the separate right-side panel.
   - Rationale: aligns the UI with the reference and removes the “different blobs joined together” feeling.

5. **Persistence stores progress only**
   - Bundled content remains read-only application data.
   - localStorage stores only user progress keyed by bundled item IDs.
   - On load, merge bundled content with saved progress using stable IDs.
   - Rationale: keeps authored content and user state clearly separated.

## Risks / Trade-offs

- **[Bundled content shape changes later] -> Mitigation:** require stable IDs for tracks, groups, and items; document the schema clearly in tasks.
- **[Checkbox interaction may feel too coarse for long-term spaced repetition] -> Mitigation:** keep scheduling logic isolated so richer review inputs can be reintroduced later without rewriting layout.
- **[Very large sidebars could become hard to scan] -> Mitigation:** support collapsible groups and a collapsible whole sidebar from the start.
- **[Calendar still needs meaningful grouping after removing item editing] -> Mitigation:** group scheduled results by topic and track in `Home` and `Schedule`.

## Migration Plan

1. Replace the existing content schema with nested static item definitions and migrate current placeholder content to that format.
2. Migrate persisted state from item-authored records to progress-only records keyed by bundled item IDs.
3. Remove item authoring affordances and right-side study nook from the app shell.
4. Introduce checkbox completion and deterministic revisit scheduling.
5. Update `Home` and `Schedule` to read from the new scheduled data model.

## Open Questions

- Whether checking an already-completed item again on the same day should be ignored or advance the schedule again. Default assumption for implementation: a deliberate re-check after the item becomes due again advances it once.
