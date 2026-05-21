# human-pins-frontend (delta)

Requirements added by change `explorer-chat-pins-and-citations` for full-thread chat pins and optional stored citations.

---

## ADDED Requirements

### Requirement: Full-thread chat pins may include citations metadata

When `body_kind` is `chat` and `body.data.citationsByMessageId` is a non-empty object, the pinboard chat renderer SHOULD display citation titles under the matching assistant messages when rendering the saved thread, using the stored `title` and `documentUid` fields. Opening a stored citation SHOULD use the same `open-article` / explorer deep-link behavior as live corpus chat when `documentUid` is present.

Real-time sync or editing of saved threads is not required.

#### Scenario: Saved thread pin shows citations under assistant message

- **WHEN** a pin has `body_kind` `chat`, `data.messages` includes an assistant message with id `m1`, and `data.citationsByMessageId.m1` lists one citation with a title
- **THEN** the pin detail view SHALL show that title associated with the assistant message for `m1`

#### Scenario: Thread pin without citations metadata

- **WHEN** a `chat` pin has `messages` but no `citationsByMessageId`
- **THEN** the pin SHALL render messages only without citation rows
