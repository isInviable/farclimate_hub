**FARCLIMATE**

*Moving ForwARd to achieving CLIMATE-resilient and sustainable European regional economic systems*

**Deliverable D7.3**

**Transformation Hub Development**

Work Package 7 — Transformative Solutions for a Positive Climate Future

Task T7.3 — Transformation Hub Development

30 June 2026

*\[PLACEHOLDER: authors and lead organisation\]*

# **Table of contents**

# **List of acronyms**

**AI:** Artificial Intelligence

**API:** Application Programming Interface

**CMS:** Content Management System

**D:** Deliverable

**DRR:** Disaster Risk Reduction

**EC:** European Commission

**EEA:** European Environment Agency

**ETL:** Extract, Transform, Load

**EU:** European Union

**FAIR:** Findable, Accessible, Interoperable, Reusable

**LL:** Living Lab

**LLM:** Large Language Model

**MIP4Adapt:** EU Mission Implementation Platform for adaptation

**OTP:** One-Time Password

**PU:** Public

**RAG:** Retrieval-Augmented Generation

**RLS:** Row Level Security

**SDK:** Software Development Kit

**SQL:** Structured Query Language

**T:** Task

**UI:** User Interface

**UMAP:** Uniform Manifold Approximation and Projection

**UUID:** Universally Unique Identifier

**UX:** User Experience

**WCAG:** Web Content Accessibility Guidelines

**WP:** Work Package

# **Project information**

*Table 1\. Project information.*

| Field | Value |
| :---- | :---- |
| Project full title | Moving ForwARd to achieving CLIMATE-resilient and sustainable European regional economic systems — FARCLIMATE |
| Acronym | FARCLIMATE |
| Call | HORIZON-MISS-2022-CLIMA-01 |
| Topic | HORIZON-MISS-2022-CLIMA-01-04 — Transformation of regional economic systems for climate resilience and sustainability |
| Start date | 1st October 2023 |
| Duration | 48 months |

**List of participants:** *\[PLACEHOLDER: replicate the consortium table from D7.2 (UVIGO, CTA, UICN, C4G, INV, FUNDAO, GGG, ULIEGE, CESEFOR, …)\]*

# **Deliverable details**

*Table 2\. Deliverable details.*

| Field | Value |
| :---- | :---- |
| Document Number | D7.3 |
| Document Title | Transformation Hub Development |
| Dissemination level | PU – Public |
| Period | \[PLACEHOLDER: confirm reporting period\] |
| WP | WP7 |
| Task | T7.3 |
| Authors | \[PLACEHOLDER: confirm final author list — expected: Beatriz Rivela (INV), Juan Freire (INV), Sergio Galán (INV)\] |
| Abstract | This deliverable documents the development of the FARCLIMATE Transformation Hub, the digital platform conceived in Task T7.2 and implemented during Task T7.3 between February and June 2026\. It describes the methodology adopted to translate the platform design into a functional system, the architectural decisions, the technology stack, the implemented features and the user experience flows, alongside the visual identity rollout, content curation activities, integration with the Connected Action visualisation (T6.5), and quality and security safeguards. As of 30 June 2026 the platform is operational at https://farclimate-hub.netlify.app and ready for user testing within the FARCLIMATE living labs under Task T2.4. |

## **Version history**

*Table 3\. Version history.*

| Version | Date | Description |
| :---- | :---- | :---- |
| Draft\_V0 | \[PLACEHOLDER\] | First draft |
| Version\_V1 | \[PLACEHOLDER\] | Initial version submitted for internal review |
| Version\_V2 | \[PLACEHOLDER\] | Final version submitted to the EC |

# **1\. Executive Summary**

The present document, prepared as part of Task T7.3 within WP7 — Transformative Solutions for a Positive Climate Future of the FARCLIMATE project, presents the development of the FARCLIMATE Transformation Hub. It builds directly on Deliverable D7.2, which set out the platform's conceptual design, prioritisation framework and visual identity, and translates that foundation into a working digital system.

Section 2 frames the purpose of Task T7.3 within the broader WP7 objectives, establishing the continuity between design (T7.2) and development (T7.3), and previewing how the Transformation Hub addresses the inspiration, learning and connection needs identified in the user research phase.

Section 3 summarises the design foundations inherited from T7.2 — the collective action ladder, the Recipe metaphor, the bioregional anchoring and the three priority sectors (agriculture, forestry, fisheries) — and lays out the principles that guided their translation into a working platform.

Section 4 describes the development methodology: a sprint-based agile process spanning twelve iterations between February and June 2026, with rolling co-creation through periodic videoconferences and asynchronous email updates between the development team and the WP7 partners.

Section 5 details the platform architecture, organised around two complementary data domains — the Knowledge substrate (documents, summaries, recipes, media) and the Human domain (projects, pinboards, pins) — implemented on a Supabase/PostgreSQL backend with row-level security, a Nuxt-based frontend, hybrid keyword-plus-semantic search, and AI-assisted transformations served through the Vercel AI SDK.

Section 6 walks through the implemented features and user experience, organised against the three user journey phases defined in D7.2 (Search & Explore, Analysis & Assessment, Information Management & Collaboration): a curated catalogue of 146 climate adaptation case studies filterable by sector, climate impact, adaptation approach and biogeographical region; the recipe view with fifteen standardised sections; pinboards with user projects, public sharing and AI-assisted transformations into slides, podcasts, mindmaps and synthetic recipes; UMAP-based bioregional visualisation; and a content management system for skills and stories.

Sections 7 and 8 cover the implementation of the visual identity and the content production and curation activities, including the challenges encountered in sourcing inspiring stories from external partners.

Section 9 documents the quality, security and compliance arrangements — authentication via email and one-time passwords, row-level security policies across all database tables, multilingual content quality control and the alignment with EU digital and AI governance principles.

Section 10 provides a sprint-by-sprint development log, with the detailed log moved to Annex 3, and Section 11 reports on the integration with the Connected Action for EU Adaptation visualisation developed under Task T6.5.

Finally, Section 12 synthesises the conclusions, lessons learned and next steps, framing the handover to Task T2.4 for user testing in the living labs and outlining the maintenance, content-growth and evaluation activities planned for the remainder of the project.

# **2\. Introduction**

## **2.1 Purpose and objectives**

Task T7.3 is responsible for translating the design proposal for the FARCLIMATE Transformation Hub elaborated in Task T7.2 into an operational digital platform. Whereas D7.2 established the methodological foundation, the user-centred conceptual framework and the prioritised feature set, the work documented here corresponds to step 3 of the four-step co-creation scheme adopted in WP7: platform development.

The Transformation Hub is a cornerstone of WP7, contributing to its three high-level objectives:

* O7.1. To build inspiring knowledge and meaningful experiences to accelerate climate adaptation action.

* O7.2. To provide transformative user-centred solutions for a positive climatic future.

* O7.3. To enhance the effectiveness of the actions and take advantage of synergies by fuelling a growing network of Connected Action for EU adaptation.

Concretely, Task T7.3 aimed to deliver: a functional knowledge substrate ingesting climate adaptation case studies; a search and exploration layer combining keyword and semantic retrieval with faceted filtering and AI-assisted summarisation; a human-domain layer enabling registered users to organise their exploration in projects and pinboards and to share their findings; a set of AI-assisted transformations producing slide decks, podcasts, mindmaps and synthetic recipes from curated content; a multilingual interface and content base covering English, Spanish and Italian; a coherent visual identity implementing the design system defined during T7.2; and the integration of the Connected Action visualisation produced under Task T6.5.

