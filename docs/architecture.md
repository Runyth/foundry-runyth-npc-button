# Architecture

## Design goals

Runyth NPC Button keeps deterministic generation, AI payload handling, Foundry persistence, and UI integration separated. Pure data logic remains testable without a running Foundry server, while version-sensitive code stays at the Foundry boundary.

## Layers

| Layer | Path | Responsibility |
| --- | --- | --- |
| Entry point | `scripts/main.mjs` | Hooks, settings registration, public API |
| UI | `scripts/ui/` | Actor-directory integration, dashboard, help window, virtualized hierarchical picker, Actor review layout |
| AI contract | `scripts/ai/` | Prompt construction, JSON parsing, validation, normalization, HTML sanitization |
| Generator | `scripts/generator/` | Pure deterministic NPC blueprints, exact CR profile mapping, Actor source construction |
| Foundry services | `scripts/services/` | Folder resolution, canonical item resolution, batched Actor creation/import |
| Infrastructure | `scripts/settings.mjs`, `scripts/logger.mjs` | Configuration, window state, diagnostics |

## Tier styles

`Tier style` is a world setting because it changes a shared generation rule rather than a single browser preference.

- `named` uses the module's Ordinary, Trained, Veteran, Elite, and Champion bands.
- `cr` exposes all standard D&D 5e CRs: 0, 1/8, 1/4, 1/2, and every integer from 1 through 30.

The local generator preserves the exact requested CR and interpolates its coarse supporting stat knobs between practical anchors. The AI prompt receives the exact selected CR.

## Scalable hierarchical picker

Role, Race, Naming style, Tier/CR, and Actor folder all use `scripts/ui/hierarchical-picker.mjs`.

The picker intentionally avoids native/select dropdown animation behavior. It expands a stable inline panel containing:

- search;
- hierarchy/group rows;
- a scroll viewport;
- row virtualization.

Only the visible row window plus a small overscan buffer is mounted in the DOM. This keeps rendering work bounded even if future catalogs or world folder trees grow to hundreds or thousands of entries.

Race and Actor folder pickers additionally support custom values directly from the search field. This keeps custom Race and new-root-folder workflows inside the same control rather than requiring a separate Custom mode.

## Actor review stack

When Actor review opening is enabled, at most the first ten created Actors are opened. The module calculates up to three columns based on viewport width. Actors after the first visible row reuse those same column coordinates. Sheets are rendered from the back of the batch toward the front so Actors 1–3 remain on top and closing one exposes the next Actor assigned to that column.

## AI boundary

The module does not call an AI service. `Copy prompt` produces a portable strict JSON-only request. The user manually pastes that prompt into any AI conversation and copies the resulting JSON back.

AI output is treated as untrusted input. The importer:

1. parses clipboard or manual-paste text;
2. enforces the requested root shape and exact count;
3. validates required D&D 5e Actor fields and numeric bounds;
4. constructs a fresh Actor source instead of trusting arbitrary document fields;
5. sanitizes biography and roleplay-item HTML to a tiny attribute-free allowlist;
6. validates a narrow inventory request schema;
7. resolves exact canonical equipment names against `dnd5e.equipment24`, then compatible legacy SRD item packs;
8. keeps unresolved or invented possessions as safe loot Items;
9. applies folder placement locally;
10. creates the validated Actors through Foundry's public batch document API.

The default root shape is always an array. A single object is valid only when Count is 1 and the dedicated single-object toggle is enabled.

## Compatibility strategy

The manifest restricts activation to D&D 5e and records the supported D&D 5e range. Runtime code uses public Foundry APIs where available, including ApplicationV2 rendering/positioning and `Actor.implementation.createDocuments`.

The Actor-directory integration uses the public render hook and only a small DOM insertion adapter. If a future Foundry release changes directory markup, that adapter can be replaced without touching generation, AI validation, picker logic, or persistence.
