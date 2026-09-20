# Runyth NPC Button

Runyth NPC Button is a D&D 5e NPC and NPC-group generator for Foundry VTT. It supports deterministic local generation and an AI-native clipboard workflow without requiring an API key or external service integration.

## Features

- GM-only **NPC Button** action in the Actors directory.
- Resizable dashboard with client-side size and placement persistence.
- Ergonomic Count control with arbitrary numeric input plus 1, 3, 5, and 10 shortcuts.
- World-level **Tier style** setting with named competence tiers or exact Challenge Rating selection covering CR 0, 1/8, 1/4, 1/2, and 1–30.
- Searchable, scrollable, virtualized hierarchical pickers for Role, Race, Naming style, Habitat, Group type, Tier/CR, Actor folder, and mixed-race selection.
- Built-in Player's Handbook 2024 Race catalog: Aasimar, Dragonborn, Dwarf, Elf, Gnome, Goliath, Halfling, Human, Orc, and Tiefling, plus arbitrary custom races.
- Habitat-aware generation with **Forest Village** as the default and more than twenty presets spanning settlements, forests, plains, jungle, deserts, riverlands, wetlands, lakesides, coasts, ports, islands, mountains, tundra, underground environments, and ruined frontiers. Custom habitats are supported.
- Wealth selection: Poor, Average, Well-Off, or Elite.
- Role-relative Combat readiness selection: Weaponless, Minimal, Standard, Prepared, or Highly Prepared. Readiness never overrides occupational logic.
- Four naming palettes with richer idiomatic guidance and at least twelve distinct examples per palette. The same guidance is used by Help and the AI prompt.
- Individual NPC generation or coherent group generation. Built-in group archetypes include family and noble households, guard/watch groups, militia, mercenaries, orc raiders, bandits, criminal cells, caravans, guild crews, ship crews, hunting parties, expeditions, temple households, village councils, pilgrims, and refugee parties.
- Family generation with shared surnames, household roles, quirks, shared rumours/secrets, relationship lore, family structure, and configurable internal disputes.
- Advanced group controls for cohesion, hierarchy, relationship density, internal conflict, family structure, and a free-form group brief.
- Race composition with a scalable multi-select picker and exact-size allocation: single Race, strong primary-Race majority, primary-Race majority, broadly mixed, or custom weights. A ten-person three-Race strong-majority batch can therefore resolve coherently to approximately 8/1/1.
- Role composition with the same deterministic quota model: single Role, distinct Role variants, group-appropriate jobs, balanced mixed Roles, primary-Role majority, strong primary-Role majority, or custom weights. Role variants include practical merchant specializations, artisan trades, scholar professions, security assignments, and similar occupational subtypes.
- Deterministic local group generation respects habitat, Race composition, group roles, quirks, cohesion, hierarchy, relationship density, and conflict settings.
- Optional Actor review layout opens at most the first ten created Actors, with up to three visible side-by-side and later sheets stacked behind those positions.
- AI-native clipboard workflow:
  - **Copy prompt** creates a strict, detailed portable prompt for a manual AI conversation.
  - AI output is an array by default, including when Count is 1; an explicit toggle permits one object only when Count is 1.
  - Prompted biographies require Appearance, Speech, Motivation, Mannerism, Quirk, Rumours, Secrets, Relationships, and Adventure Hook.
  - Group prompts require coherent responsibilities, relationships, shared history, secrets, rumours, disputes, and cross-NPC references appropriate to the selected group archetype.
  - Naming guidance includes the selected palette's idiomatic description and rich example set.
  - Inventory is role-, wealth-, habitat-, and group-aware. Canonical D&D equipment names are resolved against D&D 5e system compendia where possible; invented roleplay possessions safely fall back to embedded loot Items.
  - **Import NPC** validates the copied JSON and creates Actors in the currently selected destination.
  - Manual paste is available when browser clipboard reading is unavailable.
- Strict AI payload validation and HTML sanitization before any Actor is created.
- Portable world-level dashboard filter profiles: export/import versioned JSON files or copy/import the same profile through the clipboard.
- Modular English and German localization.
- Optional concise debug logging, disabled by default.
- Public API for macros and future integrations.

## Compatibility

- Foundry VTT: Version 13.
- D&D 5e system: 5.0.0 through 5.3.3.

The module intentionally targets the Foundry 13 generation. D&D 5e 6.x requires Foundry 14 and is outside this release's supported runtime.

## Installation

Extract the installable release so the module lives at:

`Data/modules/runyth-npc-button/module.json`

Then enable **Runyth NPC Button** in the world's module settings.

## Usage

1. Open the **Actors** directory as a Game Master.
2. Click **NPC Button**.
3. Choose Count, Group type, Habitat, Role, Tier/CR, Race, Wealth, Combat readiness, Naming style, and Destination.
4. Use **Batch composition** to control Race and Role proportions. For intentional groups, use **Advanced group settings** for family structure, cohesion, hierarchy, relationship density, conflict, and the group brief.
5. Choose **Create locally** for deterministic in-module generation, or **Copy prompt** for the AI workflow.
6. For the AI workflow, paste the prompt into an AI conversation, copy its single fenced `json` code block answer, return to Foundry, and click **Import NPC**.
7. Use the title-bar **Help** button for explanations and naming examples.

