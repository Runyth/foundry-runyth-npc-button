# Roadmap

The module now has deterministic individual/group generation, habitat-aware generation, advanced mixed-Race composition, scalable hierarchical pickers, exact CR configuration, AI-assisted JSON import, and canonical-item resolution.

## Candidate 0.2.x features

- Preview and reroll individual generated fields before creation.
- Save/load user-defined NPC and group presets as world configuration.
- User-authored naming packs with import/export.
- More granular family templates, age/generation structure, and household-economy modeling.
- Optional skill, save, language, and proficiency generation tied to role/group function.
- Group-level preview showing Race quotas, member roles, and relationships before Actor creation.
- Richer folder-management actions without eagerly scanning Actor contents.
- Bulk post-generation actions.

## Candidate 0.3.x features

- Versioned group-blueprint JSON export/import.
- Custom user-authored group archetypes and reusable faction templates.
- Expand canonical equipment resolution with configurable pack priority and diagnostics.
- Optional encounter-oriented combat packages layered over the social/group model.
- Extensible provider interface for optional AI integrations without making network access part of the core module.

## Long-term principles

- Core generation remains local, deterministic, and useful without third-party services.
- AI remains an optional enhancement rather than a requirement.
- Optional integrations remain isolated adapters.
- Large collections use indexed, virtualized, or on-demand workflows rather than eager full-world rendering.
- Group generation favors coherent relationships and responsibilities over interchangeable random stat blocks.
- UI work stays on supported Foundry application APIs and avoids legacy Dialog/Application patterns.
