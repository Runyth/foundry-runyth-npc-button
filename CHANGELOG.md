# Changelog

## 0.4.8 — 2026-11-04

- The installable archive now ships every relative import the manifest entry needs, so the module's buttons and settings register on world load instead of silently failing.

## 0.4.7 — 2026-11-03

- AGENTS.md conformance release: the manifest author carries the standard organisational URL, and the README states the CC BY-SA 4.0 content licence for generated and bundled example content. No runtime behaviour relationship or dependency change.

## 0.4.6 — 2026-11-02

- The README licence chapter is the single `## Licence` block with the standard holder line; the obsolete per-release short `## License` stub was removed. Documentation-surface alignment only; no runtime behaviour, relationship, or dependency change.

## 0.4.5 — 2026-10-17

- First publication as a Runyth module: `runyth-npc-button` / **Runyth NPC Button** with the publication standard in place — deterministic `-mod`, `-src`, and `-doc` archives with per-version checksums, byte-identical rebuild verification, standard quality and release pipelines, the full GNU AGPL-3.0-or-later licence with the standard source notice, the standard README licence chapter, and the manifest URL surfaces.

- Optional, allowlisted `combat.actions[].midi` effect definitions for native dnd5e activity effects, including automation-mode attack Advantage and target-granted Advantage, 2024 D&D5e AC/speed/damage modifiers, DAE `1Attack`/`1Hit` effect expiry, and native status conditions. Effects attach to the exact activity and survive AI JSON normalization.
- Explicit `combat.relentlessOnce` passive flag for homebrew boars. In the existing NPC Button module, an isolated native dnd5e 5.3 `preApplyDamage` hook preserves 1 HP once after non-massive lethal damage, synchronizes the passive feature charge, and resets it when a new combat starts. It does not require a separate Bree automation module.
- Updated twelve-NPC Bree Bunch example with configured automation effects. Regression checks cover full roster, passive traits, attacks, and security allowlists.

- Unknown automation flags, arbitrary effect keys, script fragments and unknown durations are rejected rather than passed through to Foundry. Macro code is **not imported or executed**.
- Original v0.4.4 JSON imports are backward-compatible. Automation remains optional; unsupported conditions and passive narrative abilities are never falsely marked fully automated.
- Partial automation limitations remain for target-specific advantage, conditionally triggered reactions, multiattack sequencing, terrain/region placement, and items depending on exact movement/positioning: see import guide.

## 0.4.4 — 2026-10-15

- Backward-compatible, allowlisted `combat` import schema for native dnd5e 5.3 Attack, Save, Heal and Utility activities, including typed damage, fixed hit bonuses, native area templates, activity uses, and rechargeable actions.
- Import of saving-throw and skill proficiencies, damage resistances and vulnerabilities.
- Grouped weapon activities (e.g. melee/thrown dagger, boar tusks/charge) under one equipped native weapon instead of nonfunctional loot entries.
- Twelve-NPC Bree Bunch example with four homebrew boars; encounter regression tests verify attacks, typed formulas, action variety, equipment, resistance and vulnerability.
- Import guide describing remaining GM-directed conditional effects and tactics.

- Canonical compendium weapons and equipment imported as unequipped on some actors are now explicitly equipped.
- Natural weapon attacks are instantiated as native dnd5e weapon activities rather than loot-only descriptions.

## 0.4.3 — 2026-10-03

- Dashboard Token disposition control for every native Foundry disposition: Friendly, Neutral, Hostile (Enemy), and Secret.
- A Foundry default option that intentionally leaves prototype-token disposition untouched, preserving world/system/module defaults and maintaining backwards-compatible behavior unless the GM explicitly selects a disposition.
- Prototype-token disposition application for both locally generated NPCs and AI-imported NPCs created through the dashboard.
- Help reference table explaining disposition behavior and practical examples.
- Regression coverage for native disposition constants, no-override behavior, prototype-token merging, and locally generated Actor sources.

- Generated Actor metadata records the selected disposition mode while using Foundry's native `prototypeToken.disposition` field for the actual Token behavior.

## 0.4.2 — 2026-10-01

