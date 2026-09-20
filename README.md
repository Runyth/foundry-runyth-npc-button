# Runyth NPC Button

Runyth NPC Button is a focused D&D 5e utility for Foundry VTT that creates lightweight NPC Actors directly from the Actors directory.

## MVP features

- GM-only **Runyth NPC** action in the Actors directory.
- Single or batch NPC generation.
- Role, tier, species, naming-style, and folder controls.
- Optional custom name or batch prefix.
- Optional custom species label.
- Reproducible seeded generation.
- Sensible D&D 5e ability scores, Armor Class, Hit Points, movement, Challenge Rating, creature type, and biography fields.
- Automatic default-folder creation with optional existing/new folder targeting.
- Last-used non-sensitive options remembered per client.
- Modular English and German UI localization.
- Optional concise debug logging, disabled by default.
- Small public API for macros and future integrations.
- No external service, API key, network request, or runtime dependency.

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
2. Click **Runyth NPC**.
3. Choose count, role, tier, species, and naming style.
4. Optionally provide a seed for reproducible generation.
5. Choose a destination folder or type a new root folder name.
6. Click **Create**.

If no destination is selected, the module uses the world setting **Default NPC folder**. Its initial value is `Runyth NPCs`.

## Public API

After Foundry's `init` hook, the module exposes:

```js
const api = game.modules.get("runyth-npc-button")?.api;
```

Available methods:

- `openNpcDialog()`
- `createNpcActors(options)`
- `generateNpcBlueprint(options, random?)`
- `generateNpcBatch(options)`

Creation hooks:

- `runyth-npc-button.preCreateBatch`
- `runyth-npc-button.created`
- `runyth-npc-button.createdBatch`

## Development

Requirements: Node.js 20+ for validation/tests. Runtime code itself has no npm dependencies.

```bash
npm run check
```

Build release archives on a Unix-like environment with Git, `zip`, and `sha256sum` available:

```bash
./dev/build-release.sh
```

See `docs/` for architecture, testing, release, and roadmap notes.

## Upstream documentation

- Foundry module development: https://foundryvtt.com/article/module-development/
- Foundry VTT v13 API: https://foundryvtt.com/api/v13/
- Foundry v13 Actor API: https://foundryvtt.com/api/v13/classes/foundry.documents.Actor.html
- Foundry v13 DialogV2 API: https://foundryvtt.com/api/v13/classes/foundry.applications.api.DialogV2.html
- D&D 5e project and wiki: https://github.com/foundryvtt/dnd5e

## License

AGPL-3.0-or-later. See `LICENSE`.
