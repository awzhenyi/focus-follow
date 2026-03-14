# spaced-repetition Specification

## Purpose
TBD - created by archiving change interview-prep-spaced-repetition. Update Purpose after archive.
## Requirements
### Requirement: Mark reviewed with quality

The system SHALL let the user mark an item as reviewed by choosing one of: Again, Hard, Good, Easy. The system MUST update that item’s spaced-repetition state and compute the next due date in local calendar days.

#### Scenario: User marks Good after study

- **WHEN** the user completes a review and chooses Good (or Easy / Hard / Again)
- **THEN** the system updates last reviewed time, interval, and next due date according to the SRS rules in design

### Requirement: Due and overdue items

The system SHALL list items that are due on the current local date or earlier (overdue), across all tracks. Items that have never been reviewed MAY appear as due for first study.

#### Scenario: User sees due today

- **WHEN** the user opens the due view and at least one item has next due date on or before today
- **THEN** those items are listed with track/topic context

### Requirement: Home recap for today

The Home view SHALL summarize the study work due today. The system MUST present the topics or items that need to be revisited on the current local date.

#### Scenario: Home shows today's recap

- **WHEN** the user opens Home and there are items due today
- **THEN** the system shows today's due study content grouped with track and topic context

### Requirement: Schedule calendar views

The Schedule view SHALL provide calendar-based review planning for upcoming study work. The system MUST support day, week, and month views that show which topics or items need to be revisited during the selected period.

#### Scenario: User views upcoming week

- **WHEN** the user switches the Schedule view to week mode
- **THEN** the system shows the review work due during the next seven days

#### Scenario: User views calendar month

- **WHEN** the user switches the Schedule view to month mode
- **THEN** the system shows due counts or due entries for the days in that month

