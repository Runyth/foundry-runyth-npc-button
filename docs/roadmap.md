# Roadmap

The MVP establishes the stable core. Later releases can expand without coupling those features to the generator internals.

## Candidate 0.2.x features

- Preview and reroll individual generated fields before creation.
- User-defined generator presets stored as world settings.
- More naming packs and custom naming-pack import/export.
- Optional skill-proficiency generation tied to role.
- Better nested-folder selection and search for very large worlds.
- Bulk post-generation actions.

## Candidate 0.3.x features

- Encounter-oriented grouped generation.
- Optional equipment assignment from installed compendia through explicit, cacheable indexes.
- Extensible provider interface for optional AI integrations without making network access part of the core module.
- JSON blueprint import/export with schema versioning.

## Long-term principles

- Core generation remains local, deterministic, and useful without third-party services.
- Optional integrations remain isolated adapters.
- Large collections use indexed/on-demand workflows rather than eager full-world scanning.
- UI work stays on supported Foundry application APIs and avoids legacy Dialog/Application patterns.