The platform is operational at https://farclimate-hub.netlify.app and the content management system at https://farclimate-hub.netlify.app/admin/skills.

## **2.2 From T7.2 to T7.3: bridging design and development**

Deliverable D7.2 concluded by signposting Task T7.3 as the implementation phase, with a beta release scheduled for June 2026 and a parallel completion of the Connected Action component (Task T6.5) for integration into the Hub. The development reported here delivers that beta on schedule, while incorporating substantive iterations on the design itself that emerged once the team began building.

Three pivots are worth flagging at the outset, as they shape several sections that follow. First, the visual identity work originally scoped to be sub-contracted to an external supplier was instead absorbed by the development team, allowing tighter feedback loops between design choices and their implementation cost. Second, the Pinboard component was substantially rethought during the development to support a wider range of pinnable artefacts (full articles, fragments, images, diagrams, selected text) and a more deliberate set of AI-assisted transformations. Third, the production of inspiring stories — originally planned as content sourced from external partners — encountered delays in partner availability and required a parallel internal effort to populate the section.

These pivots are documented as project history rather than retrospectively rationalised: they reflect the reality that designing a co-created digital tool inevitably continues into the implementation phase.

# **3\. From design to development**

This section bridges the design proposal documented in D7.2 with the development reported in this deliverable, identifying the design foundations carried into implementation and the principles that guided the translation.

## **3.1 Inherited design foundations**

D7.2 framed the Transformation Hub as a collective action ladder articulated through three interconnected components: a Repository of curated climate adaptation content grounded in FAIR principles (Findable, Accessible, Interoperable, Reusable), a set of Consultation tools (search, filters, maps, structured recipe views) and an Interaction and decision support layer for saving, sharing and recombining knowledge.

Three starting points anchored the design: the bioregion as the meaningful spatial scale where ecology, economy and governance meet; the community as the primary audience; and climate adaptation solutions tested or proposed in real contexts. The Hub prioritises agriculture, forestry, and fisheries — the three economic sectors at the heart of FARCLIMATE — while organising content by geography, sector, hazards and keywords to close gaps found on platforms such as Climate-ADAPT.

D7.2 distinguished two audience tiers. Primary users include people responsible at local and regional levels in public institutions, economic sectors and civil society organisations. Secondary users include citizens, scientists and technical or political representatives at regional, national or European levels. The development reported here prioritises the primary user experience while keeping the platform open and accessible to the wider audience.

The recipe metaphor is the central conceptual contribution carried into development: each solution is described as a structured recipe with sections covering sector, geography, hazards, adaptation type, context, objectives, implementation, outcomes, lessons learnt, transferability, and contacts. This format was designed in T7.2 to support both comparability across cases and adaptation to local contexts.

D7.2 also defined a three-phase user journey — Search & Explore, Analysis & Assessment, and Information Management & Collaboration — used to characterise the functional domain and category of each candidate feature. The implementation reported in Section 6 of this deliverable is organised against these same phases, so that the link between design intent and delivered functionality remains visible.

The decision matrix produced in T7.2 (Annex 7 of D7.2) prioritised a concrete set of features for development, applying primary criteria (user interest, technical feasibility, resource cost) and secondary criteria (strategic alignment, impact potential, scalability). Annex 1 of this deliverable maps those prioritised features against the implementation actually delivered, alongside a complementary list of features that emerged during T7.3 itself.

## **3.2 Translation principles for implementation**

Four principles guided the translation of the design into code. First, rebuildability: the data substrate must be regenerable from its sources, so that pipelines, summarisation strategies and AI-based transformations can evolve without losing historical content or destabilising user-curated material. Second, separation of concerns: user-curated data (pins, notes, projects) is held in a Human domain that never depends on regenerable Knowledge tables, ensuring that improvements to the knowledge pipeline never erase user work. Third, AI as a transparent assistant: AI components are surfaced where they add demonstrable value (summarisation, semantic retrieval, recipe extraction, artefact generation) and are kept out of paths where they would obscure provenance or reproducibility. Fourth, pragmatic scale: the platform is deliberately built for hundreds to low thousands of documents and limited concurrent use, so the technology stack favours coherence and maintainability over high-throughput optimisation.

# **4\. Development methodology**

## **4.1 Agile sprint-based approach**

Development was organised in twelve two-week sprints between 2 February and 19 June 2026\. The first five sprints followed a structured ceremony pattern with a written close-of-sprint document capturing achievements, pending items, items requiring testing and the planned scope for the next iteration. From sprint 6 onwards, the cadence relaxed: the development team continued to operate in two-week cycles but the close-of-sprint document was replaced by a combination of fortnightly videoconferences, email updates and asynchronous decisions logged in shared documents. This shift reflected the reality that several streams (visual design, content production, AI features) had become parallel workstreams with distinct rhythms.

Sprint 5 was scoped to engage an external supplier for design rework. Following an unsuccessful negotiation, the team decided to keep the design work in-house, on the rationale that having the same person designing and implementing would expose design choices to their implementation cost in real time. This decision is reflected in the sprint log (Annex 3): sprint 5 is marked as not delivered against its original scope, while sprints 6 onwards absorbed the visual identity work.

Sprint 7 was dedicated to producing inspiring stories sourced from external partners. Difficulties in identifying partners willing to commit to story production led to the sprint being marked as not delivered, with a downstream effect on sprint 10 (web home maquetation) and on the Stories section, which at the cut-off date of this report contains one published story with additional content in the production pipeline.

## **4.2 Continuous co-creation and the co-design heritage**

Task T7.2 introduced co-design as a deliberate methodological choice: the co-design workshop held in Soria in May 2025, the Mentimeter exercise on the relevance of the different ingredients of the recipe, and the follow-up interviews with forestry, fisheries and agriculture practitioners produced the user insights and the prioritisation framework on which the implementation was built. Task T7.3 distinguishes between that co-design heritage (the upstream design decisions formally documented in D7.2) and the continuous co-creation activities run during implementation.

Co-creation activities were continued throughout T7.3 through three channels: (i) fortnightly videoconferences between the development team and the WP7 partners, used to review progress on visible features and prioritise the upcoming iteration; (ii) asynchronous written updates by email, used to circulate strategic reflections (e.g. on the role of the Pinboard, on the integration of generative AI features) and gather written feedback; and (iii) hands-on user testing of features as they reached a usable state, with explicit hooks in the platform (the Saved searches, the Public pinboard sharing, the Chat with selection) for collecting feedback during real exploration.

As the platform approaches the user-testing phase in living labs (Task T2.4), the team is moving issue tracking onto a public GitHub Issues board, with semi-automated triage. This workflow was initiated in late May 2026 and will be the primary feedback channel during T2.4.As the platform approaches the user-testing phase in living labs (Task T2.4), the team is moving issue tracking onto a public GitHub Issues board, with semi-automated triage. 

\[PLACEHOLDER: confirm whether the GitHub Issues \+ semi-automated agents workflow is fully operational by 30 June 2026\]

## **4.3 Risk and dependency management**

The risks anticipated at the start of T7.3 fell into three categories: technological uncertainty (data architecture, search stack, AI pipelines), content dependency (availability of partner-provided content for stories), and integration dependency (Connected Action component from T6.5). The risk register and how each item evolved during the task is summarised in Section 12 (Lessons learned). The most consequential realised risk was the content dependency on partner-provided stories, which materially affected the timeline of sprints 7 and 10\.

