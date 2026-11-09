# about-page Specification

## Purpose

Presents the public about page in the ADAPTARIUM layout, with the reference copy in Spanish and translations in English and Italian.

## Requirements

### Requirement: About route
The site SHALL serve the about page at `/about`, `/es/about`, and `/it/about`, with the same top bar, overlay navigation, and footer as the how-to page, and without the previous site header.

#### Scenario: Reach from the menu
- **WHEN** the user selects "Quiénes somos" in the overlay
- **THEN** `/es/about` opens with the public-site top bar and the site footer
- **THEN** the previous site header is not shown

#### Scenario: Active section
- **WHEN** the user opens the overlay on the about page
- **THEN** the About us item is marked as active

### Requirement: About bands
The about page SHALL show three bands in order: a hero, a paper band, and a yellow band. It SHALL NOT show a call to action. It SHALL NOT show the retired editorial sections.

#### Scenario: Three bands and no call to action
- **WHEN** a user opens the about page
- **THEN** the hero, the paper band, and the yellow band appear in that order
- **THEN** the page shows no call to action

#### Scenario: Retired copy is gone
- **WHEN** a user opens the about page in any locale
- **THEN** the page does not show the collective-action-ladder section, the agriculture-forestry-fisheries sector grid, or the closing that calls the hub a catalyst for Europe's bioregions

### Requirement: Hero
The hero SHALL show a two-line kicker, the word TRANSFORMATION in four stacked lines (TRANS, FOR, MA, TION) in orange `#fc4b08`, the word HUB, and the sea-glass photograph. TRANSFORMATION and HUB SHALL stay untranslated. The ground SHALL be the foam token `#92c8b7`. At 1024px or wider the title block SHALL sit on the left and the photograph on the right.

#### Scenario: Spanish hero
- **WHEN** the Spanish about page renders at 1280px wide
- **THEN** the kicker reads "SOBRE" and "EL PROYECTO" on two lines, right-aligned
- **THEN** TRANSFORMATION is stacked in orange and HUB follows it
- **THEN** the sea-glass photograph is on the right

#### Scenario: Translated kickers
- **WHEN** the English about page renders
- **THEN** the kicker reads "ABOUT" and "THE PROJECT"
- **WHEN** the Italian about page renders
- **THEN** the kicker reads "SUL" and "PROGETTO"
- **THEN** TRANSFORMATION and HUB are unchanged in both locales

### Requirement: Paper band
The paper band SHALL show three answers in order, then who the page is for, with the small sea-glass cluster. The third heading SHALL keep its last word in sentence case. The ground SHALL be the paper token `#f8e8d9`. At 1024px or wider the three answers SHALL sit in one row and the audience text SHALL sit to the left of its photograph.

#### Scenario: Spanish headings and bodies
- **WHEN** the Spanish about page renders the paper band
- **THEN** the headings read "¿QUÉ ES?", "¿QUÉ NO ES?", "¿QUÉ queremos?", and "¿PARA QUIÉN ES ESTA PÁGINA?"
- **THEN** the first body is "Es una plataforma digital que permite conectar a instituciones, organizaciones y profesionales de Europa con conocimientos prácticos de adaptación al cambio climático, soluciones procesadas y presentadas a manera de recetas, y herramientas de inteligencia artificial, para inspirar, aprender y actuar en las diversas biorregiones del continente."
- **THEN** the second body is "No es una herramienta para generar nuevas soluciones o formular proyectos de forma automatizada. No está pensada para reemplazar las discusiones en territorio durante el diseño de soluciones específicas."
- **THEN** the third body is "Informar, inspirar, servir de herramienta de apoyo para investigar y analizar qué se ha hecho en otros contextos con relación a la adaptación al cambio climático, para poner en valor los aprendizajes y experiencias de otros territorios y colectividades."
- **THEN** the fourth body is "Personas responsables, a nivel local y regional, de instituciones públicas, organizaciones comunitarias, y representantes de la sociedad civil, que tienen un rol de incidencia para liderar procesos en territorio con cierto grado de conocimiento técnico, pero con poco acceso a bibliografía científica, que se enfrentan a barreras idiomáticas a la hora de buscar información sobre cambio climático."

#### Scenario: English translation
- **WHEN** the English about page renders the paper band
- **THEN** the headings read "WHAT IS IT?", "WHAT IT IS NOT?", "WHAT WE want?", and "WHO IS THIS PAGE FOR?"
- **THEN** the first body is "It is a digital platform that connects institutions, organisations, and professionals across Europe with practical climate-adaptation knowledge, solutions processed and presented as recipes, and artificial intelligence tools, to inspire, learn, and act in the continent's bioregions."
- **THEN** the second body is "It is not a tool for generating new solutions or formulating projects automatically. It is not meant to replace on-the-ground discussions while specific solutions are being designed."
- **THEN** the third body is "To inform, to inspire, and to serve as a support tool for researching and analysing what has been done in other contexts in relation to climate adaptation, so that the learning and experience of other territories and communities can be recognised."
- **THEN** the fourth body is "People with responsibility, at local and regional level, in public institutions, community organisations, and civil society, who lead processes in their territory. They have some technical knowledge but little access to scientific literature, and they face language barriers when searching for information on climate change."

