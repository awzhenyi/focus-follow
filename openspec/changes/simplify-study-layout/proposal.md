## Why

The current study experience feels like several disconnected panels placed side by side, with authoring controls and side content that distract from the core review flow. The app should feel more focused and familiar: a traditional collapsible sidebar for navigation, static study content for users to browse, and a simple checkbox action that records completion and schedules the next revisit.

## What Changes

- Simplify the overall layout by removing unnecessary secondary panels such as the right-side study nook and consolidating the experience around a traditional left sidebar plus primary content area.
- Replace the current topic-and-item authoring flow with display-only study content sourced from bundled static files. Users will browse provided topics and questions instead of creating items, URLs, or notes in the UI.
- Add a collapsible left sidebar pattern that matches a more conventional study/navigation interface and supports nested content display similar to the attached sidebar reference.
- Change item interaction so each displayed question or study item includes a small checkbox for marking completion.
- When a user marks an item complete, store the completion date and use it to schedule the item for future review in the schedule experience.
- **BREAKING** Remove in-app item creation/editing affordances introduced by the previous change.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `interview-prep-tracks`: Simplify navigation and content presentation around a collapsible traditional sidebar and display-only static study items with completion checkboxes.
- `local-persistence`: Persist completion history and scheduled revisit state for bundled study items rather than user-authored content metadata.
- `spaced-repetition`: Trigger scheduling from checkbox completion events and reflect that revisit schedule in upcoming views.

## Impact

- Affected UI in `src/App.tsx` and related layout/view components.
- Static content schema and loader under `src/interview-prep/content/` will shift from topic summaries toward browsable nested study items.
- Local persistence shape will need to track item completion timestamps and upcoming review state keyed to bundled content identifiers.
- Existing item-authoring behaviors and supporting copy/styles will be removed or simplified.