- First-class Age controls in Batch composition with Contextual, Young adults, Adults, Mature adults, Older adults, Mixed generations, and Exact year range modes.
- Group age-spread controls: Natural/random, Evenly spread, Similar ages, Younger-leaning, and Older-leaning.
- Literal minimum/maximum year inputs for Exact year range with safe normalization when the values are entered in reverse order.
- Race-relative named age ranges so long-lived and short-lived Races are generated at equivalent life stages instead of receiving identical human-year assumptions.
- Context-aware defaults: families naturally permit a broader generational span, while professional peer groups stay more concentrated in plausible adult ranges.
- Generated age metadata in the NPC biography and module flags; the dnd5e NPC data model has no native age field, so the module does not write unsupported Actor-system data.
- AI prompt instructions for age range and batch spread, including literal-year handling for exact ranges and Race-relative handling for named ranges.
- Portrait prompts now include the generated NPC age when available.
- Help reference tables explaining every age-range and group-spread mode with practical examples.
- Regression coverage for exact ranges, Race-relative ages, family ranges, spread modes, Actor metadata, and AI prompt propagation.

- Complementary Race registrations may optionally provide `ageProfile: { adulthood, lifespan }` to make named age ranges Race-idiomatic; unknown/custom Races safely fall back to the core human-like profile.

## 0.4.1 — 2026-09-30

- Complementary-module color settings no longer misleadingly report that no catalog entries are registered when extension entries exist but were registered without source-module metadata.
- The integration-status panel now distinguishes attributed contributions, unattributed extension entries, and installed modules that declare Runyth NPC Button as a dependency/recommendation.

- Diagnostic counts for unattributed Races, Roles, Naming styles, Habitats, and Group types, with an explicit explanation that these entries remain usable but cannot be color-grouped until their source module identifies itself.
- Public `getUnattributedCatalogEntries()` and `getComplementaryCatalogModules()` diagnostics.
- Public `attributeCatalogEntries(sourceModuleId, contributions, options)` helper so an existing complementary module can register its catalogs normally and then backfill source ownership in one call.

- Merely installing or enabling a complementary module does not make it color-addressable. The module must register catalog contributions through the extension API and associate those contributions with a source module.

## 0.4.0 — 2026-09-30

- Complementary-module catalog entries can now be visually highlighted in dashboard pickers and filter-setting catalogs.
- New global settings menu for configuring one highlight color per complementary module.
- Source-module badges on contributed catalog entries to make it obvious which complementary module provided a given Race, Role, Naming style, Habitat, or Group type.
- Registry metadata aggregation so complementary-module contribution counts are available for the new color-configuration UI.
- Race-specific portrait guidance support on Race registrations via optional `portraitGuidance` metadata.
- Regression coverage for complementary-module ownership metadata, color resolution, colored filter rows, and non-human race portrait guidance.

- The built-in portrait prompt now pushes all non-human races toward race-idiomatic anatomy and silhouette instead of allowing generic near-human output.
- Core Race data now includes stronger portrait guidance for PHB-style non-human ancestries.
- Help and extension API documentation now cover complementary-module highlight colors and Race portrait-guidance metadata.

## 0.3.2 — 2026-09-26

- Advanced generated-name formatting with Standard, Nickname, Formal, Location, Full, and Custom-template presets.
- Fixed prefix, infix, suffix, and location components for generated names.
- Optional generated nicknames and role-appropriate titles with Never, Sometimes, and Always controls.
- Exact custom name-template formatting with tokens for prefix, title, first name, nickname, infix, last name, location, suffix, batch index, Role, and Race.
- Optional template blocks using `[ ... ]`, which disappear cleanly when a referenced optional component is empty.
- Help reference table explaining Name or batch prefix, naming presets, affixes, nickname/title behavior, locations, template syntax, and examples.
- Regression coverage for default compatibility, affixes, optional punctuation, role titles, batch indices, template validation, AI prompt propagation, and Name-or-batch-prefix override behavior.

- Name or batch prefix now has an inline explanation in the generator and a detailed Help entry. With Count 1 it overrides the generated Actor name; with larger batches it remains the existing numbered batch-prefix workflow.
- AI generation prompts now carry the configured naming template and naming components so AI-generated Actor names follow the same formatting intent as local generation.

## 0.3.1 — 2026-09-26

- Locally generated NPCs now populate the native D&D 5e `system.currency` fields instead of carrying zero sheet currency.
- AI-import normalization now preserves real currency data and supplies a minimal nonzero legacy fallback when an older payload omits currency entirely.
- AI prompts now explicitly require real Actor currency rather than representing all carried money only as prose or a generic purse item.

