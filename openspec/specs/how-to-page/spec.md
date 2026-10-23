# how-to-page Specification

## Purpose

Provides a "How to use the solutions" page that guides users step by step through the solutions database, with texts and images editable per locale.

## Requirements

### Requirement: How-to route
The site SHALL serve the how-to page at `/how-to`, `/es/how-to`, and `/it/how-to`, using the new top bar and overlay navigation.

#### Scenario: Reach from the menu
- **WHEN** the user selects "¿Cómo usar las soluciones?" in the overlay
- **THEN** `/es/how-to` opens with the new top bar

### Requirement: Step-by-step guide
The page SHALL show a header band in the section's blue color with a title and introduction, followed by seven numbered steps, each with a title, a short description, and an illustrative image with alternative text.

#### Scenario: Seven steps
- **WHEN** a user opens the how-to page
- **THEN** seven steps numbered 1 to 7 are shown in order, each with its image

#### Scenario: Alternating layout on desktop
- **WHEN** the page is viewed at 1024px or wider
- **THEN** step images alternate between the left and right sides; below 1024px each step stacks image and text

### Requirement: Call to action to solutions
The page SHALL end with a call to action that opens the solutions explorer in the current locale.

#### Scenario: Go to solutions
- **WHEN** the user activates the final call to action
- **THEN** the solutions explorer opens

### Requirement: Localized editable content
All how-to texts and image references SHALL come from per-locale content files (en, es, it), falling back to English when a locale is missing.

#### Scenario: Replace a step image
- **WHEN** an editor changes the image path of step 3 in the English content file and the site is rebuilt
- **THEN** the English page shows the new image for step 3 without component code changes

### Requirement: How-to prerendered
The how-to page SHALL be statically prerendered for every locale.

#### Scenario: Build output
- **WHEN** the site is built
- **THEN** `/how-to`, `/es/how-to`, and `/it/how-to` are emitted as prerendered HTML
