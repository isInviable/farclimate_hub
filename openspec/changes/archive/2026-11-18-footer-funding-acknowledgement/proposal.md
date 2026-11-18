# Proposal

## Why

Horizon Europe and SERI require the FARCLIMATE site to show the project and funder marks plus the official funding statement. The public footer currently ends at the copyright line and the privacy links, so that acknowledgement is missing on every page that uses the site footer.

## What Changes

- Add a logo row in `SiteFooter`, directly above the existing copyright and legal-links bar.
- Show three marks in this order: the white FARCLIMATE logo, the white EU “Funded by the European Union” outline, then a white inverse of the Swiss SERI / EU Framework Programme mark.
- Add a second row under the logos with the supplied English funding disclaimer.
- Leave the copyright line, legal links, menu columns, and footer content files unchanged.

## Capabilities

### New Capabilities

- `site-footer`: Funding marks and the grant disclaimer shown in the public site footer, above the copyright and legal links.

### Modified Capabilities

- None. `site-navigation` only requires that public pages render the existing site footer; it does not specify footer contents.

## Impact

- `apps/web/app/components/global/SiteFooter.vue` — two new rows inside the existing dark footer container.
- `apps/web/public/img/logos/` — reuse `logo farclimate blanco.svg` and `EN_FundedbytheEU_RGB_WHITE Outline.png` as they are. Add a white inverse of `WBF_SBFI_EU_Frameworkprogramme_E_RGB_pos_quer.ai.svg` and keep the colored source file.
- Every layout that renders `SiteFooter` (home, site, stories, solutions, article, connected, default) picks up the rows with no layout edits.
- The disclaimer is the English text supplied for this change, shown on every locale. It is not added to `content/*/footer.json`.

## Assumptions

- The EU file on disk is a PNG (`EN_FundedbytheEU_RGB_WHITE Outline.png`), already a white outline, and is used as-is.
- The FARCLIMATE file (`logo farclimate blanco.svg`) is already white and is used as-is.
- “All text and logos in white” on the Swiss mark means dark wordmark paths become white, the red shield becomes white, and the cross is knocked out so the dark footer shows through it. A solid white cross on a solid white shield would disappear.
- The three marks are images with accessible names, not links.
