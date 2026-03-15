## 1. Static content and progress model

- [x] 1.1 Update the bundled content schema to support nested topic groups and display-only study items with stable IDs
- [x] 1.2 Migrate placeholder content files so the app can render bundled item rows directly in the sidebar
- [x] 1.3 Refactor persisted progress to store completion date, completion count, and next due date keyed by bundled item IDs

## 2. Scheduling behavior

- [x] 2.1 Replace multi-choice review actions with a checkbox-completion scheduling flow
- [x] 2.2 Implement a deterministic revisit ladder for checkbox completions and reuse it in Home and Schedule data
- [x] 2.3 Update schedule selectors so day, week, and month views reflect upcoming bundled item revisits

## 3. Layout simplification

- [x] 3.1 Remove non-essential panels such as the right-side study nook and simplify the main page composition
- [x] 3.2 Build a traditional left sidebar with track selection and nested collapsible topic groups
- [x] 3.3 Add a sidebar collapse control and preserve navigation usability in collapsed state

## 4. Display-only study interaction

- [x] 4.1 Remove item authoring controls such as add item, URL, and notes inputs from the UI
- [x] 4.2 Render each bundled study item as a display row with a small completion checkbox
- [x] 4.3 Update Home to show a welcome view plus today's due bundled items without secondary clutter

## 5. Fit and finish

- [x] 5.1 Align styling with a cleaner, more cohesive visual system around the simplified sidebar-first layout
- [x] 5.2 Verify that bundled progress reloads correctly and that scheduled revisits appear after completion events
