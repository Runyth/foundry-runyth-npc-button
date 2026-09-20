# Testing

Run:

```bash
npm run check
```

This executes repository validation and Node's built-in unit tests.

## Automated coverage

Tests cover:

- seeded reproducibility;
- ability, AC, and HP bounds;
- deterministic batch naming;
- full 34-value standard CR catalog;
- exact CR preservation and local CR profile scaling;
- expected D&D 5e Actor source shape;
- Race and wealth biography/source data;
- HTML escaping for locally generated biography data;
- array-by-default AI prompt behavior;
- explicit single-object AI prompt behavior;
- richer AI inventory/rumour/secret/relationship requirements;
- AI payload root-shape enforcement;
- AI payload count validation;
- removal of unsupported/untrusted Actor source fields;
- AI inventory request normalization and quantity bounds;
- canonical D&D equipment resolution, embedded-source cleanup, and requested quantity preservation;
- unresolved/invented possession fallback behavior;
- biography and item-description HTML sanitization;
- fenced JSON parsing tolerance.

Repository validation checks the manifest, referenced runtime files, version consistency, and selected deprecated/removed API patterns.

## Foundry smoke-test checklist

1. Enable the module in a Foundry VTT 13 world using a supported D&D 5e system version.
2. Confirm the Actors-directory button is **NPC Button** and appears only for a Game Master.
3. Open the dashboard, move and resize it, close it, reopen it, and confirm size/placement are restored.
4. In Configure Settings, switch **Tier style** between Named tiers and Challenge Rating (CR), reopening the dashboard after each change.
5. In CR mode verify the picker contains 0, 1/8, 1/4, 1/2, and every integer 1–30.
6. Open Role, Race, Naming style, Tier/CR, and Actor folder pickers repeatedly and confirm there is no close-animation flicker.
7. Populate a world with a deep/numerous Actor folder tree. Confirm the folder picker preserves hierarchy, searches quickly, scrolls smoothly, and does not visibly stall the dashboard.
8. Enter arbitrary Count values and verify the 1, 3, 5, and 10 shortcuts update the field naturally.
9. Choose a preset Race, then search for a custom Race and select the custom entry.
10. Choose nested Actor folders at multiple depths. Also verify Actors root, configured default, and custom new-root-folder destinations.
11. Verify all four Wealth values persist and appear correctly in generated local biography data.
12. Open Help from the dashboard title bar and confirm it opens beside the dashboard when viewport space permits.
13. Verify each naming style shows four visibly distinct example names and a description.
14. Generate 1, 2, and 3 Actors with Actor review enabled and confirm their sheets appear side-by-side where viewport space permits.
15. Generate 4–9 Actors and verify later sheets sit behind the first visible row in repeating columns.
16. Generate 10 Actors and verify all ten open in the stack; generate 11+ and verify only the first ten open.
17. Create one NPC locally with defaults.
18. Generate a seeded batch, delete it, repeat with the same seed, and confirm generated data matches.
19. With Count 3, copy the AI prompt and confirm it requests an array of exactly three Actor objects.
20. Confirm the AI prompt contains Role, exact Tier/CR, Race, Wealth, role-fitting inventory guidance, Rumours, Secrets, Relationships, and batch cross-link guidance.
21. Confirm the AI prompt requires canonical standard equipment to provide an exact English `lookup` name and permits invented roleplay possessions with `lookup: null`.
22. With Count 1 and single-object mode off, confirm the prompt still requests an array of one Actor object.
23. With Count 1 and single-object mode on, confirm the prompt requests one object and the importer rejects an array.
24. Import an AI NPC containing a canonical 2024 equipment item such as a common weapon and verify it resolves to a proper embedded D&D Item when present in system compendia.
25. Import an invented possession and verify it becomes a safe loot Item with its sanitized roleplay description.
26. Block clipboard-read permission, confirm manual paste opens as the fallback, paste the JSON, and import again.
27. Attempt count-mismatched, malformed, wrong-root-shape, invalid-item-quantity, and out-of-range payloads and confirm no Actor is created.
28. Put attributes or unsupported HTML tags in an AI biography/item description and confirm they do not survive unsanitized.
29. Switch Foundry between English and German and confirm module UI localization.
30. Enable debug logging and confirm logs are concise; disable it and confirm normal operation remains quiet.