### Tier style

Open **Game Settings → Configure Settings → Runyth NPC Button → Tier style**.

- **Named tiers** uses Ordinary, Trained, Veteran, Elite, and Champion.
- **Challenge Rating (CR)** replaces that picker with all supported standard CR values from 0 through 30.

### Batch composition

The normal Race and Role pickers establish primary/default values. Composition then determines how the exact requested Count is allocated before deterministic shuffling. Strong primary-Race majority targets about 80–90% primary Race while preserving minority entries when the batch is large enough; balanced and custom-weight modes use exact integer quotas rather than independent random draws.

**Role variants** keep the same broad Role statistics but spread distinct practical subtypes before repeating. For example, five Merchants can become five different merchant specializations rather than five clones. Mixed-role modes instead distribute several selected base Roles.

Custom Race entries can participate in mixed batches as well.

### Combat readiness

Every NPC remains mechanically combatable, but carried combat gear is role-relative. **Weaponless** always removes weapons and armor. Higher readiness levels progressively add plausible weapons, armor, shields, or backups within strict occupational ceilings. A Jurist remains a lightly equipped professional even at maximum readiness, while Guards, Soldiers, Raiders, and similar roles scale to appropriate professional equipment. Local canonical combat equipment is resolved against D&D 5e item compendia when available.

### Filter profiles

Open **Game Settings → Configure Settings → Runyth NPC Button → Dashboard string filters**. Filter configuration supports allow/deny exact, contains, prefix, suffix, and regular-expression rules. The filter window can export/import a versioned JSON profile as a file, copy it to the clipboard, or import one from the clipboard.

### AI payload shape

The default prompt always requests exactly one fenced `json` Markdown code block containing a JSON array with exactly the selected Count. This includes Count 1. When Count is 1, **Use a single JSON object** changes both the prompt contract and importer to require one object instead.

Every Actor must include at least one inventory entry and a labeled biography containing Appearance, Speech, Motivation, Mannerism, Quirk, Rumours, Secrets, Relationships, and Adventure Hook. Standard item requests can provide an exact English canonical lookup name. The module attempts to resolve those from modern D&D 5e equipment content first, then compatible legacy SRD item packs. If no canonical match exists, the possession remains a safe roleplay loot Item rather than causing the import to fail.

## Public API

After Foundry's `init` hook, the module exposes:

```js
const api = game.modules.get("runyth-npc-button")?.api;
```

Available methods:

- `openNpcDashboard()`
- `openNpcDialog()` (compatibility alias)
- `createNpcActors(options)`
- `generateNpcBlueprint(options, random?)`
- `generateNpcBatch(options)`
- `buildPortraitPromptFromActor(actor)`
- `registerRace(id, config)` / `unregisterRace(id)`
- `registerRole(id, config)` / `unregisterRole(id)`
- `registerNamingStyle(id, config)` / `unregisterNamingStyle(id)`
- `registerHabitat(id, config)` / `unregisterHabitat(id)`
- `registerGroupType(id, config)` / `unregisterGroupType(id)`
- catalog getters: `getRaces()`, `getRoles()`, `getNamingStyles()`, `getHabitats()`, `getGroupTypes()`

Creation hooks:

- `runyth-npc-button.preCreateBatch`
- `runyth-npc-button.created`
- `runyth-npc-button.createdBatch`
- `runyth-npc-button.preImportBatch`
- `runyth-npc-button.imported`
- `runyth-npc-button.importedBatch`

### UI reliability

Dashboard and filter-setting listeners use ApplicationV2/native DOM patterns. Same-name radio groups are resolved as concrete controls rather than treated as one element, and rerender-scoped AbortControllers prevent duplicate listeners. Clipboard writes prefer Foundry's clipboard helper and transparently fall back to the browser clipboard API.

## Development

Requirements: Node.js 20+ for validation/tests. Runtime code itself has no npm dependencies.

```bash
npm run check
```

Build release archives on a Unix-like environment with Git, `zip`, `unzip`, and `sha256sum` available:

```bash
./dev/build-release.sh
```

See `docs/` for architecture, testing, release, and roadmap notes.

## Upstream documentation

- Foundry module development: https://foundryvtt.com/article/module-development/
- Foundry VTT v13 API: https://foundryvtt.com/api/v13/
- Foundry v13 ApplicationV2 API: https://foundryvtt.com/api/v13/classes/foundry.applications.api.ApplicationV2.html
- Foundry v13 ClientSettings API: https://foundryvtt.com/api/v13/classes/foundry.helpers.ClientSettings.html
- D&D 5e project and wiki: https://github.com/foundryvtt/dnd5e
- D&D Beyond Race/Species catalog: https://www.dndbeyond.com/species
- D&D 2024 Basic Rules — Challenge Rating: https://www.dndbeyond.com/sources/dnd/br-2024/how-to-use-a-monster

## License

AGPL-3.0-or-later. See `LICENSE`.
