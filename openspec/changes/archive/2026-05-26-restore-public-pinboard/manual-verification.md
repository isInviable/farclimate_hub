## Manual Verification

- Sign in as a project owner and open `/explorer/board`.
- Click **Share board** and copy the generated link.
- Confirm the copied URL uses `/explorer/board/public/:token` and does not contain the project UUID.
- Open the link in an anonymous/incognito session and confirm the board title and pins render read-only.
- Open the link as a different authenticated user and confirm the same read-only public board renders.
- Confirm edit, delete, reorder, selection, artifact generation, and saved-search controls are absent or disabled on the public board.
- Confirm an invalid token route shows the existing error state instead of private project data.