- Wealth distribution control: Item-heavy, Mixed, Coin-heavy, Few high-value items, and Many small-value items.
- Fixed portable-wealth budgets per Wealth tier, split deterministically between coins and portable valuables without changing the total value.
- Portable valuables carry exact copper-equivalent value metadata, while role/combat gear remains outside the distribution budget and is unaffected by the split.
- Help-table coverage explaining each wealth-distribution mode and concrete Average-wealth examples.
- Regression coverage proving every distribution carries nonzero coin and preserves the same total wealth budget.

## 0.3.0 — 2026-09-26

- New prompt-pipeline extension API for complementary modules through `game.modules.get("runyth-npc-button").api`.
- Prompt targets for `portrait` and `npcJson`, with deterministic priority ordering and registration metadata.
- Structured portrait-prompt component resolution so complementary modules can replace, prepend, or append output/style/background/negative fragments instead of doing fragile string surgery.
- Full prompt composition and post-processing hooks so a complementary module can replace or transform generated AI prompts completely when needed.
- Regression coverage for prompt-extension registration, context transforms, component merging, full composer overrides, and text post-processing.
- New extension API documentation in `docs/extension-api.md`.

- Re-evaluated and expanded the public API to keep complementary-module integrations reliable and current.
- `module.api` now also exposes `buildAiPrompt`, `registerPromptExtension`, `unregisterPromptExtension`, `getPromptExtensions`, `resolvePromptContext`, `resolvePromptComponents`, and `clearPromptExtensionRegistry`.
- Default portrait/image prompts now use a grounded semi-realistic adult-anime style inspired by rugged low-fantasy full-body character illustrations: muted earth tones, painterly shading, crisp linework, worn textile/leather/rope detail, and clean isolated presentation.

## 0.2.5 — 2026-09-25

- Added Exact numbers Race composition with the existing scalable Race multi-picker plus a virtualized searchable quota editor, live total validation, and one-click even distribution.
- Simplified AI/import payloads to one invariant root contract: JSON is always an array, including Count 1.
- Added regression coverage for exact Race quotas, invalid totals, array-only Count-1 prompts/imports, and quota-editor virtualization/performance.

## 0.2.4 — 2026-09-25

- Help now presents Race composition with the same detailed mode/rule/Count-10 reference-table treatment as Role composition, including exact quota examples and relative-weight semantics.
- Comparable Help sections now use consistent responsive reference tables for generation controls, combat readiness, weapon variety, filter controls, import-preview behavior, and the AI workflow, while explanatory/catalog sections remain concise prose.
- Help tables now use a shared scroll-safe presentation with clearer row headers, sticky column headers, narrow-window overflow handling, and no animation or expensive visual effects.

- Regression coverage for Race-composition Help examples and the expanded structured Help-table surfaces.

## 0.2.3 — 2026-09-25

- NPC import counting now uses one centralized top-level Actor count throughout preflight, mismatch handling, preview, final validation, and Actor creation, eliminating inconsistent count decisions between stages.
- Count mismatches no longer fail before they can be inspected. A mismatched but structurally valid payload automatically opens import preview by default.
- Import preview now supports selecting/deselecting individual NPCs, Select all/Clear all, and a live selected-count summary; only the selected subset is imported.

- Global GM setting to allow arbitrary safe NPC array lengths without forcing count-mismatch review, while still enforcing maximum batch size and all Actor validation.
- Automatic preview warning banners that show requested versus parsed top-level NPC counts and configured batch-limit overflows.
- Regression coverage for exact top-level counting, 20-versus-21 mismatch handling, count-agnostic imports, maximum-batch review, and 21-to-20 preview selection.

## 0.2.2 — 2026-09-22

- Clipboard focus/permission failures no longer abort or masquerade as NPC generation failures. Prepared AI prompts remain available in the dashboard for selection and explicit retry when automatic copying is blocked.
- Portrait-prompt and filter-profile copy actions now use the same best-effort clipboard isolation and manual-copy fallback instead of treating clipboard access as a content-generation failure.
- Role-weight inputs isolate numeric keystrokes from Foundry hotkeys so values containing zero, including 10, 20, 30, and 0 itself, can be entered reliably.

