# Demo prototype links

Skills and Connected Action in the public nav temporarily open external prototypes. This is for a demo. The in-app pages are still in the repo.

| Nav item | Temporary target |
| --- | --- |
| Skills (`training`) | https://adaptarium-skills.pages.dev/skills/ |
| Connected Action (`network`) | https://connected-action-v2.pages.dev/connected/ |

Both URLs live in `apps/web/app/constants/siteNav.ts` as `demoSkillsUrl` and `demoConnectedUrl`. These consumers read those constants:

- The home index rail (`SiteNavVertical`) and the header menu (`SiteNavOverlay`), through `siteNavItems`.
- `SiteHeader.vue`, which is only mounted by the unused `default` layout.

`/skills`, `/connected`, and their child routes are unchanged. Typing those paths still opens the in-app pages. The footer links in `content/{en,es,it}/footer.json` still point at `/skills` and `/connected/dashboard`.

`NuxtLinkLocale` already treats an `https://` target as an external link, so no component was changed to make this work.

## Revert

After both prototypes are integrated into this app:

1. In `apps/web/app/constants/siteNav.ts`, set `demoSkillsUrl` back to `/skills` and `demoConnectedUrl` back to `/connected`. `siteNavItems` and `SiteHeader.vue` both import those constants, so this one edit restores every nav link. You can then delete the two constants and inline the paths if you prefer.
2. In `apps/web/tests/utils/siteNav.test.ts`, set the `training` and `network` expectations back to `/skills` and `/connected`.
3. Delete this file and remove the "Skills and Connected nav point at demo prototypes" subsection from `docs/README.md`.
