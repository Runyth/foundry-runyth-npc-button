# Runyth NPC Button

Runyth NPC Button is a D&D 5e NPC and NPC-group generator for Foundry VTT. It supports deterministic local generation and an AI-native clipboard workflow without requiring an API key or external service integration.

## Features

- GM-only **NPC Button** action in the Actors directory.
- Resizable dashboard with client-side size and placement persistence.
- Cohesive high-performance field-journal visual system shared across dashboard, Help, filter settings, import preview, directory controls, and portrait-prompt actions, with restrained section accents, stable sticky actions, visible focus states, and responsive narrow-window layouts.
- Help uses responsive reference tables for comparable controls and distribution modes, including concrete Race/Role composition quotas, while keeping narrative/catalog sections concise.
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
- Race composition with a scalable multi-select picker and exact-size allocation: single Race, strong primary-Race majority, primary-Race majority, broadly mixed, custom weights, or exact per-Race integer counts. A ten-person three-Race strong-majority batch can therefore resolve coherently to approximately 8/1/1.
- Role composition with the same deterministic quota model: single Role, distinct Role variants, group-appropriate jobs, balanced mixed Roles, primary-Role majority, strong primary-Role majority, or custom weights. The main Role field is always the primary Role; custom weights are relative ratios where larger numbers mean more NPCs and 0 excludes a Role when another Role has positive weight. A live preview shows the actual integer allocation for the current Count.
- Deterministic local group generation respects habitat, Race composition, group roles, quirks, cohesion, hierarchy, relationship density, and conflict settings.
- Optional Actor review layout opens at most the first ten created Actors, with up to three visible side-by-side and later sheets stacked behind those positions.
- AI-native clipboard workflow:
  - **Copy prompt** creates a strict, detailed portable prompt for a manual AI conversation. Clipboard writing is best-effort: if browser focus or permissions block automatic copying, the prepared prompt remains visible in the dashboard with Select text and Copy again controls.
  - AI output always uses one JSON array, including when Count is 1, keeping prompt and import validation on one invariant contract.
  - Prompted biographies require Appearance, Speech, Motivation, Mannerism, Quirk, Rumours, Secrets, Relationships, and Adventure Hook.
  - Group prompts require coherent responsibilities, relationships, shared history, secrets, rumours, disputes, and cross-NPC references appropriate to the selected group archetype.
  - Naming guidance includes the selected palette's idiomatic description and rich example set.
  - Inventory is role-, wealth-, habitat-, and group-aware. Canonical D&D equipment names are resolved against D&D 5e system compendia where possible; invented roleplay possessions safely fall back to embedded loot Items.
  - **Import NPC** validates the copied JSON and creates Actors in the currently selected destination.
  - Manual paste is available when browser clipboard reading is unavailable.
- Strict AI payload validation and HTML sanitization before any Actor is created.
- Portable world-level dashboard filter profiles: each major picker catalog has a scalable searchable multi-select list with all items included by default; deselect individual entries to exclude them. Advanced string/regex rules remain available, and profiles can be exported/imported as versioned JSON files or through the clipboard.
- Modular English and German localization.
- Optional concise debug logging, disabled by default.
- Public API for macros and future integrations, including catalog registration plus a prompt-pipeline API that can inspect, extend, or replace generated AI prompts.

### Interface and performance

The v0.2 interface follows the same bounded, responsive ApplicationV2 conventions used across the wider module family: content-driven cards, stable sticky action areas, searchable virtualized lists, safe wrapping, explicit focus states, and no dependency on decorative animation. The visual layer intentionally avoids keyframe animation, backdrop blur, animated shadows, `transition: all`, and layout-moving effects. Short state transitions are limited to color/opacity, while `prefers-reduced-motion` disables even those durations.

`npm run check` now includes `npm run audit:ui`, which enforces a stylesheet size budget and confirms that the large picker surfaces retain bounded overscan virtualization, requestAnimationFrame-coalesced updates, passive scroll listeners, and layout/paint containment.

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

Open **Game Settings → Configure Settings → Runyth NPC Button → Dashboard string filters**. Each filter category first presents a searchable, scrollable, virtualized multi-select list. All available entries are selected by default; simply deselect individual Roles, Races, Naming styles, Habitats, Group types, or Actor folders to remove them from the matching dashboard picker. The older allow/deny exact, contains, prefix, suffix, and regular-expression rules remain available under **Advanced string and regex rules**. The filter window can export/import a versioned JSON profile as a file, copy it to the clipboard, or import one from the clipboard.


### Prompt extension API

Complementary modules can integrate through `game.modules.get("runyth-npc-button").api`. The catalog-registration API remains available for Races, Roles, Naming styles, Habitats, and Group types.

This release also adds a prompt-pipeline API aimed at AI workflows:

- `buildAiPrompt(options)` builds the current strict JSON-generation prompt.
- `buildPortraitPromptFromActor(actor)` builds the current portrait/image prompt.
- `registerPromptExtension(id, config)` registers a prompt extension layer.
- `unregisterPromptExtension(id)` removes a registered layer.
- `getPromptExtensions(target?)` lists registered prompt layers.
- `resolvePromptContext(target, context)` resolves context transforms deterministically.
- `resolvePromptComponents(target, defaults, context)` resolves structured prompt components such as portrait style blocks.

Prompt extensions support two complementary integration styles:

1. **Structured component overrides** for the built-in portrait/image prompt, e.g. replacing or appending the default style, background, or negative-prompt fragments.
2. **Full prompt composition or post-processing** for either the `portrait` or `npcJson` target, allowing a complementary module to replace the final prompt entirely or transform the default output.

The built-in portrait prompt now defaults to a grounded semi-realistic adult-anime look inspired by rugged low-fantasy character illustrations: muted earth tones, painterly shading, crisp linework, worn textiles/leather/rope detail, and a clean isolated studio-style background.

### AI payload shape

The prompt always requests exactly one fenced `json` Markdown code block containing a JSON array with exactly the selected Count. This includes Count 1; there is no alternate single-object root contract.

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

### Reusable seeds, weapon variety, and import preview

Local NPC generation always has a concrete reusable seed. When the Seed field is blank, NPC Button creates one automatically, returns it to the dashboard, and stores it on every generated Actor in both private biography and module flags.

Weapon variety is separate from Combat readiness. It can constrain or bias generated combat gear toward melee or ranged weapons while preserving role realism; a noncombatant with no plausible weapon in a hard-only category remains weaponless.

AI import can optionally open a preview editor before Actor creation. Names, biography, Race/subtype, CR, AC, HP, and walking speed can be adjusted quickly, and individual NPCs can be selected or deselected. Count mismatches automatically open preview by default instead of failing early; a GM world setting can allow arbitrary safe array lengths for external/manual JSON. The selected subset is revalidated before import, and maximum batch size is always enforced.