- The main Role field is now the explicit invariant primary Role for all Role-composition modes; stale saved primary-role metadata cannot silently override it.
- Primary-role majority targets 70%, while Strong primary-role majority targets 85%; remaining quota is shared across the other allowed Roles and rounded to preserve the exact batch Count.
- Custom Role weights are documented and previewed as relative non-negative ratios: larger values receive more NPCs, 0 excludes a Role when another weight is positive, and equivalent ratios such as 1/2/3 and 10/20/30 produce the same distribution.
- The dashboard now shows the primary Role and a live exact integer Role allocation preview for the current Count and composition settings.
- Help now includes a detailed Role-composition table with concrete Count-10 examples, weighting semantics, and quota-rounding behavior.

- Regression coverage for unfocused/denied/unavailable clipboard writes, prompt preservation, manual-copy fallbacks, primary-role invariance, zero-weight exclusion, and exact mixed-Role quota examples.

## 0.2.1 — 2026-09-22

- Scalable multi-select pickers now update visible selection state in place without jumping back to the top of the list.
- Added regression coverage for virtualized picker viewport preservation during repeated selection changes.

## 0.2.0 — 2026-09-21

- Cohesive high-performance visual system across the NPC dashboard, Help, filter settings, import preview, Actors-directory action, and per-Actor portrait-prompt control.
- Distinct but restrained visual identities for Generation, Batch composition, Group composition, Destination, and AI workflow sections to improve scanning without adding new interaction cost.
- Dedicated UI performance audit (`npm run audit:ui`) with a stylesheet-size budget and regression checks for virtualization, passive scrolling, frame-coalesced picker work, reduced-motion support, and prohibited expensive animation/effect patterns.
- Repeatable static UI visual harness under `dev/` for cosmetic review without coupling runtime code to test/demo markup.
- Automated visual-system regression tests covering theme tokens, responsive/focus states, sticky actions, containment, and animation-performance invariants.

- Redesigned choice chips, toggles, pickers, advanced sections, weight controls, buttons, status surfaces, sticky action bars, Help cards/tables, filter-profile controls, and import-preview master/detail layout.
- Improved narrow-window behavior, safe wrapping, visible focus, scrollbar stability, and high-density readability while retaining the existing ApplicationV2 lifecycle and event-binding model.
- Picker viewports now explicitly isolate layout/paint/style work while retaining the existing bounded virtualization and passive scroll handling.
- Cosmetic transitions are restricted to short paint-only state changes; keyframe animations, backdrop filters, blur/drop-shadow filters, and `transition: all` are intentionally prohibited.

- All NPC generation, AI prompt/import, preview validation, portrait prompting, filter profile, extension API, composition, combat-readiness, weapon-variety, folder targeting, localization, and persistence contracts remain unchanged.

## 0.1.8 — 2026-09-20

- Scalable searchable multi-select item filtering for every filter-settings category: Roles, Races, Naming styles, Habitats, Group types, and Actor folders.
- All current catalog items are selected by default; deselecting an item excludes it from the matching dashboard picker.
- Select-all and clear-all controls inside scalable multi-select filter pickers.
- Regression coverage for default inclusion, individual exclusions, extension-provided catalog entries, form persistence, and portable filter-profile round trips.

- Item exclusions are stored as stable catalog IDs so newly installed extension entries remain included by default unless their IDs were explicitly excluded.
- Existing exact/contains/prefix/suffix/regex filters remain available under a collapsed advanced-rules section instead of being the primary filtering UX.
- Remembered dashboard selections that are no longer visible under the configured filters now fall back to a visible valid option where possible.
- Filter import/export continues to use the existing versioned profile format and now preserves item-level exclusions.

## 0.1.7 — 2026-09-20

- Reusable generation-seed metadata on every locally generated NPC. Blank seeds are generated automatically, written back into the dashboard for immediate reuse, stored in Actor flags, and shown in the private biography.
- Weapon-variety control independent of Combat readiness: Melee only, Melee preference, Mixed, Ranged preference, and Ranged only.
- Optional AI import preview with a compact multi-NPC editor for name, Race/subtype, CR, AC, HP, walking speed, and biography before Actor creation.
- Import-preview regression tests that verify whitelisted edits, non-mutating edit helpers, and final contract rejection of invalid post-edit values.

- Portrait-prompt sheet action now integrates with dnd5e 5.3.x ApplicationV2 Actor sheets through Foundry v13 V2 render hooks, while retaining a legacy Actor-sheet fallback.
- Portrait action injection is idempotent across overlapping render hooks and has resilient header/close-button discovery.
- AI preview payloads are validated once before editing, again when the user confirms preview, and once more immediately before Actor creation.