# **5\. Platform architecture**

## **5.1 Two-domain data model**

The platform is organised around two complementary but clearly separated data domains. The Knowledge domain stores the long-lived knowledge assets and their AI-derived representations: original documents, structured summaries, multilingual translations, derived Recipe views, full-text representations, media assets and bioregional metadata. The Human domain stores everything that users create or curate: projects, pinboards, pins, payloads and share tokens.

The boundary between the two domains is enforced at the data level: pins never carry foreign keys into the Knowledge tables. Instead, they hold a stable source document identifier and a snapshot title, so that user-curated material survives any regeneration of the Knowledge substrate. This design choice supports two important properties simultaneously: the Knowledge substrate is rebuildable from its sources without disturbing user work, and user-owned material is portable across iterations of the AI pipelines.

## **5.2 Knowledge substrate and data pipelines**

The Knowledge substrate is fed by three coordinated base flows.

**Pull.** Source-specific scripts retrieve documents from external platforms (Climate-ADAPT in the current scope, with the architecture designed to accommodate further sources such as the future RESIST and the United States Climate Adaptation Knowledge Exchange) and store them in their original form in an object storage system. The object storage acts as the source of truth: content is immutable once ingested.

**Preprocess.** A deterministic and AI-assisted preprocessing pipeline transforms the raw documents into the structured representation that feeds the Knowledge tables. The pipeline handles chunking, assigns block types, generates embeddings for semantic search, produces AI-generated translations and recipe views, and writes the resulting rows into the database. The pipeline is recomputable: running it again over the same sources produces an equivalent database state, which supports debugging and iteration on the AI prompts.

**On-demand operations.** User-triggered operations — chat with results, semantic queries, AI-assisted comparisons, artefact generation — are served on demand against the preprocessed data. These operations may use caching but do not persist their outputs into the Knowledge substrate; they are treated as views or interpretations.

A core architectural requirement is the use of stable identifiers derived from document content. These identifiers persist even if the object storage is rebuilt, link source documents to all derived representations and connect the Human and Knowledge domains. This stable-id strategy is what enables the rebuildability property described above.

## **5.3 Technology stack**

The Transformation Hub is built on a deliberately pragmatic stack: a PostgreSQL-based Supabase backend with row-level security across all database tables, an object storage layer for raw documents, a Nuxt-based frontend with nuxt-ui widgets, and the Vercel AI SDK for orchestrating LLM interactions. Semantic search is implemented using vector embeddings generated by Gemini and stored alongside structured text in PostgreSQL with a vector extension. The frontend is hosted on Netlify. Table 4 summarises the stack.

*Table 4\. Technology stack of the Transformation Hub.*

| Layer | Technology | Notes |
| :---- | :---- | :---- |
| Hosting (frontend) | Netlify | Domain: farclimate-hub.netlify.app |
| Backend / database | Supabase (PostgreSQL) | Row-level security on 13 tables |
| Object storage | SupabaseStorage\[PLACEHOLDER: confirm — Supabase Storage\] | Derived assets: article images, pin images, artifacts, skills images. raw HTML is on github Source-of-truth for raw documents |
| Frontend framework | Nuxt \+ nuxt-ui | Composable-based search client with caching |
| Repository | GitHub organisation isInviable | https://github.com/isInviable |
| Data pipelines | Python — repo farclimate\_data\_pipelines | Pull, preprocess and augment-with-AI steps |
| Embeddings | Gemini | Stored in PostgreSQL with vector index |
| Search ranking | Hybrid (keyword \+ semantic) | Server-side re-ranking and faceting |
| LLM orchestration | Vercel AI SDK | Chat with results, artefact generation |
| LLM providers | Google Gemini (`@ai-sdk/google`)\[PLACEHOLDER: confirm Claude / OpenAI / Gemini per use-case\] | Used for summarisation, recipe extraction, chat |
| Authentication | Email \+ one-time password (OTP) | No persistent passwords stored by the user |
| Bioregional visualisation | UMAP layout \+ lat/lon | Bioregion tags as primary axis |
| Slides generation | Gemini (structure API) pptxgenjs (client) \[PLACEHOLDER: confirm provider / library\] | Server returns slide outline; client builds `.pptx` Proof of concept`PowerPoint output from selected pins` |
| Podcast generation | Gemini (script) Google Cloud Text-to-SpeechExternal API (Jellypod evaluated) | Proof of concept |
| UI languages | English, Spanish, Italian | Switcher in the global header |

## **5.4 Data model**

The Knowledge domain currently comprises eight tables: documents, summary, summary\_multilang, generated\_summaries, recipe, fulltext, media and bioregions. The Human domain comprises five tables: user\_projects, user\_pinboard, user\_pins, user\_pins\_payload, and the human.project\_share\_links table added to support the public sharing of pinboards via opaque tokens. Annex 2 reproduces the full schema; here we highlight the design rationale for the choices most relevant to the user experience.

**Pins as references.** Each pin holds a stable structural part (identity, ordering, references to source documents) and a flexible jsonb payload. This allows new pin types and UI features to be added without database migrations, which has proven valuable: during T7.3 the pin model was extended to support fragments, images, diagrams, selected text and full blocks without schema changes.

**Multilingual content.** Textual fields that require translation are stored in a separate summary\_multilang table, with structured filterable attributes kept in the language-independent summary. This separation avoids schema duplication and allows adding new languages without altering the core model.

**Generated representations are reproducible.** Recipe views, generated summaries, embeddings and other AI-derived representations are kept in dedicated tables, each tied to the source document by stable identifiers. They are treated as reproducible outputs that can evolve as pipelines improve, rather than baked into the core document records.

# **6\. Implemented features and user experience**

As of 30 June 2026 the Transformation Hub exposes a public catalogue, a registered-user space and a content management back office. This section walks through the implemented features following the user journey defined in D7.2 (Section 7.1.2), which structures the user experience in three phases: Search & Explore, Analysis & Assessment, and Information Management & Collaboration.

The catalogue browsing, search and filtering features described in Section 6.1 belong to the Search & Explore phase. The recipe view, the bioregional visualisation and the AI-assisted comparisons described in Sections 6.2 and 6.5 support the Analysis & Assessment phase. The projects, pinboards, public sharing, AI-assisted transformations and content management described in Sections 6.3, 6.4 and 6.7 cover the Information Management & Collaboration phase. The multilingual interface (Section 6.6) cuts across all three phases.

## **6.1 Catalogue, search and filtering (Search & Explore)**

The home page introduces the Hub through four narrative blocks (Inspiration & Learning, Why this matters, How this platform works and The Recipe) and offers direct entry into the three priority sectors. The Explorer landing page provides a search box, a small set of suggested queries and direct shortcuts to the three sectors. The Explorer view itself displays the curated catalogue: at the report cut-off date the catalogue contains 146 climate adaptation case studies, primarily sourced from Climate-ADAPT.

The Explorer offers five complementary view modes for the same result set: a List view, a Compare view, a Map view, a By-bioRegions view based on a UMAP layout, and an Images view. The default page size is controlled by the client search composable and is paginated server-side, with cache-aware navigation that reuses aggregate metadata when only the page changes.

