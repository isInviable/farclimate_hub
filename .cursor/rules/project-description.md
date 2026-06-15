---
description: About this project
globs: **/*.vue
alwaysApply: false
---

The FARCLIMATE HUB project is a structured data platform designed to ingest, normalize, enrich, and serve climate-related case studies and associated metadata. The system processes semi-structured source materials (primarily HTML documents), extracts full text and initial metadata, and then applies LLM-based enrichment to generate structured summaries, multilingual variants, and normalized attributes suitable for relational storage. The goal is to transform heterogeneous narrative content into a consistent, queryable knowledge base.

The architecture follows a clear separation of concerns. Raw source content is preserved in its original or minimally processed form. Extracted metadata and LLM-generated enrichments are stored in structured relational tables (e.g., summary, summary_multilang, media, entities), designed to balance normalization with performance. Multilingual support is handled explicitly at the schema level rather than through opaque JSON blobs, ensuring consistency, referential integrity, and long-term maintainability.

The system is implemented on Supabase (PostgreSQL), with object storage for media assets and relational references linking content, summaries, and media records. The database schema prioritizes stable identifiers, explicit foreign keys, and extensibility to accommodate future enrichment dimensions (e.g., taxonomy tags, geospatial attributes, thematic classifications). Regeneration processes must preserve stable IDs whenever possible to avoid breaking user references.

Agents interacting with this repository should treat the database schema as the source of truth. Any enrichment logic, transformation pipeline, or UI layer must respect existing entity relationships and constraints. Changes to schema design should be deliberate, migration-driven, and backward-compatible where feasible. The overall objective is to maintain a robust, evolvable knowledge architecture that supports analytical queries, visualization layers, and future AI-driven expansion.

The HUB have three main blocks:
- Explorer tool is what has been previously described 
- Some data visualizations tools to provide information about organisations working in the field of climate change adaptation. We are callind that section "connected" or "connected action"
- As a subsection there is an admin panel to manage the content of the connected section
- Finally there are going be multiple static pages such as index, about, contact, etc.
- 