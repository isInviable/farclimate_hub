# site-navigation Specification

## Purpose

Defines the color-coded section navigation of the public site and the top bar with language and session controls, shared by every page that adopts the ADAPTARIUM design.

## Requirements

### Requirement: Section navigation items
The site navigation SHALL list six sections in this order, each with a fixed color: Solutions (orange, explorer), How to use the solutions (blue, `/how-to`), Stories (aqua, `/stories`), Training (brown, `/skills`), Networking (yellow, `/connected`), About us (mist, `/about`). Labels SHALL be localized in en, es, and it.

#### Scenario: Spanish labels
- **WHEN** the site is shown in Spanish
- **THEN** the items read "Soluciones", "¿Cómo usar las soluciones?", "Historias", "Formación", "Trabajo en red", "Quiénes somos"

#### Scenario: Locale-aware links
- **WHEN** the user is on the Italian site and selects "Storie"
- **THEN** the browser navigates to the Italian stories route

### Requirement: Vertical navigation on the home hero
On viewports of 1024px and wider, the home hero SHALL display the six items as a full-height vertical column of solid color bands on the right side, each band showing its uppercase label in the keyword font.

#### Scenario: Desktop home
- **WHEN** a user opens the home page on a 1280px-wide viewport
- **THEN** a column of six equal-height color bands fills the right side of the first screen

#### Scenario: Column scrolls with the hero
- **WHEN** the user scrolls past the hero
- **THEN** the column scrolls away with the hero and no hamburger button is shown at that width

### Requirement: Overlay navigation
A hamburger button SHALL open an overlay listing "Back to home" (mist) followed by the six section bands, with a close button. Selecting an item SHALL navigate and close the overlay; Escape or the close button SHALL close it without navigating.

#### Scenario: Open and navigate
- **WHEN** the user taps the hamburger and then "Historias"
- **THEN** the overlay closes and the stories page opens

#### Scenario: Dismiss
- **WHEN** the overlay is open and the user presses Escape
- **THEN** the overlay closes and the current page is unchanged

#### Scenario: Keyboard accessible
- **WHEN** a keyboard user opens the overlay
- **THEN** focus moves into the overlay and every item is reachable with Tab

### Requirement: Top bar controls
Pages using the new design SHALL show a language switcher (EN / ES / IT, active locale highlighted) and a session control ("Sign in" when signed out; sign-out when signed in). The hamburger button SHALL be shown below 1024px and on pages without the vertical column, and SHALL NOT be shown on the home at 1024px or wider. The stories index and each story article are the exception: they SHALL NOT show the top bar, the wordmark, the language switcher, or the session control, and SHALL show only a yellow hamburger that opens the same overlay at every viewport width.

#### Scenario: Mobile top bar
- **WHEN** a user opens the home on a 390px-wide viewport
- **THEN** a top bar shows the language switcher, "Iniciar sesión", and the hamburger, and no vertical column is shown

#### Scenario: Switch language
- **WHEN** the user selects "IT" in the language switcher
- **THEN** the same page reloads in Italian

#### Scenario: Sign in returns to page
- **WHEN** a signed-out user selects "Sign in"
- **THEN** the login page opens and, after signing in, the user returns to the page they came from

#### Scenario: Stories chrome
- **WHEN** a user opens the stories index or a story article at any width
- **THEN** the page shows the yellow hamburger and does not show the wordmark, the language switcher, or the session control

#### Scenario: Stories overlay
- **WHEN** the user activates the hamburger on a story article and then "Soluciones"
- **THEN** the overlay closes and the solutions explorer opens

### Requirement: Active section indication
When the current route belongs to a navigation section, that section's item SHALL be visually marked as active in the overlay and in the vertical column.

#### Scenario: Active on how-to
- **WHEN** the user opens the overlay on the how-to page
- **THEN** the "How to use the solutions" band is marked as active

### Requirement: Existing header preserved elsewhere
Pages not adopting the new design (admin, and pages still on the default layout) SHALL keep their current header unchanged. The about page adopts the public-site top bar and footer and is not part of this exception. Connected pages adopt the public-site top bar and are not part of this exception. Explorer pages, article pages, and login adopt the public-site top bar and are not part of this exception.

#### Scenario: Explorer header
- **WHEN** a user opens any explorer page, an article page, or login
- **THEN** the page shows the public-site top bar and does not show the previous site header

#### Scenario: About top bar
- **WHEN** a user opens the about page
- **THEN** the page shows the public-site top bar and the site footer and does not show the previous site header

#### Scenario: Default layout header
- **WHEN** a user opens a page that still uses the default layout
- **THEN** the page shows the same header as before the change

#### Scenario: Connected top bar
- **WHEN** a user opens the connected index or the connected dashboard
- **THEN** the page shows the public-site top bar and does not show the previous site header