Search combines three complementary modes. Keyword search uses the full text of documents and is useful for precise phrases, named topics, places and organisations. Semantic search uses vector embeddings to find documents that are similar in meaning to the query even when they do not use the same words. By default, the explorer runs a hybrid mode that merges keyword and semantic candidates and re-ranks them so documents matching both terms and meaning surface higher.

Faceted filtering is available across Sector (19 values), Climate impacts (15 values), Adaptation approaches (24 values) and Biogeographical region (8 values). Within a filter type, multiple selected values are combined with OR; across filter types, conditions are combined with AND. Filter groups can be individually enabled or disabled via switches. Facet indicators show two counts: the total corpus count for that facet value and the current result-set count, both computed server-side from the full matching set rather than from the visible page.

Search is scoped by interface language (English, Spanish, Italian); changing language is treated as a new search. A client-side search signature normalises the active query, language, filters, mode and ranking parameters, so that pagination reuses metadata while a true search change clears the cache.

## **6.2 The recipe view (Analysis & Assessment)**

Each case study is presented through a standardised recipe view organised in fifteen sections: Summary, Context summary, Challenges, Policy context, Legal aspects, Who is involved, Economic data, Objectives, Solutions implemented, Implementation phases and timeline, Success and limiting factors, Benefits, Lessons learnt, Transferability and Map. Each recipe additionally exposes metadata blocks for date, geographic scope, bioregion, authors, source (with a link to the original portal), sector, hazards, type of solution and keywords.

Recipes are produced by the preprocessing pipeline using a structured prompt (referenced internally as \_RECIPE\_PROMPT\_TEMPLATE) and stored multilingually. They are rendered with section anchors so that users can navigate within long recipes, and accompanied by contextual actions: open the Chat with this article, open the Contacts list, and Add this content to the pinboard.

During the development phase the team explored two presentation modalities for the recipe — a slideshow and a vertical-scroll layout — and converged on the current design through iterative co-creation with the WP7 partners. Dark mode was evaluated and explicitly discarded during the 13 April 2026 videoconference.

## **6.3 Projects, pinboards and public sharing (Information Management & Collaboration)**

Registered users work within Projects, which act as containers for exploration, analysis and curation activities. Each project owns exactly one Pinboard — the component referred to as a "board" in D7.2 (Section 7.1, Table 6), and renamed "Pinboard" during implementation to reflect its role as the workspace where the user pins and organises items collected from the explorer. The Pinboard groups pins by kind (All, Saved searches, Map, Artifacts) and exposes per-selection actions including Chat with selection, Top insights and a More actions menu for artefact generation.

Pins are references rather than copies: they carry a stable identifier of the source document plus an optional title snapshot, a body kind, a versioned jsonb payload and an optional user note. During T7.3 the pin model was extended to cover not only full articles but also images, diagrams, selected text blocks and other content fragments, allowing the Pinboard to act as a richer curation workspace.

Pinboards can be shared publicly through an opaque token URL: a project owner clicks Share board, the server creates or reuses an enabled share token, and the public URL (/explorer/board/public/{token}) is copied to the clipboard. The shared view is read-only, with no separate make-public toggle: the share action ensures that a token exists and returns it. Sharing exposes the project display name, the ordered pins on the board and the ability to open pinned articles, while keeping saved searches, pin editing and artefact generation private to the owner.

## **6.4 AI-assisted transformations (Information Management & Collaboration)**

Beyond search and curation, the Pinboard supports a set of AI-assisted transformations on selected pins. Following an explicit prioritisation exercise in late April 2026, the implemented transformations are the ones judged most useful for the Hub's purpose: a Chat with selection mode for natural-language interrogation; a Top insights summary across the selected pins; the generation of a slide deck (PowerPoint output) suitable for in-person dissemination; the generation of a short audio podcast as a proof of concept; a mind map view; the option to export the full selection for offline use; and an experimental synthetic recipe that combines the recipe sections of all selected content into a single composite view.

Generative video, which is technically available through external APIs, was deliberately discarded during the same prioritisation exercise: the output was judged too constrained for editing within the Hub's scope, and a video-presentation editor was deemed to belong to a different product. This decision is recorded here because it illustrates how the team navigated the temptation to embed generative AI everywhere, choosing instead to surface AI capabilities only where they meaningfully extend what users can do with the curated content.

## **6.5 Bioregional visualisation (Analysis & Assessment)**

The By-bioRegions view positions documents using a UMAP layout fed by each document's bioregion tags (following the same rules as filters elsewhere, including how multiple regions or missing data are handled), with latitude and longitude used as a secondary signal when real coordinates are available — scaled so geography does not dominate the regional signal. The Pinboard view exposes a Map of pinned items with coordinates, providing a geographical overview of the user's curated selection.

## **6.6 Multilingual interface (cross-cutting)**

The interface supports English, Spanish and Italian, with a language switcher in the global header. Changing language affects full-text search behaviour, the multilingual document fields returned to the UI and the search signature.

During the May iterations the team identified that automatic Spanish and Italian translations of the document corpus are shorter than the English originals, which degrades search recall in those languages. A targeted improvement of the multilingual content quality is in progress, focused on closing this length and coverage gap. 

*\[PLACEHOLDER: confirm the status of the Spanish/Italian translation quality improvement at 30 June 2026\]*

## **6.7 Content management system (Information Management & Collaboration)**

A back-office CMS provides editorial access to the Skills and Stories sections. Editors authenticate via the same email-plus-OTP flow as registered users, with elevated permissions controlled by Supabase row-level security policies. Non-authenticated visitors can browse admin pages in read-only mode (with a clear View Only badge in the sidebar) but cannot create, edit or delete entries; authenticated editors see Edit, New and Delete affordances. This dual mode reflects the broader access model of the platform: public read, authenticated write.

The CMS for the Skills section was delivered during the late-May iteration and is operational; the Stories section was set up in parallel with its content production stream, which has progressed more slowly due to partner availability.

# **7\. Visual identity implementation**

The visual identity rollout was originally scoped as an external supplier engagement in sprint 5\. After the negotiation did not converge, the team decided to keep the design work in-house and to evolve the identity progressively across sprints 6 onwards. The brief was to maintain coherence with the visual elements defined in D7.2 (colour palette, image style, typography) while adapting them to the implemented components.

The implementation followed the design guide referenced internally as the Dee guide. *\[PLACEHOLDER: attach or cite the Dee design guide reference and reproduce the colour palette / typography summary as in D7.2 sections 7.2.1 to 7.2.3\]*

Two design decisions made during T7.3 are worth recording. First, dark mode was evaluated and discarded during the 13 April 2026 videoconference, on the grounds that it would multiply the implementation cost for limited user value at this stage. Second, the recipe presentation model evolved from a side panel that opened over the search results into a more spacious full-page layout reachable through an explicit navigation step. The full-page layout requires more clicks to reach the full content but presents fewer competing elements on each screen, which testers found easier to navigate.

The full design handoff is available in Figma: *\[PLACEHOLDER: paste the Figma handoff link from the 28 April 2026 email\]*

# **8\. Content production and curation**

## **8.1 Curated case study corpus**

The case study corpus is sourced primarily from Climate-ADAPT, with the architecture designed to incorporate additional sources over time. As of 30 June 2026 the catalogue contains 146 case studies, distributed across the platform's filter taxonomy. Each case study is processed by the pipeline to produce structured summaries, recipe views and multilingual translations.