#### Scenario: Italian translation
- **WHEN** the Italian about page renders the paper band
- **THEN** the headings read "COS'È?", "COSA NON È?", "COSA vogliamo?", and "A CHI È RIVOLTA QUESTA PAGINA?"
- **THEN** the first body is "È una piattaforma digitale che collega istituzioni, organizzazioni e professionisti in Europa a conoscenze pratiche di adattamento al cambiamento climatico, soluzioni elaborate e presentate sotto forma di ricette, e strumenti di intelligenza artificiale, per ispirare, imparare e agire nelle biorregioni del continente."
- **THEN** the second body is "Non è uno strumento per generare nuove soluzioni o formulare progetti in modo automatizzato. Non è pensata per sostituire le discussioni sul territorio durante la progettazione di soluzioni specifiche."
- **THEN** the third body is "Informare, ispirare e servire da strumento di supporto per ricercare e analizzare ciò che è stato fatto in altri contesti riguardo all'adattamento al cambiamento climatico, per mettere in valore gli apprendimenti e le esperienze di altri territori e collettività."
- **THEN** the fourth body is "Persone responsabili, a livello locale e regionale, di istituzioni pubbliche, organizzazioni comunitarie e della società civile, che guidano processi sul territorio. Hanno un certo grado di conoscenza tecnica ma poco accesso alla bibliografia scientifica, e incontrano barriere linguistiche quando cercano informazioni sul cambiamento climatico."

### Requirement: Yellow band
The yellow band SHALL show the metaphor photograph and a stepped heading: the first line in orange `#fc4b08`, the second in blue `#0f4fc4`, and the sea-glass name in the title font on two lines, then the sea-glass paragraph. Each heading line SHALL sit further right than the line above it. The ground SHALL be the yellow token `#fdbe0f`. At 1024px or wider the photograph SHALL sit to the left of the text. The paragraph SHALL include the word for solutions in capitals.

#### Scenario: Spanish metaphor
- **WHEN** the Spanish about page renders the yellow band at 1280px wide
- **THEN** "UNA SOLUCIÓN" is orange, "UNA RECETA" is blue and indented further right, and "VIDRIOS" / "MARINOS" follow on two lines, indented further right again
- **THEN** the paragraph is "El vidrio marino, o lágrimas de sirena, son desechos humanos transformados por el océano en gemas suaves y opacas. Resignificamos estos restos pulidos por la marea, uniendo materiales antiguos y modernos para convertir la basura en materia activa que se transforma en SOLUCIONES frente al cambio climático y la adaptación."

#### Scenario: English and Italian metaphor
- **WHEN** the English about page renders the yellow band
- **THEN** the lines read "ONE SOLUTION", "ONE RECIPE", and "SEA" / "GLASS"
- **THEN** the paragraph is "Sea glass, or mermaid's tears, is human waste transformed by the ocean into smooth, opaque gems. We give these tide-polished remains a new meaning, joining old and new materials to turn waste into active matter that becomes SOLUTIONS in the face of climate change and adaptation."
- **WHEN** the Italian about page renders the yellow band
- **THEN** the lines read "UNA SOLUZIONE", "UNA RICETTA", and "VETRI" / "MARINI"
- **THEN** the paragraph is "Il vetro marino, o lacrime di sirena, sono rifiuti umani trasformati dall'oceano in gemme lisce e opache. Reinterpretiamo questi resti levigati dalla marea, unendo materiali antichi e moderni per trasformare i rifiuti in materia attiva che diventa SOLUZIONI di fronte al cambiamento climatico e all'adattamento."

### Requirement: Localized editable content
All about texts, alternative texts, and image references SHALL come from per-locale content files (en, es, it). A locale without an about file SHALL fall back to English.

#### Scenario: Edit a heading
- **WHEN** an editor changes the Spanish "what it is" heading in the Spanish content file and the site is rebuilt
- **THEN** the Spanish page shows the new heading and no component code changes are needed

#### Scenario: Missing locale
- **WHEN** the Italian about content file is missing
- **THEN** the Italian about page renders the English content

#### Scenario: Images have alternative text
- **WHEN** the about page renders in any locale
- **THEN** the hero photograph, the small sea-glass cluster, and the metaphor photograph each expose a localized alternative text

### Requirement: Narrow about layout
Below 1024px the hero title SHALL sit above its photograph, the three answers SHALL stack in order, the audience text SHALL sit above its photograph, and the metaphor photograph SHALL sit above the stepped text.

#### Scenario: Phone stack
- **WHEN** the page is viewed at 390px wide
- **THEN** the title, the hero photograph, the three answers, the audience text, the small sea-glass cluster, the metaphor photograph, and the yellow text appear in that order in one column

### Requirement: About prerendered
The about page SHALL be statically prerendered for every locale.

#### Scenario: Build output
- **WHEN** the site is built
- **THEN** `/about`, `/es/about`, and `/it/about` are emitted as prerendered HTML

### Requirement: Document title
The document title SHALL be the localized kicker written as a single phrase, and the description SHALL be the first answer's body.

#### Scenario: Spanish document title
- **WHEN** the Spanish about page loads
- **THEN** the document title is "Sobre el proyecto"
- **THEN** the description is the Spanish "what it is" body
