# Architecture

## Design goals

Runyth NPC Button keeps deterministic generation, AI payload handling, Foundry persistence, and UI integration separated. Pure data logic remains testable without a running Foundry server, while version-sensitive code stays at the Foundry boundary.

## Layers

| Layer | Path | Responsibility |
| --- | --- | --- |
| Entry point | `scripts/main.mjs` | Hooks, settings registration, public API |
| UI | `scripts/ui/` | Actor-directory integration, dashboard, help window |
| AI contract | `scripts/ai/` | Prompt construction, JSON parsing, validation, normalization, HTML sanitization |
| Generator | `scripts/generator/` | Pure deterministic NPC blueprints and Actor source construction |
| Foundry service | `scripts/services/` | Folder resolution and batched Actor creation/import |
| Infrastructure | `scripts/settings.mjs`, `scripts/logger.mjs` | Configuration, window state, diagnostics |

## Dashboard UX

The dashboard uses ApplicationV2 with a resizable window. Its `left`, `top`, `width`, and `height` are stored as a client setting and restored within the current viewport.

Count uses a normal numeric field for arbitrary values plus common shortcuts. Role, tier, and naming style use radio-backed segmented choices. Species and Destination use text inputs with suggestions, allowing preset selection and free-form input without a separate Custom mode or separate new-folder mode.

## AI boundary

The module does not call an AI service. `Copy prompt` produces a portable, strict JSON-only request. The user manually pastes that prompt into any AI conversation and copies the resulting JSON back.

AI output is treated as untrusted input. The importer:

1. parses the clipboard or manual-paste text;
2. enforces the requested root shape and exact count;
3. validates required D&D 5e Actor fields and numeric bounds;
4. constructs a fresh Actor source instead of trusting arbitrary document fields;
5. sanitizes biography HTML to a tiny attribute-free allowlist;
6. applies folder placement locally;
7. creates the validated Actors through Foundry's public batch document API.

The default root shape is always an array. A single object is valid only when Count is 1 and the dedicated single-object toggle is enabled.

## Compatibility strategy

The manifest restricts activation to D&D 5e and records the supported D&D 5e range. Runtime code uses public Foundry APIs where available, including ApplicationV2 window behavior and `Actor.implementation.createDocuments`.

The Actor-directory integration uses the public render hook and only a small DOM insertion adapter. If a future Foundry release changes directory markup, that adapter can be replaced without touching generation, AI validation, or persistence logic.