By design, the Hub is part of the broader European ecosystem of adaptation knowledge: it shares case study sources and taxonomies with Climate-ADAPT, and complements platforms such as MIP4Adapt (the EU Mission Implementation Platform for adaptation) by focusing on the practitioner-facing, comparable and adaptable recipe format identified as a gap during T7.1 user research.

The pipeline scripts are reproducible and version-controlled in the farclimate\_data\_pipelines repository. *\[PLACEHOLDER: provide the corpus growth trajectory from sprint 1 to 30 June 2026 (e.g. 100 documents in sprint 3, 146 by late May, target by 30 June)\]*

## **8.2 Skills**

Skills is a curated directory of training resources — e-learning courses, webinars and toolkits — from trusted providers, designed to help practitioners build the capacity needed to act on adaptation knowledge. The Skills section is fed through the CMS by the editorial team.

*\[PLACEHOLDER: report the number of Skills entries published by 30 June 2026 and the categories represented\]*

## **8.3 Stories**

Stories is the narrative content stream, designed to highlight leadership in climate action — including the role of women shaping adaptation efforts — in formats that practitioners find inspiring rather than purely informational. The production of Stories was originally scheduled in sprint 7 and depended on the availability of external partners willing to contribute case material.

The sprint did not deliver against its initial scope. The team has since pursued a parallel internal production effort and, by the cut-off date, the section is operational with a small number of published stories and additional content in the production pipeline.

*\[PLACEHOLDER: report the number of Stories published by 30 June 2026 and the partners contributing\]*

## **8.4 About and supporting content**

The About page presents the Transformation Hub's mission, design principles, audiences and components. Its narrative aligns with the conceptual framing established in D7.2 (the collective action ladder, the recipe metaphor, the bioregional anchoring) and translates that framing for end users.

# **9\. Quality, security and compliance**

## **9.1 Authentication and authorisation**

Authentication is handled through Supabase with an email \+ one-time password (OTP) flow. Each login sends a single-use code to the user's email; sessions are stored in the browser and expire automatically. No persistent passwords are stored by the user. This choice removes the need for users to manage another credential while keeping registration and account activation simple.

Authorisation is enforced at the database level through row-level security policies on all thirteen tables. Read access is granted to the anonymous role on most public content; write access (insert, update, delete) is restricted to the authenticated role for owner-only records (projects, pinboards, pins) and to elevated roles for editorial content. Public sharing of pinboards is mediated by short-lived enabled tokens stored in a service-role-only table, with no direct anon or authenticated access to that table.

## **9.2 Data quality and reproducibility**

The Knowledge substrate is designed to be rebuildable from its sources, which gives the team confidence that improvements to the AI pipeline (better prompts, updated models, refined taxonomies) can be applied without requiring data migrations or risking the loss of user content. Generated representations (recipes, summaries, embeddings, multilingual translations) are tied to source documents by stable identifiers and can be regenerated independently.

Multilingual content quality is being actively monitored. The current limitation around Spanish and Italian translations being shorter than the originals is documented in Section 6.6 and is in the active improvement queue.

## **9.3 Alignment with EU digital and AI principles**

AI integration follows the principles laid out in D7.2: AI is used to facilitate understanding, comparison and the production of derivative outputs, rather than to replace expert judgement or to generate authoritative content. AI-assisted features expose their provenance (the original source documents) and let users return to the underlying material at any point.

