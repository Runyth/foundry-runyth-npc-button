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
- expected D&D 5e Actor source shape;
- HTML escaping for locally generated biography data;
- array-by-default AI prompt behavior;
- explicit single-object AI prompt behavior;
- AI payload root-shape enforcement;
- AI payload count validation;
- removal of unsupported/untrusted Actor source fields;
- biography HTML sanitization;
- fenced JSON parsing tolerance.

Repository validation checks the manifest, referenced runtime files, version consistency, and selected deprecated/removed API patterns.

## Foundry smoke-test checklist

1. Enable the module in a Foundry VTT 13 world using a supported D&D 5e system version.
2. Confirm the Actors-directory button is **NPC Button** and appears only for a Game Master.
3. Open the dashboard, move and resize it, close it, reopen it, and confirm size/placement are restored.
4. Open and close every suggestion menu repeatedly and confirm there is no close-animation flicker/reopen behavior.
5. Enter arbitrary Count values and verify the 1, 3, 5, and 10 shortcuts update the field naturally.
6. Choose a suggested Species, then type a custom Species directly in the same field.
7. Choose an existing destination folder, then type a new root-folder name directly in the same field.
8. Open Help from the dashboard title bar and confirm it opens beside the dashboard when viewport space permits.
9. Verify every naming style displays example names in Help.
10. Create one NPC locally with defaults.
11. Generate a seeded batch, delete it, repeat with the same seed, and confirm generated data matches.
12. With Count 3, copy the AI prompt and confirm it requests an array of exactly three Actor objects.
13. With Count 1 and single-object mode off, confirm the prompt still requests an array of one Actor object.
14. With Count 1 and single-object mode on, confirm the prompt requests one object and the importer rejects an array.
15. Paste a valid AI response into the clipboard and confirm Import NPC creates Actors in the current destination.
16. Block clipboard-read permission, confirm manual paste opens as the fallback, paste the JSON, and import again.
17. Attempt count-mismatched, malformed, wrong-root-shape, and out-of-range payloads and confirm no Actor is created.
18. Put attributes or unsupported HTML tags in an AI biography and confirm they do not survive unsanitized.
19. Switch Foundry between English and German and confirm module UI localization.
20. Enable debug logging and confirm logs are concise; disable it and confirm normal operation remains quiet.
