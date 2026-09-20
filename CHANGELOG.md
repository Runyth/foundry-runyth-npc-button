# Changelog

All notable changes are documented here. The project follows Semantic Versioning.

## 0.1.2 - 2026-09-20

### Added

- World-level **Tier style** setting with named tiers or exact Challenge Rating mode.
- Complete CR picker covering 0, 1/8, 1/4, 1/2, and CR 1 through 30.
- Reusable searchable, scrollable, virtualized hierarchical picker component.
- Hierarchical scalable pickers for Role, Race, Naming style, Tier/CR, and Actor folder selection.
- Wealth selection: Poor, Average, Well-Off, and Elite.
- Additional practical NPC roles including Artisan, Merchant, Acolyte, Scholar, Soldier, and Noble.
- Multi-window Actor review layout opening up to ten created Actors in stacked side-by-side columns.
- AI inventory contract with canonical D&D equipment lookup and safe roleplay-item fallback.
- Canonical item resolution against modern D&D 5e equipment content with legacy SRD fallbacks.
- AI biography requirements for Rumours, Secrets, Relationships, and cross-NPC connections when appropriate.

### Changed

- Changed the default user-facing term **Species** to **Race**.
- Expanded the AI prompt substantially with role-specific equipment guidance, wealth-aware possessions and money, richer table-use biography requirements, and batch relationship guidance.
- Actor review now opens up to ten created Actors instead of only the last Actor.
- Help naming examples now show four clearly distinct examples plus a short description of each naming palette.
- Actor folder selection now preserves nested folder hierarchy instead of flattening paths into a text suggestion list.
- Documentation release ZIP continues to exclude `module.json` by enforced build invariant.

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
