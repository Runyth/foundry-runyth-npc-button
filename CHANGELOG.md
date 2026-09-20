# Changelog

All notable changes are documented here. The project follows Semantic Versioning.

## 0.1.1 - 2026-09-20

### Added

- AI-native **Copy prompt** and **Import NPC** clipboard workflow.
- Strict array-by-default AI payload contract, with optional single-object mode only when Count is 1.
- AI payload count/shape validation and safe Actor-source normalization.
- Biography HTML sanitization for AI-imported NPCs.
- Manual JSON paste fallback for clients that block clipboard reads.
- Resizable dashboard with remembered client-side window size and placement.
- Title-bar Help button with field explanations, naming-style examples, and AI workflow guidance.
- Count shortcuts for 1, 3, 5, and 10 while retaining arbitrary numeric input.

### Changed

- Renamed the Actors-directory button to **NPC Button**.
- Reworked the dashboard into clearer grouped sections and more ergonomic segmented controls.
- Replaced separate preset/custom species controls with a single suggestion-enabled species field.
- Replaced existing/new-folder selection with a single suggestion-enabled destination field.
- Removed select-based dashboard interactions that could exhibit close-animation flicker.
- Switched Actor batch creation to Foundry's public `Actor.implementation.createDocuments` API.
- Documentation release ZIPs no longer include `module.json`.

## 0.1.0 - 2026-09-20

### Added

- Initial MVP release.
- Actors-directory NPC creation button.
- Deterministic seeded generator with batch creation.
- Six roles, five tiers, common humanoid species presets, four naming styles, and custom species support.
- D&D 5e NPC Actor data generation for abilities, AC, HP, movement, CR, size, type, and biography.
- Existing-folder targeting and automatic default/new root-folder creation.
- English and German localization.
- Client-side option persistence and optional debug logging.
- Public module API and lifecycle hooks.
- Unit tests, repository validation, Forgejo CI, and release build tooling.
