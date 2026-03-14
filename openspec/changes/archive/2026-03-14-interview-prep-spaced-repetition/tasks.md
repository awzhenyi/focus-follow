## 1. Static content and data model

- [x] 1.1 Create a bundled static-content folder for LeetCode, HLD, and LLD topic definitions
- [x] 1.2 Define a stable schema for bundled tracks, topics, and topic identifiers so app logic can parse whatever content is placed in that folder
- [x] 1.3 Update app state to merge bundled topic structure with persisted user study progress

## 2. Persistence and scheduling core

- [x] 2.1 Update localStorage persistence so it stores only user progress and spaced-repetition state
- [x] 2.2 Remove JSON import and export support from the app flow
- [x] 2.3 Keep or refine the SRS module so review actions continue to compute next due dates in local calendar days

## 3. Navigation and track experience

- [x] 3.1 Build a top navigation bar with Home and Schedule destinations
- [x] 3.2 Build a sidebar with fixed track links for LeetCode, HLD, and LLD
- [x] 3.3 Replace topic CRUD with read-only bundled topics while keeping item management inside existing topics
- [x] 3.4 Update item detail and review flows to work within the new layout

## 4. Home and Schedule views

- [x] 4.1 Make Home the landing view with a welcome section and today's recap list
- [x] 4.2 Build a Schedule view with day, week, and month modes for upcoming review work
- [x] 4.3 Show due study content with track and topic context in both Home and Schedule views

## 5. Visual design refresh

- [x] 5.1 Refresh the app shell and surfaces with calming pastel colors and softer styling
- [x] 5.2 Preserve readability and accessible contrast while making the UI feel more playful and study-friendly