- Local combat loadouts now honor Weapon variety without overriding occupational realism. Hard ranged-only mode leaves roles without a plausible ranged option weaponless rather than inventing inappropriate gear.
- The copied AI prompt includes the selected Weapon variety and explicitly states that it cannot override role realism.
- Help and localization now document reusable seeds, Weapon variety, portrait controls, and preview import.

## 0.1.6 — 2026-09-20

- Fixed dashboard initialization crashes when same-name controls such as Race composition and Role composition are exposed as RadioNodeList-style grouped form controls instead of a single HTMLElement.
- Restored reliable binding for Create locally, Copy prompt, and Import NPC actions by preventing earlier grouped-control initialization failures from aborting `_onRender`.
- Hardened all dashboard form reads/bindings against missing, conditional, single, and multi-control fields.
- Reworked Dashboard string filters onto ApplicationV2's native top-level form handler and native DOM events, removing the remaining ApplicationV1/jQuery-era form assumptions.
- Unified clipboard writes behind a tested Foundry-first/browser-fallback helper for AI prompts, portrait prompts, and filter profile JSON.

- Regression coverage for grouped Race/Role composition controls, repeated rerenders, listener cleanup, action-button delivery, keyboard-style change events, missing controls, clipboard fallback, ApplicationV2 filter persistence, and filter profile validation.
- Static repository validation that rejects FormApplication/V1 listener patterns, jQuery-only `html.on`/`html.find`, and direct `form.elements.<name>.addEventListener(...)` usage in runtime JavaScript.

## 0.1.5 — 2026-09-20

- Portable filter profiles with versioned JSON export/import by file, plus clipboard copy/import from the global filter settings window.
- Explicit Race-composition modes for single Race, strong primary-Race majority, primary-Race majority, broadly mixed, and custom weights. Strong-majority ten-person three-Race batches naturally resolve to distributions such as 8/1/1 when appropriate.
- Role composition for single Role, distinct Role variants, group-appropriate jobs, balanced mixed Roles, primary-Role majority, strong primary-Role majority, and custom Role weights.
- Built-in practical Role variants, including merchant specializations, artisan trades, scholar professions, guard assignments, and other occupational subtypes.
- Combat readiness row with Weaponless, Minimal, Standard, Prepared, and Highly Prepared levels.
- Role-relative combat profiles and local canonical weapon/armor resolution so generated NPC equipment remains coherent with occupation, group context, CR, and readiness.

- Race and Role composition now work for any multi-NPC batch rather than only intentional groups.
- The AI prompt now requires explainable role-relative weapon/armor logic and exact integer approximation of requested Race/Role proportions.
- Local AC now reflects generated armor/shield loadout and Dexterity instead of implying armor that is not actually carried.
- Local generation now resolves generated canonical combat equipment through the same D&D 5e item resolver used by AI imports.
- Documentation and Help now explain composition, combat readiness, and portable filter profiles.

## 0.1.4 — 2026-09-20

- Actor-sheet header action for generated and AI-imported NPCs that copies a concise single-NPC portrait prompt for one full-body adult-anime image.
- Advanced world-level string-filter settings menu with allow/deny exact, contains, prefix, suffix, and regex rules for major picker-based dashboard catalogs.
- Initial extension API so complementary Foundry modules can register additional Races, Roles, Naming styles, Habitats, and Group types through `game.modules.get("runyth-npc-button").api`.

- Updated the copied AI prompt contract so AI replies must be delivered as exactly one `json` fenced Markdown code block with 2-space indentation and no surrounding commentary.
- Picker-based dashboard catalogs now honor the configured string filters, including Actor-folder destinations.
- Help documentation now covers portrait-prompt copying and the new filter settings.

## 0.1.3 — 2026-09-20

- Full Player's Handbook 2024 built-in Race catalog: Aasimar, Dragonborn, Dwarf, Elf, Gnome, Goliath, Halfling, Human, Orc, and Tiefling, while retaining custom Race support.
- Habitat selection with Forest Village as the default and a broad preset catalog for settlements, wilderness, arid, aquatic/coastal, rugged, cold, underground, and ruined environments.
- Advanced group generation with families, noble households, guard/watch groups, militia, mercenaries, orc raiders, bandits, criminal cells, caravans, guild crews, ship crews, hunting parties, expeditions, temple households, councils, pilgrims, and refugee parties.
- Family structure, group cohesion, hierarchy, relationship-density, internal-conflict, and free-form group-brief controls.
- Searchable virtualized multi-select Race picker for mixed groups.
- Mixed-Race distributions for roughly equal representation, a primary Race, a strong primary-Race majority, or custom relative weights.
- Exact-size Race quota allocation before deterministic shuffling so small mixed groups do not collapse accidentally to one Race.
- Per-NPC quirks and richer local relationship/group metadata.

