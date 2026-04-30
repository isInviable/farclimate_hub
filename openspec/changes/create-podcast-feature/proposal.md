## Why

The pinboard already exposes a dummy "create podcast" action, but users cannot turn selected pins into a reviewed podcast artifact from the board UI. This change makes the action useful by guiding users through selection review, script generation, and audio generation while surfacing completed podcasts in the pinboard artifacts area.

## What Changes

- Replace the dummy create podcast action in the pinboard action bar with a multi-step podcast wizard.
- Step 1 lets the user review selected pins, validates configured document/text limits, enter extra prompt instructions, and provide a podcast title.
- Step 2 calls the existing podcast summary endpoint, shows a loading state, and renders the returned script in an editable text area.
- Step 3 sends the reviewed script to the existing podcast text-to-speech endpoint and tells the user the audio will appear in the board artifacts section when ready.
- Add a visible Artifacts section to the board page, starting with Podcasts.
- Show podcast help text when no podcasts are available, and show listen/download controls when podcast artifacts exist.
- No backend endpoint creation is planned; the UI will consume the endpoints from the previous podcast API spec.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `human-pins-frontend`: Add pinboard podcast creation flow and board artifact podcast listing behavior.

## Impact

- Affected UI: `apps/web/app/components/explorer/wf/ActionBarBoard.vue`, `apps/web/app/pages/explorer/board/index.vue`, and likely supporting composables/components for the wizard and artifact list.
- Affected APIs: existing `POST /api/podcast-summarize` and `POST /api/podcast-text-to-speech` are consumed by the frontend.
- Affected data: existing `human.artifacts` podcast rows are read to populate the Podcasts artifacts section.
- Configuration: frontend validation should use the same selected-item/text-size limits expected by the podcast endpoints, exposed through existing app config or a shared constant where available.
