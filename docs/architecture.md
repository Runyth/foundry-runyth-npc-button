# Architecture

## Design goals

Runyth NPC Button separates deterministic generation, group composition, AI payload handling, Foundry persistence, and UI integration. Pure data logic remains testable without a running Foundry server, while version-sensitive code stays at the Foundry boundary.

## Layers

| Layer | Path | Responsibility |
| --- | --- | --- |
| Entry point | `scripts/main.mjs` | Hooks, settings registration, public API |
| UI | `scripts/ui/` | Actor-directory integration, dashboard, help window, single/multi virtualized hierarchical pickers, Actor review layout |
| AI contract | `scripts/ai/` | Prompt construction, JSON parsing, validation, normalization, HTML sanitization |
| Generator | `scripts/generator/` | Pure deterministic NPC/group blueprints, Race/Role allocation, combat-readiness loadouts, habitat/group lore, exact CR profile mapping, Actor source construction |
| Foundry services | `scripts/services/` | Folder resolution, canonical item resolution, batched Actor creation/import |
| Infrastructure | `scripts/settings.mjs`, `scripts/filters.mjs`, `scripts/logger.mjs` | Configuration, portable filter profiles, persisted dashboard state, diagnostics |

## Tier styles

`Tier style` is a world setting because it changes a shared generation rule rather than a single browser preference.

- `named` uses Ordinary, Trained, Veteran, Elite, and Champion.
- `cr` exposes CR 0, 1/8, 1/4, 1/2, and every integer 1–30.

The local generator preserves the exact requested CR and interpolates coarse supporting stat knobs between practical anchors. The AI prompt receives the exact selected CR.

## Scalable hierarchical pickers

Single-selection catalogs use `scripts/ui/hierarchical-picker.mjs`; mixed-Race selection uses `scripts/ui/hierarchical-multi-picker.mjs`.

Both avoid native/select dropdown animation behavior and use stable inline panels with search, grouped/hierarchical rows, a scroll viewport, and row virtualization. Searchable text is pre-indexed and filter refresh is coalesced to animation frames. Only the visible window plus small overscan is mounted, keeping DOM work bounded as world folder trees or future catalogs reach hundreds or thousands of entries.

Race, Habitat, and Actor-folder workflows support custom entries without a separate Custom mode. The Actor-folder picker preserves real nested folder hierarchy.

## Group model

`data.mjs` owns group archetypes, habitats, family structures, cohesion/hierarchy/conflict models, Race-composition policies, naming palettes, and reusable lore fragments. The dashboard stores user intent as normalized IDs rather than display text.

`generateNpcBatch()` turns that configuration into deterministic group blueprints:

1. determine group archetype and exact Count;
2. allocate Race quotas for the full batch;
3. allocate Role quotas, Role variants, or group-preset jobs;
4. deterministically shuffle proportional allocations when a seed is supplied;
5. apply family surname behavior when applicable;
6. generate per-NPC stats, habitat, quirk, and personal details;
7. add group-wide rumour/secret context;
8. construct relationship text reflecting cohesion, hierarchy, relationship density, and internal conflict.

Balanced, majority, dominant, and weighted Race/Role compositions use integer quotas before shuffling rather than independent random draws. This guarantees the requested exact Count and makes distribution intent meaningful even for small groups.

## Naming data

Each naming style stores generation pools, a prose `aiGuidance` description, and a rich example set. Help and the AI prompt consume the same source data, preventing documentation/prompt drift.

## Actor review stack

When Actor review opening is enabled, at most the first ten created Actors are opened. The module calculates up to three columns based on viewport width. Actors after the first visible row reuse those coordinates. Sheets are rendered from the back of the batch toward the front so Actors 1–3 remain on top and closing one exposes the next Actor assigned to that column.

## AI boundary

The module does not call an AI service. `Copy prompt` produces a portable strict request whose reply must be exactly one fenced `json` Markdown code block containing 2-space-indented JSON; the user manually pastes that prompt into any AI conversation and copies the JSON response back.

