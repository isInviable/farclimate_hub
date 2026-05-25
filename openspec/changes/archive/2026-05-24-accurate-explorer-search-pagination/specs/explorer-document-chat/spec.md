## ADDED Requirements

### Requirement: Explorer chat can use accumulated loaded search hits

The explorer document chat SHALL be able to use the accumulated loaded hits for the active search signature as its result context. The accumulated set SHALL include hits loaded across multiple pages for the same search signature.

#### Scenario: User loads multiple pages before chatting

- **WHEN** the user loads page 1 and page 2 for the same active search and opens chat with results
- **THEN** the chat context source set SHALL include eligible hits from both loaded pages

#### Scenario: User changes active search before chatting

- **WHEN** the active search signature changes
- **THEN** the accumulated chat source set SHALL reset to the hits loaded for the new search only

### Requirement: Chat context remains bounded

The system SHALL preserve existing chat context limits or truncation behavior when using accumulated loaded hits, so loading multiple pages does not require sending every loaded article in full to the model.

#### Scenario: Loaded hits exceed chat context budget

- **WHEN** accumulated loaded hits exceed the configured chat context budget
- **THEN** the chat implementation SHALL apply its existing selection, truncation, or summarization strategy before sending context to the model
