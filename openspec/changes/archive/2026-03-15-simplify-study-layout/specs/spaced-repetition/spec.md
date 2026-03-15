## ADDED Requirements

### Requirement: Completion checkbox schedules revisit

The system SHALL schedule a future revisit when a user marks a bundled study item complete via its checkbox. The system MUST record the completion date and compute the next revisit date using the configured scheduling ladder.

#### Scenario: User checks an item complete

- **WHEN** the user marks a bundled study item complete
- **THEN** the system records the completion date and assigns the next revisit date for that item

## MODIFIED Requirements

### Requirement: Due and overdue items

The system SHALL list bundled study items that are due on the current local date or earlier (overdue), across all tracks. An item becomes due according to the revisit schedule generated from prior completion events.

#### Scenario: User sees due today

- **WHEN** the user opens Home or Schedule and at least one bundled study item has next due date on or before today
- **THEN** those items are listed with track and topic context

### Requirement: Home recap for today

The Home view SHALL summarize the bundled study items due today. The system MUST present the scheduled items that need to be revisited on the current local date.

#### Scenario: Home shows today's recap

- **WHEN** the user opens Home and there are bundled study items due today
- **THEN** the system shows today's due study items grouped with track and topic context

### Requirement: Schedule calendar views

The Schedule view SHALL provide calendar-based review planning for upcoming bundled study work. The system MUST support day, week, and month views that show which study items need to be revisited during the selected period after being scheduled from prior completions.

#### Scenario: User views upcoming week

- **WHEN** the user switches the Schedule view to week mode
- **THEN** the system shows the bundled study items due during the next seven days

#### Scenario: User views calendar month

- **WHEN** the user switches the Schedule view to month mode
- **THEN** the system shows due counts or due entries for the days in that month

## REMOVED Requirements

### Requirement: Mark reviewed with quality

**Reason**: The revised interaction replaces multi-choice review grading with a simpler checkbox completion model.

**Migration**: Use bundled study-item completion checkboxes to trigger revisit scheduling instead of Again / Hard / Good / Easy review controls.
