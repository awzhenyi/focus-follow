# interview-prep-tracks Specification

## Purpose
TBD - created by archiving change interview-prep-spaced-repetition. Update Purpose after archive.
## Requirements
### Requirement: Global navigation structure

The system SHALL provide a top navigation bar with exactly two primary destinations: Home and Schedule. The system SHALL also provide a sidebar that lists the three fixed learning tracks: LeetCode, High-level system design (HLD), and Low-level system design (LLD).

#### Scenario: User switches track from the sidebar

- **WHEN** the user clicks a track entry in the sidebar
- **THEN** the main content area displays the selected track's topics and study items

### Requirement: Fixed track topics from bundled content

The system SHALL load each track's topic list from a bundled static content folder in the application source. The user SHALL NOT be allowed to add, rename, or delete topics from the UI.

#### Scenario: App loads bundled topics

- **WHEN** the application starts
- **THEN** it reads the bundled content files and displays the fixed topics defined for each track

#### Scenario: Topic creation is not available

- **WHEN** the user views a track or topic page
- **THEN** the UI does not offer controls to add, rename, or delete topics

### Requirement: Study items within fixed topics

The system SHALL allow the user to add, edit, and delete study items within an existing fixed topic. Each item MUST have a title, and MAY include a URL and notes.

#### Scenario: User adds an item under a fixed topic

- **WHEN** the user creates an item under an existing topic with a title
- **THEN** the item appears within that topic and persists after reload

### Requirement: Home dashboard

The Home destination SHALL serve as the landing view for the app. It SHALL show a welcome message and a recap section listing the topics or study items that are due today.

#### Scenario: User opens Home

- **WHEN** the user clicks Home in the top navigation
- **THEN** the system shows a welcome message and today's recap content

### Requirement: Item detail and review access

The system SHALL provide a way to open an item's detail view showing title, optional URL, optional notes, next due date, and review actions.

#### Scenario: User opens item detail

- **WHEN** the user selects an item
- **THEN** the system shows the item's fields and spaced-repetition status

