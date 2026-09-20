# Contributing

## Baseline

- Target Foundry VTT 13 and the supported D&D 5e range in `module.json`.
- Prefer public Foundry APIs and ApplicationV2/DialogV2 patterns.
- Keep runtime dependencies at zero unless a dependency provides clear, measured value.
- Keep localization strings out of JavaScript where practical.
- Keep debug logging concise and opt-in.
- Add or update tests for pure generator behavior.
- Run `npm run check` before committing.

## Commit style

Use the project's Conventional-Commits derivative with a capitalized type. Use `Prog` for maintenance work that would otherwise be categorized as chore-like work.

Examples:

- `Feat: Add encounter templates`
- `Fix: Preserve selected actor folder`
- `Prog: Update release validation`
