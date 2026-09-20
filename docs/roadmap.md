# Roadmap

The module now has a stable deterministic generator, scalable hierarchical pickers, exact CR configuration, AI-assisted JSON import, and canonical-item resolution. Later releases can build on those foundations without coupling optional features to the generator core.

## Candidate 0.2.x features

- Preview and reroll individual generated fields before creation.
- User-defined generator presets stored as world settings.
- More naming packs and custom naming-pack import/export.
- Optional skill-proficiency generation tied to role.
- Richer folder-management actions without eagerly scanning Actor contents.
- Bulk post-generation actions.

## Candidate 0.3.x features

- Encounter-oriented grouped generation.
- Expand canonical equipment resolution with configurable pack priority and diagnostic reporting.
- Extensible provider interface for optional AI integrations without making network access part of the core module.
- Versioned JSON blueprint export alongside the existing validated AI import contract.

## Long-term principles

- Core generation remains local, deterministic, and useful without third-party services.
- Optional integrations remain isolated adapters.
- Large collections use indexed, virtualized, or on-demand workflows rather than eager full-world rendering.
- UI work stays on supported Foundry application APIs and avoids legacy Dialog/Application patterns.
