# Spec Delta

## REMOVED Requirements

### Requirement: Step-by-step guide
**Reason**: The blue header and the alternating images are replaced by one stage, one shared screenshot, and a bottom row of steps.
**Migration**: Use the how-to stage, the first-step default, step selection, the narrow layout, and the how-to colors added in this change.

## MODIFIED Requirements

### Requirement: Call to action to solutions
The page SHALL show a call to action whose label is text beside its image. Activating it SHALL open the solutions explorer in the current locale.

#### Scenario: Go to solutions
- **WHEN** the user activates the call to action
- **THEN** the solutions explorer opens in the current locale

### Requirement: Localized editable content
All how-to texts and image references SHALL come from per-locale content files (en, es, it), falling back to English when a locale is missing.

#### Scenario: Replace a step image
- **WHEN** an editor changes the image path of step 3 in the English content file and the site is rebuilt
- **THEN** the English page shows the new image when step 3 is active, without component code changes

## ADDED Requirements

### Requirement: How-to stage
The page SHALL show one stage containing an introduction, one screenshot, and seven numbered steps. Each step SHALL have a title, a short description, and an illustrative image with alternative text. The screenshot SHALL show the image of the active step.

#### Scenario: Seven steps
- **WHEN** a user opens the how-to page
- **THEN** seven steps numbered 1 to 7 are shown in order, and the screenshot shows the image of the active step

#### Scenario: Desktop stage
- **WHEN** the page is viewed at 1024px or wider
- **THEN** the introduction and the screenshot share the stage, and the seven steps form one row along the bottom edge of the stage

### Requirement: How-to opens on the first step
The page SHALL open with step 1 active, its description visible, and the screenshot set to step 1's image.

#### Scenario: First step is active on arrival
- **WHEN** a user opens the how-to page and has not activated another step
- **THEN** step 1 is active, its description is visible, and the screenshot is step 1's image

### Requirement: Step selection
On a device that can hover, pointing at a step SHALL preview that step's description and image, and leaving it SHALL restore the pinned step. Activating a step SHALL pin it. On a device without hover, the pinned step SHALL change only when a step is activated.

#### Scenario: Hover previews and leaves
- **WHEN** step 1 is pinned and the user points at step 4, then moves the pointer away
- **THEN** step 4's image is shown while the pointer is over it, and step 1's image returns when the pointer leaves

#### Scenario: Activation pins a step
- **WHEN** the user activates step 6
- **THEN** step 6 remains active after the pointer leaves, with its description visible and its image in the screenshot

#### Scenario: Touch does not preview
- **WHEN** the user taps step 3 on a device that cannot hover
- **THEN** step 3 becomes the pinned step, and no other step's image is shown during the tap

### Requirement: Narrow how-to layout
Below 1024px the introduction, the screenshot, the call to action, and the steps SHALL stack in that order. From 768px to 1023px the steps SHALL sit in two columns. Below 768px the steps SHALL sit in one column. The active step SHALL show its description.

#### Scenario: Phone stack
- **WHEN** the page is viewed at 390px wide
- **THEN** the introduction, screenshot, call to action, and seven steps appear in one column, and the active step shows its description

### Requirement: How-to colors
The stage ground SHALL be the sea token `#37a797`. In order, the seven step cells SHALL use brown, paper, yellow, the foam token `#92c8b7`, blue, orange, and mist. Step titles and descriptions SHALL use ink. In the introduction, the accent word SHALL use paper, the recipe word SHALL use yellow, the body SHALL be white, and the remaining text SHALL use ink.

#### Scenario: Stage and step colors
- **WHEN** the how-to page is shown
- **THEN** the stage ground is `#37a797`, step 1's cell is brown `#86592b`, step 4's cell is `#92c8b7`, and the recipe word is yellow `#fdbe0f`
