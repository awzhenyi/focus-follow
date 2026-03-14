## ADDED Requirements

### Requirement: Persist state without login

The system SHALL persist user study progress and spaced-repetition state using browser localStorage so progress survives page reload and browser restart. No authentication SHALL be required.

#### Scenario: Reload preserves data

- **WHEN** the user adds or edits data and reloads the application
- **THEN** the same data is loaded from localStorage

### Requirement: Bundled content is the source of topic structure

The system SHALL read the fixed track and topic structure from bundled static content files in the application source. localStorage SHALL store user state associated with that structure, and SHALL NOT be the source of truth for creating or removing topics.

#### Scenario: First load uses bundled content

- **WHEN** the application is opened with no existing localStorage data
- **THEN** the system initializes user progress against the bundled track and topic definitions

### Requirement: Schema version

The persisted document MUST include a version number. The system SHALL tolerate missing keys by applying defaults on load.

#### Scenario: First visit

- **WHEN** no persisted data exists
- **THEN** the system initializes versioned user progress state using the bundled track and topic definitions and saves on first change

### Requirement: No manual backup import or export

The system SHALL NOT expose JSON export or JSON import features in the UI for v1.

#### Scenario: User looks for backup controls

- **WHEN** the user navigates the application
- **THEN** the UI does not display import or export actions
