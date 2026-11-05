# Spec Delta

## MODIFIED Requirements

### Requirement: Top bar controls
Pages using the new design SHALL show a language switcher (EN / ES / IT, active locale highlighted) and a session control ("Sign in" when signed out; sign-out when signed in). The hamburger button SHALL be shown below 1024px and on pages without the vertical column, and SHALL NOT be shown on the home at 1024px or wider. The stories index and each story article SHALL show that same top bar, including the wordmark, at every viewport width.

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
- **THEN** the page shows the wordmark, the language switcher, the session control, and the hamburger, and does not show a hamburger by itself

#### Scenario: Stories overlay
- **WHEN** the user activates the hamburger on a story article and then "Soluciones"
- **THEN** the overlay closes and the solutions explorer opens
