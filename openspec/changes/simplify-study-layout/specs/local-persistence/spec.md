## MODIFIED Requirements

### Requirement: Persist state without login

The system SHALL persist user study progress and spaced-repetition state using browser localStorage so progress survives page reload and browser restart. Persisted progress MUST include completion metadata for bundled study items, including at least the most recent completion date, completion count, and next due date. No authentication SHALL be required.

#### Scenario: Reload preserves completion state

- **WHEN** the user marks a bundled study item complete and reloads the application
- **THEN** the same completion metadata and scheduled revisit date are loaded from localStorage

### Requirement: Bundled content is the source of topic structure

The system SHALL read the fixed track, topic-group, and bundled study-item structure from static content files in the application source. localStorage SHALL store progress associated with those bundled identifiers and SHALL NOT be the source of truth for creating or removing topics or study items.

#### Scenario: First load uses bundled study content

- **WHEN** the application is opened with no existing localStorage data
- **THEN** the system initializes progress state against the bundled tracks, topic groups, and study items

### Requirement: Schema version

The persisted document MUST include a version number. The system SHALL tolerate missing keys by applying defaults on load and SHALL support migrating prior progress formats into the new bundled-item progress model.

#### Scenario: First visit

- **WHEN** no persisted data exists
- **THEN** the system initializes versioned progress state using the bundled study-item definitions and saves on first change
