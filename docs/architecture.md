# Architecture

## Design goals

The MVP is intentionally small: a UI adapter, a deterministic pure generator, and a Foundry document service. The separation keeps generation testable without a running Foundry server and limits version-sensitive code to a small boundary.

## Layers

| Layer | Path | Responsibility |
| --- | --- | --- |
| Entry point | `scripts/main.mjs` | Hooks, settings registration, public API |
| UI | `scripts/ui/` | Actor-directory integration and DialogV2 form |
| Generator | `scripts/generator/` | Pure deterministic NPC blueprints and Actor source construction |
| Foundry service | `scripts/services/` | Folder resolution and Actor creation |
| Infrastructure | `scripts/settings.mjs`, `scripts/logger.mjs` | Configuration and diagnostics |

## Compatibility strategy

The manifest restricts activation to D&D 5e and records the supported D&D 5e range. Runtime code uses public Foundry APIs where available, including `Actor.implementation.create` and `foundry.applications.api.DialogV2`.

The Actor-directory integration uses the public render hook and only a small DOM insertion adapter. If a future Foundry release changes directory markup, that adapter can be replaced without touching generation or persistence logic.
