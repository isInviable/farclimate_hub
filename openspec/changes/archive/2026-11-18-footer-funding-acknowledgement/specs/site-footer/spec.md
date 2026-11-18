# Spec Delta

## Purpose

Show the FARCLIMATE, European Union, and Swiss funding marks, plus the required grant disclaimer, in the public site footer above the copyright and legal links.

## ADDED Requirements

### Requirement: Funding marks sit above the copyright bar

The site footer SHALL show a funding-marks row and a disclaimer row above the existing copyright line and legal links. The menu columns, copyright text, and legal links SHALL stay as they are.

#### Scenario: Order of footer bands

- **WHEN** a visitor views a page that shows the site footer
- **THEN** the funding-marks row appears first, the disclaimer row appears directly under it, and the copyright line with the legal links appears under the disclaimer

#### Scenario: Existing footer content remains

- **WHEN** a visitor views the site footer in any locale
- **THEN** the wordmark, main menu, follow links, copyright line, and legal links are still present

### Requirement: Three funding marks in a fixed order

The funding-marks row SHALL show exactly three images, left to right: the white FARCLIMATE logo, the white European Union “Funded by the European Union” outline, and the white inverse Swiss SERI / EU Framework Programme mark. The marks SHALL NOT be links.

#### Scenario: Mark order on a wide viewport

- **WHEN** the footer is wide enough to show the marks on one line
- **THEN** the FARCLIMATE logo is first, the European Union mark is second, and the Swiss mark is third

#### Scenario: Marks remain available on a narrow viewport

- **WHEN** the viewport is too narrow for one line
- **THEN** the same three marks still appear, in the same order, wrapping onto additional lines

#### Scenario: Accessible names

- **WHEN** assistive technology reads the funding-marks row
- **THEN** each mark has a text alternative naming FARCLIMATE, the European Union, or the Swiss State Secretariat for Education, Research and Innovation

### Requirement: Swiss mark is a white inverse

The Swiss mark SHALL be a white inverse of the colored source. Wordmark and emblem shapes that are dark or red in the source SHALL render white. The cross SHALL remain visible against the dark footer by showing the footer background through it.

#### Scenario: No color remains in the Swiss mark

- **WHEN** a visitor views the Swiss mark on the dark footer
- **THEN** its wordmark and shield are white and the red fill from the source file is not shown

#### Scenario: Cross stays readable

- **WHEN** a visitor views the Swiss mark on the dark footer
- **THEN** the cross is distinguishable from the white shield

### Requirement: Funding disclaimer text

The disclaimer row SHALL show this English text on every locale: “Funded by the European Union under Horizon Europe (FARCLIMATE, grant agreement No 101112860) and co-funded by the Swiss State Secretariat for Education, Research and Innovation (SERI). Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or the granting authority. Neither the European Union nor the granting authority can be held responsible for them.”

#### Scenario: English disclaimer on a non-English page

- **WHEN** a visitor opens the site in Spanish or Italian
- **THEN** the disclaimer row still shows that English paragraph in full