- Expanded every naming style to at least twelve creative idiomatic examples plus stronger style guidance. The Help window and copied AI prompt share the same naming source data.
- Expanded the AI prompt with habitat, group archetype, family structure, responsibilities, cohesion, hierarchy, conflict, mixed-Race composition, shared history, cross-NPC lore, quirks, secrets, rumours, relationships, and role/wealth/habitat-aware possessions.
- Strengthened AI import validation so biography text must contain all required labeled sections, including Quirk, and every Actor must contain at least one inventory entry.
- Local group generation now records and reflects advanced cohesion, hierarchy, relationship-density, family-structure, and conflict choices rather than treating them as AI-only hints.
- Documentation ZIP continues to exclude `module.json` by enforced build invariant.

## 0.1.2 — 2026-09-20

- World-level **Tier style** setting with named tiers or exact Challenge Rating mode.
- Complete CR picker covering 0, 1/8, 1/4, 1/2, and CR 1 through 30.
- Reusable searchable, scrollable, virtualized hierarchical picker component.
- Hierarchical scalable pickers for Role, Race, Naming style, Tier/CR, and Actor folder selection.
- Wealth selection: Poor, Average, Well-Off, and Elite.
- Additional practical NPC roles including Artisan, Merchant, Acolyte, Scholar, Soldier, and Noble.
- Multi-window Actor review layout opening up to ten created Actors in stacked side-by-side columns.
- AI inventory contract with canonical D&D equipment lookup and safe roleplay-item fallback.
- Canonical item resolution against modern D&D 5e equipment content with legacy SRD fallbacks.
- AI biography requirements for Rumours, Secrets, Relationships, and cross-NPC connections when appropriate.

- Changed the default user-facing term **Species** to **Race**.
- Expanded the AI prompt substantially with role-specific equipment guidance, wealth-aware possessions and money, richer table-use biography requirements, and batch relationship guidance.
- Actor review now opens up to ten created Actors instead of only the last Actor.
- Help naming examples now show four clearly distinct examples plus a short description of each naming palette.
- Actor folder selection now preserves nested folder hierarchy instead of flattening paths into a text suggestion list.
- Documentation release ZIP continues to exclude `module.json` by enforced build invariant.

## 0.1.1 — 2026-09-20

- AI-native **Copy prompt** and **Import NPC** clipboard workflow.
- Strict array-by-default AI payload contract, with optional single-object mode only when Count is 1.
- AI payload count/shape validation and safe Actor-source normalization.
- Biography HTML sanitization for AI-imported NPCs.
- Manual JSON paste fallback for clients that block clipboard reads.
- Resizable dashboard with remembered client-side window size and placement.
- Title-bar Help button with field explanations, naming-style examples, and AI workflow guidance.
- Count shortcuts for 1, 3, 5, and 10 while retaining arbitrary numeric input.

- Renamed the Actors-directory button to **NPC Button**.
- Reworked the dashboard into clearer grouped sections and more ergonomic segmented controls.
- Replaced separate preset/custom species controls with a single suggestion-enabled species field.
- Replaced existing/new-folder selection with a single suggestion-enabled destination field.
- Removed select-based dashboard interactions that could exhibit close-animation flicker.
- Switched Actor batch creation to Foundry's public `Actor.implementation.createDocuments` API.
- Documentation release ZIPs no longer include `module.json`.

## 0.1.0 — 2026-09-20

- Initial MVP release.
- Actors-directory NPC creation button.
- Deterministic seeded generator with batch creation.
- Six roles, five tiers, common humanoid species presets, four naming styles, and custom species support.
- D&D 5e NPC Actor data generation for abilities, AC, HP, movement, CR, size, type, and biography.
- Existing-folder targeting and automatic default/new root-folder creation.
- English and German localization.
- Client-side option persistence and optional debug logging.
- Public module API and lifecycle hooks.
- Unit tests, repository validation, Forgejo CI, and release build tooling.
