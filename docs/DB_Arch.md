Platform Data Architecture – Structured Design Summary

1. Architectural Overview

The platform is designed around two clearly separated but interoperable domains:
	•	Human Domain
	•	Knowledge Substrate

This separation is intentional and structural. It reflects a key architectural decision:

User-generated context must remain stable over time, while knowledge extraction pipelines may evolve and regenerate derived content.

Both domains live inside the same PostgreSQL database (Supabase), but in different schemas.

⸻

2. Database Structure

2.1 Schemas

The database contains two primary schemas:
	•	human
	•	knowledge

They share the same PostgreSQL instance and may reference each other via foreign keys.

⸻

3. Human Domain (human schema)

The Human Domain stores user context, not knowledge itself.

Core Entities

Users
Managed by Supabase Auth (external to this schema unless extended).

Projects
Represents a working context created by a user.
	•	A project belongs to one user.
	•	A project contains one pinboard.
	•	A project may store search state and preferences.

Pinboard
Container for curated items within a project.

Pins
A pin represents a user decision to save something.

Important architectural decision:

Pins store:
	•	A reference to the originating document (if applicable)
	•	A reference to the originating derived representation (optional)
	•	A snapshot copy of the content at the moment of saving

This ensures:
	•	Stability of user memory
	•	Protection against pipeline regeneration changes
	•	Trust and historical traceability

Pins are therefore not purely references.
They are frozen snapshots with provenance metadata.

⸻

4. Knowledge Substrate (knowledge schema)

The Knowledge Substrate stores long-lived, regenerable knowledge assets and their derived representations.

It is designed to be:
	•	Rebuildable
	•	Deterministic
	•	Decoupled from user decisions

⸻

5. Document Identity Strategy

5.1 Dual Identity Model

Each document has:
	•	id → technical UUID (primary key)
	•	document_uid → stable logical identifier derived from canonical content

document_uid is generated from:
	•	normalized XML content
	•	source metadata
	•	canonicalized structure

This enables:
	•	Rebuilding the database without breaking identity
	•	Duplicate detection
	•	Long-term referential stability

All external references and human-domain references rely on the stable identity.

⸻

6. Knowledge Tables

6.1 Documents

Represents one ingested external case study or document.

Stores:
	•	Stable identity
	•	Source metadata
	•	Object storage path
	•	Ingestion metadata

Does not store derived interpretation.

⸻

6.2 Summary

Structured, filterable attributes extracted from documents.

Purpose:
	•	Faceted search
	•	Filtering
	•	Structured queries

Characteristics:
	•	Typed fields
	•	Regenerable
	•	Versionable if needed

⸻

6.3 Summary Multilingual

Stores translatable textual summary components.

Purpose:
	•	Language independence
	•	Avoid schema duplication
	•	Add languages without structural changes

⸻

6.4 Derived Representations

Includes:
	•	Generated summaries (LLM outputs)
	•	Recipe-style structured representations
	•	Full-text normalized representation

These are:
	•	Deterministic or semi-deterministic outputs
	•	Regenerable
	•	Linked to the document

They are not embedded inside documents.

⸻

6.5 Media

Media is associated with documents, not projects.

Stores:
	•	Extracted images
	•	Figures
	•	Tables

Media persists independently of user interaction.

⸻

7. Pipeline Architecture

The system operates as a multi-stage pipeline.

⸻

Stage 1 – Ingestion

Input:
Climate-ADAPT XML metadata pages such as:

https://climate-adapt.eea.europa.eu/en/metadata/case-studies/…

Actions:
	•	Download XML metadata
	•	Download associated images and assets
	•	Store all raw files in object storage
	•	Preserve original structure

Object storage is the source of truth.

Raw files are immutable.

⸻

Stage 2 – Preprocessing

For each XML document:
	1.	Parse canonical structure
	2.	Extract critical fields
	3.	Normalize content
	4.	Generate canonical text
	5.	Compute stable document_uid
	6.	Insert or update document entry

Then:
	•	Generate structured summary
	•	Generate multilingual summaries
	•	Call LLM APIs for derived outputs
	•	Store outputs in dedicated derived tables

This stage must be reproducible.

Given identical XML inputs, it must generate equivalent database state.

⸻

Stage 3 – On-Demand Operations

Triggered by user interaction:
	•	Search
	•	Filtering
	•	AI chat over selected documents
	•	Comparative queries

These operations:
	•	Do not modify the knowledge substrate
	•	May cache results
	•	May generate ephemeral responses

⸻

8. Snapshot Strategy for User Content

Critical design decision:

When a user saves content:
	•	The system stores:
	•	The stable reference (document_uid)
	•	The derivation reference (if applicable)
	•	A full snapshot of the displayed content

This prevents:
	•	Retroactive mutation of saved content
	•	Inconsistency caused by regeneration
	•	Loss of user intent

The knowledge substrate can evolve without rewriting user memory.

⸻

9. Schema Separation Rationale

Why separate schemas?
	•	Clear conceptual boundaries
	•	Independent RLS policies
	•	Reduced coupling
	•	Future scalability
	•	Cleaner migrations

Cross-schema foreign keys are allowed and used.

⸻

10. How to Provide Table Definitions to Code-Generating Agents

Avoid XML for database definition.

XML is verbose and not idiomatic for PostgreSQL schema design.

Better options:

Option A – SQL DDL (Recommended)

Provide:
	•	CREATE SCHEMA statements
	•	CREATE TABLE definitions
	•	Constraints
	•	Indexes
	•	Foreign keys

This is the most direct and unambiguous input.

⸻

Option B – DBML (dbdiagram format)

Clear, declarative, structured, machine-readable.

Good for:
	•	Generation
	•	Visualization
	•	Version control

⸻

Option C – Structured Markdown Specification

Define tables in structured format:

Table: knowledge.documents
Fields:
- id (uuid, pk)
- document_uid (text, unique)
- source_type (text)
- ...
Relations:
- has many summaries
- has many media
11. What Not to Do

Do not:
	•	Define tables in ad-hoc prose
	•	Mix pipeline description with DDL
	•	Use JSON as schema definition
	•	Use XML for relational structure

Keep:
	•	relational schema in SQL or DBML
	•	pipeline in structured narrative

⸻

12. Key Non-Arbitrary Decisions
	1.	Dual identity model for documents
	2.	Snapshot storage for user pins
	3.	Separation of human and knowledge domains
	4.	Regenerable derived representations
	5.	Immutable object storage source
	6.	Stable canonicalization before hashing
	7.	Media associated with documents, not users

These are structural, not cosmetic decisions.