## ADDED Requirements

### Requirement: Sidebar displays nested bundled study items

The system SHALL render bundled study items directly inside the left sidebar under collapsible topic groups for the active track. Each displayed item row MUST include a small completion checkbox.

#### Scenario: User expands a topic group in the sidebar

- **WHEN** the user expands a topic group for the active track
- **THEN** the sidebar displays the bundled study items for that group with a checkbox beside each item

## MODIFIED Requirements

### Requirement: Global navigation structure

The system SHALL provide a top navigation bar with exactly two primary destinations: Home and Schedule. The system SHALL also provide a traditional left sidebar for the three fixed learning tracks: LeetCode, High-level system design (HLD), and Low-level system design (LLD). The sidebar MUST support collapsed and expanded states.

#### Scenario: User switches track from the sidebar

- **WHEN** the user clicks a track entry in the sidebar
- **THEN** the main content area displays the selected track's bundled study structure

#### Scenario: User collapses the sidebar

- **WHEN** the user activates the sidebar collapse control
- **THEN** the sidebar reduces to a compact navigation state while preserving track access

### Requirement: Fixed track topics from bundled content

The system SHALL load each track's topic groups and bundled study items from a static content folder in the application source. The user SHALL NOT be allowed to add, rename, or delete topics or bundled study items from the UI.

#### Scenario: App loads bundled topics

- **WHEN** the application starts
- **THEN** it reads the bundled content files and displays the fixed topic groups and study items defined for each track

#### Scenario: Topic creation is not available

- **WHEN** the user views the study navigation UI
- **THEN** the UI does not offer controls to add, rename, or delete topics or bundled study items

### Requirement: Study items within fixed topics

The system SHALL display bundled study items within their fixed topic groups and SHALL NOT expose add, edit, or delete controls for those items. Each bundled item MUST be renderable as a selectable study row with a completion checkbox.

#### Scenario: User views bundled study items

- **WHEN** the user opens a topic group
- **THEN** the bundled study items appear as display-only rows with completion checkboxes

### Requirement: Home dashboard

The Home destination SHALL serve as the landing view for the app. It SHALL show a welcome message and a recap section listing the bundled study items due today.

#### Scenario: User opens Home

- **WHEN** the user clicks Home in the top navigation
- **THEN** the system shows a welcome message and today's due bundled study items

## REMOVED Requirements

### Requirement: Item detail and review access

**Reason**: The revised experience removes secondary detail-oriented review surfaces in favor of a simpler sidebar-first display and checkbox-based completion flow.

**Migration**: Render bundled items directly in the sidebar or primary content area and use checkbox completion plus scheduled revisit views instead of a dedicated item detail workflow.
