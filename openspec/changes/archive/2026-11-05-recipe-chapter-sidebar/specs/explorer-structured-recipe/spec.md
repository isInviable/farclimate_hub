# Spec Delta

## MODIFIED Requirements

### Requirement: Section ordering and visibility

Sections SHALL be iterated in this fixed key order: `context_summary`, `policy_context`, `legal_aspects`, `challenges`, `objectives`, `who_is_involved`, `implementation_phases`, `economic_data`, `solutions_implemented`, `benefits`, `lessons_learnt`, `success_and_limiting`, `transferability`. Any key whose value is missing or whitespace-only after trim SHALL be omitted from the table of contents and from the body.

#### Scenario: Sparse recipe

- **WHEN** only `context_summary` and `benefits` are non-empty

- **THEN** only those two sections appear in the TOC and main column, with `context_summary` before `benefits`

#### Scenario: Chapter order

- **WHEN** every canonical section is non-empty

- **THEN** `challenges` follows `legal_aspects`, `objectives` precedes `who_is_involved`, `economic_data` follows `implementation_phases`, and `success_and_limiting` follows `lessons_learnt`
