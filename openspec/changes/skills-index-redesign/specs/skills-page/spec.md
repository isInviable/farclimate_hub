# Spec Delta

## ADDED Requirements

### Requirement: Skills index renders the training hero
The skills index SHALL show a two-part hero under the same site top bar used by the how-to page. The wider part SHALL show the sea-glass photograph on a yellow field, with a localized kicker, title, and lede. The narrower part SHALL show a localized topic heading and a fixed topic list. Copy SHALL be provided in English, Spanish, and Italian. The page SHALL NOT use a transparent header over the hero.

#### Scenario: Spanish hero and topics
- **WHEN** a user visits the Spanish skills index
- **THEN** the hero shows "FORMACIÓN", "CURSOS EN LÍNEA", and "Acércate a conocimiento relevante a través de cursos en línea que te ayuden a afrontar los retos climáticos y potenciar tu proyecto."
- **THEN** the topic column shows "CURSOS Y RECURSOS DE DIFERENTES TEMAS COMO:" followed by Agricultura, Análisis de ciclo de vida, Biodiversidad, Pesca, Silvicultura, and Taxonomía de la UE

#### Scenario: English and Italian translations
- **WHEN** a user visits the skills index in English or Italian
- **THEN** the kicker, title, lede, topic heading, and six topics are the translations of the Spanish copy
- **THEN** the English topics read Agriculture, Life-cycle assessment, Biodiversity, Fisheries, Forestry, and EU taxonomy

#### Scenario: Site top bar
- **WHEN** the skills index loads at any width
- **THEN** the page shows the ADAPTARIUM wordmark, the language switcher, the session control, and the menu button
- **THEN** the wordmark links to the home page

#### Scenario: Topics do not filter
- **WHEN** a user views the topic column
- **THEN** the topics are text
- **THEN** selecting a topic does not hide or reorder skills

### Requirement: Skills index lists published skills
The skills index SHALL list every published skill for the active locale, newest publication first. Each card SHALL show the localized title, the summary taken from the content before the more marker, and a localized learn-more link to that skill's detail page. The index SHALL NOT show a cover image, date, read time, or tag badges on the card, and SHALL NOT offer tag filters or sort controls.

#### Scenario: Cards display published skills
- **WHEN** the skills index renders published skills
- **THEN** each card shows that skill's localized title and summary
- **THEN** the learn-more control links to that skill's detail page
- **THEN** the card does not show the header image, publication date, read time, or tags

#### Scenario: Locale follows the visitor
- **WHEN** a user switches the site language on the skills index
- **THEN** titles, summaries, and the learn-more label reload for that locale, falling back to English when a skill has no content in the selected locale

#### Scenario: Empty published skills state
- **WHEN** no published skills are available for the current locale
- **THEN** the page shows an empty state
- **THEN** the empty state does not tell the user to adjust filters

#### Scenario: No filters
- **WHEN** the skills index renders
- **THEN** the page does not show tag checkboxes, tag counts, or sort options

## MODIFIED Requirements

### Requirement: SkillCard is a reusable component
The skill card SHALL accept one published skill and SHALL render that skill's title, summary, and detail link without duplicating the card markup for each skill. A decorative sea-glass stone SHALL sit with the learn-more label. Stones SHALL be chosen from the seven local stone images and SHALL vary across the list.

#### Scenario: SkillCard renders from prop data
- **WHEN** a skill card is given a published skill
- **THEN** it renders that skill's title, summary, and a link to the skill detail page
- **THEN** the learn-more label is "Saber más" in Spanish, "Learn more" in English, and "Scopri di più" in Italian

#### Scenario: Stones cycle
- **WHEN** the catalog renders more than seven skills
- **THEN** stones repeat from the start of the seven-image set
- **THEN** the label is HTML text, not text painted into the image

## REMOVED Requirements

### Requirement: Skills page renders hero section
**Reason**: The photo hero and transparent overlay header are replaced by the training hero and the how-to site top bar.
**Migration**: Use the training hero requirement. The detail page is unchanged.

### Requirement: Skills page renders a grid of skill cards
**Reason**: Cover image, date, read time, tags, and the Read button are replaced by title, summary, and a localized learn-more link.
**Migration**: Use the published-skills list requirement. Detail pages still show the header image and body.

### Requirement: Skills page filters by Supabase tags
**Reason**: The training redesign has no filters. The topic column is fixed translated copy.
**Migration**: The index lists every published skill. Tags remain on the skill and on the detail page.

### Requirement: Skills page renders a filter sidebar
**Reason**: The training redesign has no sidebar and no sort controls.
**Migration**: Remove the sidebar from the index. Publication order stays newest first.