*\[PLACEHOLDER: if applicable, cite the specific EU digital and AI governance principles referenced (e.g. AI Act categories, FAIR principles) and the platform's response to each\]*

## **9.4 Accessibility**

*\[PLACEHOLDER: summarise the accessibility approach: keyboard navigation, contrast ratios, alt text on images, multilingual support as accessibility lever; cite the WCAG level targeted\]*

# **10\. Sprint-by-sprint development log**

The development of the Transformation Hub unfolded over twelve two-week sprints between 2 February and 19 June 2026\. Each sprint had an explicit objective covering backend and frontend deliverables, a register of risks and, for the first five sprints, a written close-of-sprint document. Table 5 summarises the objectives and the final status; the detailed log is reproduced in Annex 3\.

*Table 5\. Sprint summary.*

| \# | Dates | Objective | Status at 30 June 2026 |
| :---- | :---- | :---- | :---- |
| 1 | 02–13 Feb 2026 | Data architecture and initial code cleanup | Completed |
| 2 | 16–27 Feb 2026 | Tidying existing code (prototypes, web, Connected Action) | Completed |
| 3 | 02–13 Mar 2026 | Initial architecture and key features implementation | Completed |
| 4 | 16–27 Mar 2026 | Backend and user management | Completed |
| 5 | 16–27 Mar 2026 | Recipe view and home redesign (external supplier) | Not delivered — absorbed into sprints 6+ |
| 6 | 30 Mar–10 Apr 2026 | Visual design and coherence | Completed |
| 7 | 30 Mar–08 May 2026 | Production of Stories content | Not delivered — partner availability |
| 8 | 13–24 Apr 2026 | New transformation features | Completed |
| 9 | 27 Apr–08 May 2026 | AI refinement and feature completion | Partial |
| 10 | 11–22 May 2026 | Main website and multilingual | Partial |
| 11 | 25 May–05 Jun 2026 | Connected Action finalisation | \[PLACEHOLDER: confirm status at 30 June 2026\] |
| 12 | 08–19 Jun 2026 | Loose ends and beta delivery | \[PLACEHOLDER: confirm beta delivery\] |

Outside of formal sprints, three milestones shaped the development trajectory. The 13 April 2026 videoconference confirmed an approximately one-week slippage on the original plan, recorded the decision to discard dark mode and explored the two layout options for the Recipe view. The 28 April 2026 email from the development lead reorganised the role of the Pinboard and committed to an explicit prioritisation of AI-assisted transformations. The 11 May and 26 May 2026 progress reviews tracked the Italian translation work, the PowerPoint generation improvements, the new Skills CMS and the Stories section setup.

# **11\. Integration with Connected Action for EU Adaptation (T6.5)**

The Connected Action for EU Adaptation visualisation, developed under Task T6.5, is integrated into the Transformation Hub as a focused view of the actors providing data, tools, technical assistance and finance for climate adaptation across Europe. The integration is accessible from the global navigation under Connected Action and exposes a Dashboard, an Entities Map, a Projects view and the Projects UMAP visualisation.

During sprint 11 the team worked on the finalisation of Connected Action, focusing on the consolidation of existing prototypes and the alignment of its visual style with the rest of the Hub. As of the 26 May 2026 review, an outstanding item was the styling alignment of Connected Action with the rest of the platform.

*\[PLACEHOLDER: confirm the final integration status at 30 June 2026 and the responsible partner\]*

# **12\. Conclusions, lessons learned and next steps**

## **12.1 Outcome**

Task T7.3 delivers a working FARCLIMATE Transformation Hub. The platform exposes a curated catalogue of climate adaptation case studies presented through a standardised recipe view, with hybrid keyword-plus-semantic search, faceted filtering, multilingual access in English, Spanish and Italian, registered-user projects and pinboards, public pinboard sharing, AI-assisted transformations into slides, podcasts, mindmaps and synthetic recipes, a UMAP-based bioregional visualisation, and an integrated Connected Action view of European adaptation actors. The platform is operational at https://farclimate-hub.netlify.app and the content management system at https://farclimate-hub.netlify.app/admin/skills.

The features prioritised during T7.2 have been substantially implemented (see Annex 1 for the detailed mapping). Where the implementation deviated from the original design — notably in the visual identity workflow, the Pinboard transformations and the Stories production pipeline — the rationale is documented in the relevant section above and in the sprint log.

## **12.2 Lessons learned**

Several lessons emerge from the implementation phase that are relevant both to the next stages of FARCLIMATE and to comparable platform projects.

* A pragmatic stack built around PostgreSQL with row-level security, vector extensions and a small set of well-understood tools (Nuxt, Supabase, the Vercel AI SDK) was sufficient for a corpus of hundreds to low thousands of documents and avoided the operational cost of deploying dedicated vector databases, graph databases or managed ingestion platforms.

* Reproducible pipelines (the rebuildability principle) proved their value during the development itself: prompt iterations, taxonomy refinements and model upgrades could be applied without disturbing user-curated content. This property should be preserved as the platform evolves.

* Bringing the visual identity work in-house rather than sub-contracting it accelerated the design-to-implementation feedback loop and let the team treat the design system as a living artefact rather than a one-off delivery.

* Story production through external partners requires its own dedicated planning track, ideally initiated during T7.1; treating it as a development sprint led to a realised risk that affected downstream sprints. Future content-dependent activities should be planned outside the implementation timeline.

* AI features were most useful when chosen for the specific value they unlock (semantic search, recipe extraction, slide and podcast generation, mind mapping) rather than added because they are technically possible (generative video was deliberately discarded). This deliberate selection approach should continue to guide the evolution of the platform.

* Multilingual support requires a quality monitoring loop on the content side, not only on the UI side: in this case, automatic translations shorter than the originals materially affected search recall and triggered a targeted improvement task.

* Continuous co-creation via fortnightly videoconferences and asynchronous written updates allowed the team to refine priorities in flight without imposing the overhead of a heavier governance process.

## **12.3 Next steps**

The Transformation Hub is now ready to enter the user testing phase under Task T2.4. The planned activities include:

* Living-labs testing of the platform with primary users across the three priority sectors (agriculture, forestry, fisheries), generating iterative feedback to be processed via the GitHub Issues workflow.

* Continued growth of the case study corpus, including the incorporation of complementary sources beyond Climate-ADAPT where they meet the Hub's quality criteria.

* Continued production of Stories content, in coordination with the partner network.

* Improvement of the Spanish and Italian content quality, with a focus on closing the translation-length gap that currently degrades search recall.

* Refinement of the AI-assisted transformations based on user feedback, including the synthetic Recipe view.

* Final visual alignment of the Connected Action component with the rest of the Hub.

* Continued integration with other FARCLIMATE work packages and external collaborations.

*\[PLACEHOLDER: describe in more detail the T2.4 testing protocol: timeline, living labs involved, evaluation metrics, success criteria, feedback loop with development\]*

# **References**

FARCLIMATE consortium (2024). Deliverable D7.1 — User research and content strategy.

FARCLIMATE consortium (2025). Deliverable D7.2 — Platform Documentation.

European Environment Agency. Climate-ADAPT — European Climate Adaptation Platform. https://climate-adapt.eea.europa.eu

Architecture Research — Transformation Hub (internal working document, FARCLIMATE).

Diario de acciones técnicas — Transformation Hub (internal technical journal, FARCLIMATE).

Seguimiento del desarrollo — Transformation Hub (internal sprint log and progress reviews, FARCLIMATE).

Decision Matrix for Feature Integration (FARCLIMATE, 17 September 2025\) — internal companion workbook to D7.2 Annex 7\.

MIP4Adapt — EU Mission Implementation Platform for adaptation. https://mip4adapt.eu

*\[PLACEHOLDER: complete with additional references cited in the body — EU AI Act, FAIR principles, RAG / vector databases literature, Supabase documentation, Vercel AI SDK documentation, etc.\]*

# **Annex 1\. Features implementation matrix**

This annex maps the features evaluated in the Decision Matrix of Deliverable D7.2 (Annex 7, source workbook "Decision Matrix for Feature Integration" dated 17 September 2025\) against their implementation status at 30 June 2026\. It is organised in four tables: (A) features that D7.2 decided to Implement, with the status of their implementation in T7.3; (B) features that D7.2 decided to Defer, indicating those that ended up implemented during T7.3 and those that remain deferred; (C) features that D7.2 decided to Discard, confirming their final status; and (D) features that were not present in the D7.2 Decision Matrix and emerged during T7.3 as infrastructure or content-pipeline components.

Status legend at 30 June 2026: Done \= operational; Partial \= implemented with known gaps or in active improvement; Done (PoC) \= implemented as a proof of concept; Deferred \= not implemented within T7.3 scope; Discarded \= deliberately not implemented; \[PLACEHOLDER\] \= pending verification.

## **A. Features decided as "Implement" in D7.2**

*Table A1. Features marked Implement in D7.2 and their delivery status in T7.3.*

| Feature (D7.2) | User journey phase | Status 30 Jun 2026 | Notes / Implementation reference |
| :---- | :---- | :---- | :---- |
| Access to Climate-ADAPT solutions database | Search & Explore | Done | 146 case studies ingested via the Climate-ADAPT pipeline |
| Access to other platforms with climate adaptation solutions | Search & Explore | Partial | Architecture supports multi-source ingestion; only Climate-ADAPT operational at 30 Jun 2026 — \[PLACEHOLDER: confirm any additional source ingested\] |
| AI-based Interactive Search | Search & Explore | Done | Hybrid keyword \+ semantic search with Gemini embeddings (see Section 6.1) |
| Smart filtering | Search & Explore | Done | Faceted filtering on Sector, Climate impacts, Adaptation approaches, Biogeographical region (see Section 6.1) |
| Geographic view of results | Analysis & Assessment | Done | Map view mode in the Explorer (see Section 6.1, Section 6.5) |
| Text / image display of results | Analysis & Assessment | Done | List and Images view modes in the Explorer |
| Ecoregional results | Analysis & Assessment | Done | By bioRegions view mode based on UMAP layout (see Section 6.5) |
| AI-enhanced comparisons | Analysis & Assessment | Done | Compare view mode \+ Chat with selection (see Section 6.4) |
| Get insights | Analysis & Assessment | Done | Top insights action on the Pinboard (see Section 6.4) |
| Chat with the results | Analysis & Assessment | Done | Chat with selection on loaded pages and on the Pinboard |
| Mindmap | Analysis & Assessment | Done | Mind map generation from selected pins (see Section 6.4) |
| Multi-layered solution view | Analysis & Assessment | Done | Result list summary \+ recipe view \+ full article view (see Section 6.2) |
| Re-arrange solutions to fit recipe | Analysis & Assessment, IM\&C | Done | Recipe pipeline (\_RECIPE\_PROMPT\_TEMPLATE) renders all case studies in the standard recipe format |
| User identity | IM\&C | Done | Supabase user identities with anonymous / authenticated / editor roles |
| Login to save | IM\&C | Done | Email \+ OTP login flow (see Section 9.1) |
| Create boards | IM\&C | Done | Implemented as Pinboards, one per project (see Section 6.3) |
| Save content to board | IM\&C | Done | Pinning of full articles, images, diagrams, selected text and blocks (see Section 6.3) |
| Add annotations to saved content | IM\&C | Done | user\_note field on pins |
| Explore and analyse saved content with AI | IM\&C | Done | Chat with selection \+ Top insights \+ Mind map on the Pinboard |
| Share "project" read-only | IM\&C | Done | Public pinboard sharing with opaque token (see Section 6.3) |
| Download media | IM\&C | Done | Export selection action (see Section 6.4) |
| Include AI generated images | IM\&C | \[PLACEHOLDER: confirm\] | Improved image retrieval from Climate-ADAPT implemented; AI-generated image fallback — confirm status at 30 Jun 2026 |
| Presentation template | IM\&C | Done | PowerPoint generation from pins (see Section 6.4) |
| Posts "Instagram style" | IM\&C | Partial | Image-driven view implemented; minor known issue with duplicate image |
| Multilingual interface | All phases | Done | EN / ES / IT switcher; multilingual content with active quality improvement on ES and IT translations |

## **B. Features decided as "Defer" in D7.2**

Of the ten features deferred in D7.2, two were promoted to implementation during T7.3 (Podcast generation as a proof of concept; Video as a brief implementation experiment that was subsequently discarded). The remaining eight remain deferred to a future stage.

*Table A2. Features marked Defer in D7.2 and their status in T7.3.*

| Feature (D7.2) | User journey phase | Status 30 Jun 2026 | Notes |
| :---- | :---- | :---- | :---- |
| Access to technical and scientific sources | Search & Explore | Deferred | Not implemented in T7.3; architecture ready for additional source pipelines |
| Access to local knowledge about climate adaptation | Search & Explore | Deferred | Not implemented in T7.3 |
| AI-based search customized by user profiles | Search & Explore | Deferred | Not implemented in T7.3 |
| Share "project" collaborative | IM\&C | Deferred | Read-only public sharing implemented (Table A); collaborative editing not in T7.3 scope |
| Federate | IM\&C | Deferred | Out of scope for T7.3 |
| Podcast | IM\&C | Done (PoC) | Promoted during sprint 8 prioritisation exercise; external API (e.g. Jellypod) evaluated; proof-of-concept available (see Section 6.4) |
| Video | IM\&C | Discarded during T7.3 | Talking-head video generation evaluated and explicitly discarded in the 28 April 2026 reorganisation as belonging to a different product |
| Recipe building | IM\&C | Partial | Synthetic recipe across selected pins implemented as an experimental feature (see Section 6.4) |
| Voice-Activated Information Navigation | All phases | Deferred | Out of scope for T7.3 |
| AI-Assisted Language Translation for Communication | All phases | Deferred | Multilingual interface and content translations delivered (Table A); real-time AI translation for live communication not in T7.3 scope |

## **C. Features decided as "Discard" in D7.2**

The three features discarded in D7.2 remain out of scope. Their absence has been verified through the platform audit.

*Table A3. Features marked Discard in D7.2.*

| Feature (D7.2) | User journey phase | Status 30 Jun 2026 | Notes |
| :---- | :---- | :---- | :---- |
| Node-based interface | Analysis & Assessment | Discarded | Not implemented; not part of the user journey |
| Forum | IM\&C | Discarded | Not implemented; community interaction handled through sharing rather than discussion |
| Logbook / timeline | IM\&C | Discarded | Not implemented; project documentation orientation deemed out of scope |

## **D. Features emerged during T7.3 (not in the D7.2 Decision Matrix)**

These features were not evaluated as discrete items in the D7.2 Decision Matrix because they correspond either to infrastructure required to make the prioritised features work (architecture, pipelines, security) or to platform-wide capabilities elaborated during the development itself.

*Table A4. Features that emerged during T7.3.*

| Feature emerged in T7.3 | Category | Status 30 Jun 2026 | Notes / Sprint reference |
| :---- | :---- | :---- | :---- |
| Data architecture decision (Supabase / PostgreSQL with vector extension) | Infrastructure | Done | Sprint 1; Architecture Research |
| ETL data pipeline (pull → preprocess → on-demand) | Infrastructure | Done | Sprint 1; pipelines repository |
| Hierarchical geocoding (city → sub-nationals → country → macro region → continent) | Search & Explore (data quality) | Done | Sprint 3 |
| Cost estimation extraction from source documents | Search & Explore (data quality) | Done | Sprint 3 |
| Server-side pagination with client-side page cache | Search & Explore | Done | Sprint 3 |
| Faceted search with dual corpus/result counts | Search & Explore | Done | Sprint 3 |
| Saved searches | Search & Explore | Done | Sprint 3–4 |
| Persist chat conversations linked to articles | Analysis & Assessment | Done | Post 26 May 2026 review |
| UMAP layout of bioregions | Analysis & Assessment | Done | Sprint 4 |
| Map of pinned items with coordinates | Information Management & Collaboration | Done | Post 28 April 2026 email |
| Row-level security policies on all 13 tables | Security infrastructure | Done | Sprint 4; Technical journal |
| Public pinboard sharing via opaque token | Information Management & Collaboration | Done | Post 28 April 2026 email; Technical journal |
| Email \+ One-Time Password authentication | Security | Done | Sprint 4 |
| Skills content management system | Content management | Done | Sprint 9–10; 26 May 2026 review |
| Stories section (UI and layout) | Content publishing | Partial | Sprint 10; content production track ongoing |
| Coherent design system ("Dee" internal guide) | Visual identity | Done | Sprints 6+ (in-house after sprint 5 external supplier pivot) |
| Integration with Connected Action (T6.5) | Integration | Partial | Sprint 11; style alignment in final iteration |
| GitHub Issues \+ semi-automated agent workflow | Feedback management | \[PLACEHOLDER: confirm at 30 Jun\] | Started post 26 May 2026 review |
| Beta release for living labs (T2.4) | Release | \[PLACEHOLDER: confirm at 30 Jun\] | Sprint 12 — Excel plan |

# **Annex 2\. Database schema overview**

The full technical schema is available as a separate Excel workbook (estructura\_database\_Transformation\_Hub.xlsx). Table A5 summarises the role of each table in the data model.

*Table A5. Database tables of the Transformation Hub.*

| Table | Domain | Role |
| :---- | :---- | :---- |
| documents | Knowledge | Main anchor entity — links the object storage and the database with a stable cannonical\_id, source\_uid, source\_url, source\_type, pipeline\_version, insertion\_date. |
| summary | Knowledge | Per-document structured attributes for filtering: sectors, hazards, types of solution, bioregion, etc. |
| summary\_multilang | Knowledge | Multilingual textual summary fields keyed by summary\_key and lang (titles, economic data, summary). |
| generated\_summaries | Knowledge | Short AI-generated summaries per criterion (success, participation, cost), keyed by summary\_id and lang. |
| recipe | Knowledge | Recipe-format multilingual view per document (context, challenges, policy context, legal aspects, …) generated by the pipeline. |
| fulltext | Knowledge | Full text of the original article in object storage or translated form, keyed by document\_id and language, with format\_type. |
| media | Knowledge | Media assets (images, figures, extracted tables) associated with documents — bucket, object\_path, mime\_type. |
| bioregions | Knowledge | Bioregion definitions (name, regions, contour). \[PLACEHOLDER: confirm contour storage approach\] |
| user\_projects | Human | User-owned projects with search\_state and search\_history (jsonb) to restore filter state. |
| user\_pinboard | Human | One pinboard per project, linked to user and project via project\_id, user\_id, public\_id (UUID for sharing). |
| user\_pins | Human | Pin base record: pin\_type (note, summary, image…), user\_id, board\_id, document\_id, title, body\_text. |
| user\_pins\_payload | Human | Pin variable payload as jsonb, keyed by pin\_id. |
| human.project\_share\_links | Human | Public share tokens per project for read-only pinboard sharing (enabled \+ revoked\_at). |

# **Annex 3\. Detailed sprint log**

This annex reproduces the close-of-sprint notes captured by the development team, plus the salient out-of-sprint communications (videoconferences and emails) that shaped the development trajectory. Sources: Seguimiento\_desarrollo\_Transformation\_Hub.docx and Project\_management\_Development\_Transformation\_Hub.xlsx.

**Sprint 1 — 02–13 Feb 2026**

*Data architecture and initial code cleanup*

Review of tooling options and decision on the overall backend approach (Supabase / PostgreSQL with vector extension). Implementation of the initial Climate-ADAPT pull pipeline; HTML scraping was found to be brittle. Database creation scripts and content upload scripts were also implemented. The isInviable GitHub organisation was created. Pending items: taxonomies and the full per-field description of the Recipe.

**Sprint 2 — 16–27 Feb 2026**

*Tidying existing code*

Frontend application structure created under apps/web in the repository, consolidating components previously distributed across three prototypes. Page headers were created to link the different sections. The search backend (which depended on the external Orama service that had changed its API) was partially re-implemented in-house: preprocessing now generates embeddings with Gemini, embeddings are stored in the database and indices are enabled, although the new stack was not yet tested.

**Sprint 3 — 02–13 Mar 2026**

*Initial architecture and key features*

Backend: pipeline improvements on geographic characterisation (now structured, with bioregion fields populated; nulls when missing) and hierarchical geocoding (city → sub-nationals → country → macro\_region → continent). Cost estimation is now stored when available. One hundred test projects ingested. Search: backend hybrid faceted search now working (documented in the technical journal). Frontend: small aesthetic improvements; failed experiments with Pencil. Users (originally scheduled for sprint 4): Supabase role-based authentication implemented; users can log in, create projects and save basic search results. Online: https://farclimate-hub.netlify.app.

**Sprint 4 — 16–27 Mar 2026**

*Backend and user management*

Mostly implemented (≈ 80 %), with the pinning part untested. Result list now shows context badges reflecting why each row matches the active query and filters. UMAP of bioregions implemented, with documents grouped by bioregion and secondary latitude/longitude. Recipe pipeline improved with a richer prompt template (\_RECIPE\_PROMPT\_TEMPLATE in the augment\_with\_ai.py script). Authentication moved to email \+ OTP. Grid view and associated summary working again. Full article view recovered (initial rough version). Chat rebuilt on the new Vercel AI SDK version with nuxt-ui widgets. Pins backend architecture solved, owner-only via RLS, but only partially integrated on the frontend.

**Sprint 5 — 16–27 Mar 2026**

*Recipe and home redesign (external supplier)*

Not delivered. The negotiation with an external design supplier did not converge. The team decided to keep the design work in-house, which would also surface the design implementation cost more clearly in real time. The Recipe and home redesign work was absorbed into sprints 6 and onwards.

**Sprint 6 — 30 Mar – 10 Apr 2026**

*Visual design and coherence*

Coherent interface aligned with the internal design guide (Dee). Design rollout across the frontend.

**Sprint 7 — 30 Mar – 08 May 2026**

*Stories content production*

Not delivered against original scope. Difficulty in finding partners willing to commit story production within the planned timeframe. Internal effort started in parallel; the Stories section currently has a small number of published stories with additional content in the production pipeline.

**13 April 2026 — Videoconference**

*Mid-task review*

Approximate one-week slippage on the original plan acknowledged. Review of the design system. Visualisation experiments applying the design system. Dark mode discarded. Point-level UI improvements (cards, colours) to continue. Two layout options for the Recipe page explored: slideshow vs vertical scroll.

**Sprint 8 — 13–24 Apr 2026**

*New transformation features*

APIs for generated content (presentations, video evaluated, images, podcasts). Improved image views. Pinboard improvements supporting pinning of fragments, images, diagrams, selected text and full blocks. Mind maps and offline export.

**28 April 2026 — Email update**

*Strategic reorganisation*

The development lead consolidated a number of decisions: full deployment of the in-house design model in lieu of an external supplier; reorganisation of the Pinboard around four use cases (sharing materials with the team or community; materials to facilitate consumption or dissemination; materials to elaborate the user's own recipe; contacts and references); explicit prioritisation of AI-assisted transformations (download all, mind maps, podcasts, synthetic recipes) and explicit discard of slide-style video generation. Figma handoff link circulated.

**Sprint 9 — 27 Apr – 08 May 2026**

*AI refinement and feature completion*

Partial. Improvements to AI responses; iteration on existing features. Per the original plan, this sprint should have closed the AI track; the 28 April reorganisation extended part of this work.

**11 May 2026 — Progress review**

*Mid-sprint review*

Main deliverables of the week: Italian translation, redesign, PowerPoint generation, miscellaneous fixes. Pending iteration items: public boards, search and filter refinement, chat conversation persistence linked to articles, recipe-mode summary. Aesthetic improvements still in progress on a per-screen basis. Recipe felt buried in the article view; pins were too visible.

**Sprint 10 — 11–22 May 2026**

*Main website and multilingual*

Partial. Home layout, stories layout, multilingual support. Constrained by the availability of Stories content.

**26 May 2026 — Progress review**

*Pre-final review*

Bugs and improvements: Italian search returning zero results fixed; language improvements; home page layout; faceted search refinement; PowerPoint generation aesthetics; article view; image view; internal code refactor. New: Skills CMS module; Stories section (empty layout published); chat conversation persistence. Next two weeks: improve Spanish and Italian search (the uploaded translations are shorter than the originals and results are missed); align Connected Action style; improve slide and podcast content; define the content to incorporate (e.g. the current About text); from Friday, start processing partner bugs and improvements via GitHub Issues with semi-automated agents.

**Sprint 11 — 25 May – 05 Jun 2026**

*Connected Action finalisation*

\[PLACEHOLDER: confirm the full set of deliverables completed by 30 June 2026 — dashboard finalisation, project views implementation, prototype consolidation, full integration into the web\]

**Sprint 12 — 08–19 Jun 2026**

*Loose ends and beta delivery*

\[PLACEHOLDER: confirm general review, error correction, final adjustments and beta delivery preparation by 30 June 2026\]

# **Annex 4\. Metrics snapshot at the cut-off date**

This annex captures the platform metrics observed at the writing of this report (late May 2026), to be updated for the final version submitted on 30 June 2026\.

*Table A6. Platform metrics snapshot.*

| Metric | Value | Source |
| :---- | :---- | :---- |
| Case studies in the corpus | 146 | Explorer audit (Showing 30 of 146\) |
| Sectors indexed | 19 | Filter audit |
| Climate impacts indexed | 15 | Filter audit |
| Adaptation approaches indexed | 24 | Filter audit |
| Biogeographical regions identified | 5 main \+ 3 minor \+ unidentified | Filter audit |
| UI languages | 3 (EN, ES, IT) | Platform audit |
| Stories published | 1 visible | Platform audit /stories |
| Skills published | 1 visible | Platform audit /skills |
| Case studies at 30 June 2026 | \[PLACEHOLDER\] |  |
| Stories at 30 June 2026 | \[PLACEHOLDER\] |  |
| Skills at 30 June 2026 | \[PLACEHOLDER\] |  |
| Registered users at 30 June 2026 | \[PLACEHOLDER\] |  |

