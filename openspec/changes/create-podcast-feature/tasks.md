## 1. Podcast Wizard

- [x] 1.1 Replace the board page's demo podcast modal with a Nuxt UI wizard opened by the existing `ActionBarBoard` `open-podcast` event.
- [x] 1.2 Implement Step 1 with selected pin list, podcast title input, extra instructions textarea, and validation for empty selection, selected item count, and selected text size.
- [x] 1.3 Build `PodcastSelectedSource[]` from loaded board pin rows, preserving pin id, title/source snapshot, body kind, source document uid, user note, and best-available body text.
- [x] 1.4 Implement Step 2 loading state and `POST /api/podcast-summarize` call using the selected source payload and extra instructions.
- [x] 1.5 Render the returned podcast script in an editable textarea and surface endpoint validation/provider errors in the wizard.
- [x] 1.6 Implement Step 3 `POST /api/podcast-text-to-speech` call with active project id, reviewed script, title, selected source pin ids, and metadata.
- [x] 1.7 Show completion messaging that directs the user to the board Artifacts section after audio creation.

## 2. Podcast Artifacts Section

- [x] 2.1 Add an Artifacts section to `/explorer/board` with a Podcasts subsection that remains visible when no podcasts exist.
- [x] 2.2 Load `human.artifacts` rows for the active project where `kind = 'podcast'`, ordered newest first, using the authenticated Supabase client path.
- [x] 2.3 Render empty help text, loading, and error states for the Podcasts subsection.
- [x] 2.4 Render ready podcast artifacts with title/fallback label, useful metadata, audio playback, and download controls.
- [x] 2.5 Use authenticated private Storage access for playback/download instead of bundled demo media or public static URLs.
- [x] 2.6 Refresh or update the podcast list after the text-to-speech endpoint returns a created artifact.

## 3. Integration And Polish

- [x] 3.1 Remove unused demo podcast media modal code and static podcast share/download handlers from the board page.
- [x] 3.2 Ensure all new user-facing wizard and artifact strings use the existing i18n pattern.
- [x] 3.3 Keep the existing chat, insights, video, selection clearing, and board loading behavior unchanged.
- [x] 3.4 Add focused tests for selected source construction, wizard validation, summarize request flow, text-to-speech request flow, and artifact empty/list states where the current test setup supports them.
- [x] 3.5 Run typecheck/lint and any relevant frontend tests, then fix issues introduced by the change.
