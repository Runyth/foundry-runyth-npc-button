# Testing

Run:

```bash
npm run check
```

This executes repository validation and Node's built-in unit tests.

## Automated coverage

Tests cover dashboard render/binding regressions (single controls, RadioNodeList-style grouped controls, missing conditional fields, rerender listener cleanup, action-button delivery, and keyboard-style change events); clipboard Foundry/browser fallback; ApplicationV2 filter form persistence; malformed/portable filter profiles; seeded reproducibility; ability/AC/HP bounds; role-relative combat loadouts and armor-derived AC; exact CR support; Actor-source structure; HTML escaping; the complete built-in 2024 Race catalog; the Forest Village default and broad habitat catalog; rich naming example sets; balanced, primary, and strong-majority mixed-Race quota allocation; balanced mixed-Role quotas; Role-variant distribution; family surname/quirk/relationship/secret behavior; advanced local cohesion/hierarchy/relationship/conflict effects and flags; AI root-shape/count enforcement; required biography sections including Quirk; mandatory non-empty inventory; sanitization; portable filter-profile round trips; canonical item resolution and local-generation flag preservation; invented-item fallback; and fenced-JSON tolerance.

Repository validation checks the manifest, referenced runtime files, version consistency, and selected deprecated/removed API patterns.

## Foundry smoke-test checklist

1. Enable the module in a Foundry VTT 13 world using a supported D&D 5e system version; confirm **NPC Button** is GM-only.
2. Move/resize the dashboard, reopen it, and confirm its saved geometry is restored safely on-screen.
3. Switch Configure Settings → **Tier style** between Named tiers and CR; verify all CR values 0, 1/8, 1/4, 1/2, and 1–30.
4. Repeatedly open/search/scroll Role, Race, Naming style, Habitat, Group type, Tier/CR, Actor folder, and mixed-Race pickers. Confirm no close flicker or visible stalls.
5. Test the folder picker against a deep/large Actor-folder tree and confirm hierarchy and virtualization remain responsive.
6. Verify the Race picker contains Aasimar, Dragonborn, Dwarf, Elf, Gnome, Goliath, Halfling, Human, Orc, and Tiefling plus custom Race input.
7. Verify **Forest Village** is the Habitat default; test representative desert, watery, coastal, island, mountain, underground, and custom habitats.
8. Open Help and verify every naming style shows the expanded idiomatic example set and description.
9. Copy AI prompts for each naming style and confirm the same style guidance/examples appear there.
10. Generate independent NPCs locally with arbitrary Count and with the 1/3/5/10 shortcuts.
11. Generate several Family Household sizes. Confirm shared surname behavior, differing household/member roles, quirks, relationships, shared rumours/secrets, and advanced family/group metadata.
12. Generate representative Guard Patrol, Orc Raider Band, Caravan, Guild Work Crew, and another group archetype; verify member roles vary sensibly.
13. For mixed groups, choose multiple Races and test Roughly equal, Primary race, Strong majority, and Custom weights. Confirm exact Count is preserved and the requested distribution is visibly respected.
14. Exercise cohesion, hierarchy, relationship density, and internal conflict extremes and verify local biographies/flags change accordingly.
15. Generate with a seed, delete the group, repeat it, and confirm deterministic output.
16. With Actor review enabled, generate 1–3 Actors and confirm side-by-side placement; generate 4–10 and confirm stacked reuse; generate 11+ and verify only the first ten open.
17. Copy a multi-NPC AI prompt and verify it includes habitat, group archetype, family/group controls, Race composition, naming examples, quirks, relationships, rumours, secrets, and inventory requirements.
18. For Count 1, verify array-by-default behavior and the explicit single-object toggle contract.
19. Import a valid AI group and verify exact Count, destination, canonical equipment resolution where available, and invented loot fallback.
20. Remove the Quirk section or all inventory entries from a payload and confirm import is rejected before Actor creation.
21. Attempt malformed JSON, wrong root shape, Count mismatch, invalid numeric/item values, and unsafe HTML; confirm validation/sanitization prevents unsafe creation.
22. Block clipboard-read permission and verify manual-paste fallback.
23. Switch Foundry between English and German and inspect the new group/habitat/mixed-Race UI.
24. Enable/disable debug logging and confirm normal operation stays quiet when disabled.
25. Open Dashboard string filters, configure several rules, export a JSON profile, change the rules, then import the file and verify the exported configuration is restored. Repeat with Copy JSON / Import clipboard.
26. Generate ten NPCs with three allowed Races and Strong primary-Race majority; verify the result is approximately 8/1/1 and preserves exact Count.
27. Generate five Merchants with Role variants; verify five distinct merchant specializations are used before any repeats. Test balanced, primary-majority, strong-majority, and weighted mixed Roles.
28. Exercise every Combat readiness level on civilians, artisans, scholars/Jurists, guards, soldiers, and Orc Raider groups. Weaponless must produce no weapon/armor; occupational ceilings must remain plausible at Highly Prepared; professional combatants must retain sensible minimum arms at Minimal.
29. Confirm local generated canonical weapons/armor resolve to functional D&D 5e Items where the system compendium contains them, and that AC matches the generated armor/shield loadout.

30. Open the NPC dashboard repeatedly, switch every Race composition and Role composition radio option, close/reopen, and confirm the dashboard never throws and Copy prompt/Create/Import remain functional.
31. Trigger the same composition changes with keyboard navigation and verify dependent mixed-composition sections update exactly once per change.
32. Open Dashboard string filters repeatedly, save changes, close without saving, reopen, import/export by file and clipboard, and verify no stale state or duplicate action firing.
33. Test clipboard writing with Foundry clipboard permissions available and with browser clipboard fallback; verify Copy prompt, portrait prompt, and Copy filter JSON all show success only after an actual write succeeds.

## v0.1.7 regressions

Automated coverage includes automatically materialized and explicitly reused generation seeds, seed persistence to biography/flags, melee/ranged hard weapon constraints, occupation-safe ranged-only fallback, ApplicationV2 Actor-sheet portrait hook registration, preview whitelisting, non-mutating preview edits, and rejection of invalid post-edit payloads.
