# Runyth NPC Button

Runyth NPC Button is a focused D&D 5e utility for Foundry VTT that creates NPC Actors from the Actors directory, either with a deterministic local generator or through a portable AI clipboard workflow.

## Features

- GM-only **NPC Button** action in the Actors directory.
- Resizable dashboard with client-side size and placement persistence.
- Ergonomic count control with direct numeric input and 1, 3, 5, and 10 shortcuts.
- World-level **Tier style** setting:
  - named competence tiers; or
  - exact D&D 5e Challenge Rating selection covering 0, 1/8, 1/4, 1/2, and every integer CR from 1 through 30.
- Reusable searchable, scrollable, virtualized hierarchical pickers for Role, Race, Naming style, Tier/CR, and Actor folder selection.
- Race picker supports presets and free-form custom races without a separate Custom mode.
- Actor-folder picker preserves nested folder hierarchy and can also target the Actors root, configured default, or create/reuse a new root folder.
- Wealth selection: Poor, Average, Well-Off, or Elite.
- Help button in the dashboard title bar with field explanations and deliberately distinct naming-style examples.
- Single or batch deterministic local NPC generation with optional reproducible seeds.
- Optional Actor review layout:
  - opens at most the first 10 created Actors;
  - shows up to three Actor sheets side-by-side;
  - later sheets reuse those column positions behind the top three, so closing one reveals the next sheet in that stack.
- AI-native clipboard workflow:
  - **Copy prompt** builds a detailed strict portable prompt for a manual AI conversation.
  - AI output is an array by default, including when Count is 1.
  - An explicit toggle permits a single JSON object only when Count is 1.
  - Prompted biographies include terse Appearance, Speech, Motivation, Mannerism, Rumours, Secrets, Relationships, and Adventure Hook sections.
  - Multi-NPC prompts allow meaningful cross-NPC relationships, rumours, secrets, debts, loyalties, rivalries, and shared incidents.
  - AI inventory is role- and wealth-aware.
  - Canonical D&D equipment names are resolved against D&D 5e system compendia where possible.
  - Invented or unresolved roleplay possessions safely fall back to embedded loot Items.
  - **Import NPC** reads the copied AI JSON and creates the Actors in the currently selected destination.
  - Manual paste is available when browser clipboard reading is unavailable.
- Strict AI payload validation before any Actor is created.
- AI biography and item-description HTML sanitization.
- Sensible D&D 5e ability scores, Armor Class, Hit Points, movement, Challenge Rating, creature type, Race, wealth, and biography fields.
- Modular English and German UI localization.
- Optional concise debug logging, disabled by default.
- Public API for macros and future integrations.
- No external AI API, API key, or network request is required by the module.

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
3. Configure Count, Role, Tier/CR, Race, Wealth, Naming style, and Destination.
4. Choose one workflow:
   - **Create locally** for deterministic in-module generation.
   - **Copy prompt**, paste it into an AI conversation, copy the JSON-only answer, return to Foundry, and click **Import NPC**.
5. Use the title-bar **Help** button for control descriptions and naming examples.

### Tier style

Open **Game Settings → Configure Settings → Runyth NPC Button → Tier style**.

- **Named tiers** keeps the module's Ordinary, Trained, Veteran, Elite, and Champion bands.
- **Challenge Rating (CR)** replaces that picker with all standard D&D 5e CR values from 0 through 30.

### AI payload shape

The default prompt always requests a JSON array with exactly the selected Count. This includes a Count of 1. When Count is 1, the optional **Use a single JSON object** toggle changes both the prompt contract and importer to require one object instead.

The importer accepts a narrow validated Actor core plus a deliberately simple inventory request format. Standard item requests can provide an exact English canonical lookup name; the module attempts to resolve those from the modern D&D 5e equipment compendium first, then compatible legacy SRD item packs. If no canonical match exists, the possession remains a safe roleplay loot Item rather than causing import failure.

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

Creation hooks:

- `runyth-npc-button.preCreateBatch`
- `runyth-npc-button.created`
- `runyth-npc-button.createdBatch`
- `runyth-npc-button.preImportBatch`
- `runyth-npc-button.imported`
- `runyth-npc-button.importedBatch`

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
- D&D 2024 Basic Rules — Challenge Rating: https://www.dndbeyond.com/sources/dnd/br-2024/how-to-use-a-monster

## License

AGPL-3.0-or-later. See `LICENSE`.
