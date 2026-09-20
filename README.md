# Runyth NPC Button

Runyth NPC Button is a focused D&D 5e utility for Foundry VTT that creates NPC Actors from the Actors directory, either with a deterministic local generator or through a portable AI clipboard workflow.

## Features

- GM-only **NPC Button** action in the Actors directory.
- Resizable dashboard with client-side size and placement persistence.
- Ergonomic count control with direct numeric input and 1, 3, 5, and 10 shortcuts.
- Role, tier, species, naming-style, and destination controls.
- Species combobox: choose a suggested species or type a custom species directly in the same field.
- Destination combobox: choose an existing Actor folder or type a new root-folder name directly.
- Help button in the dashboard title bar with control descriptions, naming-style examples, and AI workflow instructions.
- Single or batch deterministic local NPC generation with optional reproducible seeds.
- AI-native clipboard workflow:
  - **Copy prompt** builds a strict portable prompt for a manual AI conversation.
  - AI output is an array by default, including when Count is 1.
  - An explicit toggle permits a single JSON object only when Count is 1.
  - **Import NPC** reads the copied AI JSON and creates the Actors in the currently selected destination.
  - Manual paste is available when browser clipboard reading is unavailable.
- Strict AI payload validation before any Actor is created.
- AI biography HTML sanitization and normalization of imported Actor sources.
- Sensible D&D 5e ability scores, Armor Class, Hit Points, movement, Challenge Rating, creature type, and biography fields.
- Modular English and German UI localization.
- Optional concise debug logging, disabled by default.
- Public API for macros and future integrations.
- No external AI API, API key, network request, or runtime dependency required by the module.

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
3. Configure Count, Role, Tier, Species, Naming style, and Destination.
4. Choose one workflow:
   - **Create locally** for deterministic in-module generation.
   - **Copy prompt**, paste it into an AI conversation, copy the JSON-only answer, return to Foundry, and click **Import NPC**.
5. Use the title-bar **Help** button for control descriptions and naming examples.

If Destination is left blank, the module uses the world setting **Default NPC folder**. Its initial value is `Runyth NPCs`.

### AI payload shape

The default prompt always requests a JSON array with exactly the selected Count. This includes a Count of 1. When Count is 1, the optional **Use a single JSON object** toggle changes both the prompt contract and importer to require one object instead.

The importer intentionally accepts a narrow, validated Foundry Actor source core. It removes unsupported top-level document fields, applies the destination locally, resets embedded items to an empty array, forces the default Actor image, and sanitizes biography HTML before creation.

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
- Foundry v13 Actor API: https://foundryvtt.com/api/v13/classes/foundry.documents.Actor.html
- D&D 5e project and wiki: https://github.com/foundryvtt/dnd5e

## License

AGPL-3.0-or-later. See `LICENSE`.
