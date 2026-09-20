# UI Design and Performance Standard

## Goal

Runyth NPC Button v0.2 uses the same general UI principles as the established Foundry module family: polished but bounded surfaces, strong information hierarchy, scalable lists, deterministic window behavior, and decoration that never becomes an interaction dependency.

## Visual language

- Dark field-journal foundation using Foundry theme variables rather than hard-coding a complete theme replacement.
- Muted brass is the primary module accent.
- Generation, composition, group, destination, and AI sections receive restrained secondary accents for rapid visual scanning.
- Cards use intrinsic height and normal document flow; there are no fixed-height content cards that can clip localized text.
- Primary actions are visually obvious but secondary actions remain compact.
- Help and filter settings use the same surface/radius/spacing vocabulary as the main dashboard.
- Import preview uses a bounded master/detail layout with independent scrolling and a stable confirmation area.

## Responsiveness and accessibility

- Grid columns use `minmax(0, 1fr)` and collapse at deliberate narrow-width breakpoints.
- Text containers use safe wrapping/truncation rules where appropriate.
- Scrollable surfaces reserve scrollbar space to avoid layout shifts.
- Keyboard focus is visible on buttons, inputs, textareas, summaries, choice chips, and picker entries.
- Selected state is never conveyed by motion alone.
- `prefers-reduced-motion` removes transition timing while preserving state changes.

## Performance rules

The cosmetic layer is deliberately conservative:

- no CSS keyframe animation;
- no backdrop blur;
- no blur/drop-shadow CSS filters;
- no `transition: all`;
- no permanent `will-change` hints;
- no image assets or canvas effects for decoration;
- no JavaScript added solely for animation;
- no full-window rerender added for cosmetic state.

The existing hierarchical pickers remain fixed-row virtualized with bounded overscan. Search/render updates remain `requestAnimationFrame`-coalesced, scroll listeners are passive, and the viewport is CSS-contained for localized layout/paint work.

## Automated budget

`npm run audit:ui` fails the build when performance invariants regress. It currently enforces:

- stylesheet under 96 KiB;
- no keyframes or CSS `animation` properties;
- no `transition: all`;
- no backdrop/blur/drop-shadow filters;
- reduced-motion handling;
- picker layout/paint/style containment;
- stable scrollbar gutters;
- bounded picker overscan;
- `requestAnimationFrame` coalescing;
- passive picker scrolling;
- atomic replacement of the visible virtualized row window.
