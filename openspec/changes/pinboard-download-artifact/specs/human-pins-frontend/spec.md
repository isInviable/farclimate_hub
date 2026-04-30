## ADDED Requirements

### Requirement: Pinboard artifacts include a Downloads section

The board Artifacts UI SHALL include a **Downloads** subsection (alongside existing subsections such as Podcasts) for `human.artifacts` rows with `kind = 'pinboard_export'`. The subsection SHALL list export artifacts for the active project with status, title or fallback label, created time when available, and actions to download when `status = 'ready'`.

#### Scenario: Downloads section is visible

- **WHEN** an authenticated user opens `/explorer/board` with an active owned project
- **THEN** the Artifacts area SHALL show a Downloads subsection even if no exports exist yet

#### Scenario: Ready exports offer download

- **WHEN** the project has a `ready` pinboard export artifact
- **THEN** the Downloads list SHALL offer download using authenticated Storage access (e.g. signed URL) consistent with other artifacts

#### Scenario: Pending exports show progress state

- **WHEN** a pinboard export artifact is `pending`
- **THEN** the UI SHALL show a non-ready state and SHALL poll or periodically refetch artifact list until the artifact becomes `ready` or `failed` or the user leaves the context

### Requirement: User can generate a new pinboard download

The Downloads subsection SHALL provide a control (e.g. button) **Generate new download** that calls the server export endpoint for the **whole** pinboard of the active project. The UI SHALL disable or guard the action when there is no project, when the user is not authenticated, or when a duplicate in-flight policy applies (implementation MAY allow parallel exports or throttle with clear feedback).

#### Scenario: Generate triggers export job

- **WHEN** the user activates Generate new download under valid conditions
- **THEN** the client SHALL call the pinboard export API for the current project
- **AND** a new `pending` artifact SHALL appear in the list without a full page reload

#### Scenario: Failed export is visible

- **WHEN** an export ends in `failed`
- **THEN** the Downloads list SHALL show failure state and an actionable message where possible
