# Tasks

## 1. White Swiss mark

- [x] 1.1 Add `apps/web/public/img/logos/WBF_SBFI_EU_Frameworkprogramme_E_RGB_neg_quer.svg` from the positive source: root fill white, shield white, cross knocked out with a mask so the background shows through, and no red left. Verify the positive file `WBF_SBFI_EU_Frameworkprogramme_E_RGB_pos_quer.ai.svg` is unchanged and the new file contains no `fill:red` or `#212125`.

## 2. Footer rows

- [x] 2.1 In `apps/web/app/components/global/SiteFooter.vue`, insert a funding block between the menu grid and the copyright bar: a wrapping row of three `h-12` images (FARCLIMATE SVG, EU PNG, Swiss `neg` SVG) with the alt text from design.md, then the English disclaimer paragraph. Leave `content/*/footer.json` and the copyright bar unchanged. Verify the template order is marks, disclaimer, copyright, and that the disclaimer string matches the spec, including grant agreement No 101112860.

## 3. Footer check

- [x] 3.1 Open a page that renders the site footer on a wide viewport and a narrow one, and open a Spanish or Italian page. Verify the three marks appear in order above the disclaimer, the Swiss wordmark and shield are white with a visible cross, the full English disclaimer is present, and the copyright line and legal links are still there.