The prompt carries the same configuration model as local generation: exact Count, Tier/CR, Role and Role composition, Race composition, wealth, combat readiness, habitat, naming guidance/examples, group archetype, family structure, cohesion, hierarchy, relationship density, internal conflict, and group brief. It additionally requires coherent inventory, quirks, rumours, secrets, relationships, and cross-NPC references for groups.

AI output is treated as untrusted input. The importer:

1. parses clipboard or manual-paste text;
2. enforces the requested root shape and exact Count;
3. validates required D&D 5e Actor fields and numeric bounds;
4. requires all labeled biography sections and at least one inventory entry;
5. constructs a fresh Actor source instead of trusting arbitrary document fields;
6. sanitizes biography and roleplay-item HTML to a tiny attribute-free allowlist;
7. validates a narrow inventory request schema;
8. resolves exact canonical equipment names against modern D&D 5e equipment content, then compatible legacy SRD item packs;
9. keeps unresolved or invented possessions as safe loot Items;
10. applies folder placement locally;
11. creates validated Actors through Foundry's public batch document API.

The default root shape is always an array. A single object is valid only when Count is 1 and the dedicated single-object toggle is enabled.


## UI event reliability

Dashboard event binding never assumes `form.elements[name]` is one HTMLElement. `scripts/ui/form-events.mjs` resolves concrete named controls with DOM queries, supports single controls and same-name groups, and binds listeners using the current render's `AbortSignal`. Each ApplicationV2 rerender aborts the previous controller before attaching new listeners, preventing duplicate callbacks and stale closures.

Dashboard action buttons are bound through `scripts/ui/dashboard-bindings.mjs`, so Create, Copy prompt, and Import actions remain independent of grouped-control shape. Clipboard writes use one Foundry-first/browser-fallback helper in `scripts/utils/clipboard.mjs`.

The filter settings submenu is a namespaced ApplicationV2 with a top-level `form.handler`; it does not use FormApplication, jQuery listener adapters, or FormDataExtended. File/clipboard import actions remain native-DOM listeners scoped to the render AbortController.

## Compatibility strategy

The manifest restricts activation to D&D 5e and records the supported system range. Runtime code uses public Foundry APIs where available, including ApplicationV2 rendering/positioning and `Actor.implementation.createDocuments`.

The Actor-directory integration uses the public render hook and only a small DOM insertion adapter. A future directory-markup change can therefore be isolated from generation, AI validation, picker logic, and persistence.

## Combat readiness

Combat readiness is independent from CR and Role. The generator first applies a strict Role/variant equipment ceiling, then readiness selects how much of that plausible equipment is carried. Weaponless always wins. Local generated equipment uses canonical lookup names and is resolved through the D&D 5e compendium resolver; Actor AC is derived from Dexterity and the actually generated armor/shield loadout.

## Filter profiles

`filters.mjs` stores world-level picker filters and serializes them as a versioned portable profile (`runyth-npc-button-filter-profile`, version 1). Each category stores explicit `excludedIds` rather than a frozen allow-list, so the default state naturally includes every current catalog item and extension-provided entries appear automatically unless explicitly excluded. The filter UI uses the same virtualized hierarchical multi-picker infrastructure as the dashboard. Import validates the format/version before replacing world filter settings. File and clipboard workflows use the same schema.

## v0.1.7 generation metadata and preview

Local generation always resolves a concrete batch seed before the seeded PRNG is created. The seed is copied to every blueprint, private biography, and `flags.runyth-npc-button.generationSeed`, making an automatically generated batch reproducible with the same options.

The Actor portrait control is attached from both `renderActorSheetV2`/`renderApplicationV2` and the legacy `renderActorSheet` fallback. Injection is idempotent, so overlapping Foundry hooks cannot duplicate the control.

AI import preview edits the original validated AI contract rather than already-normalized Foundry Item sources. Only simple whitelisted Actor fields are exposed. The raw payload is validated before preview, on preview confirmation, and once again in the dashboard immediately before Actor creation.
