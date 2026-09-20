# Testing

Run:

```bash
npm run check
```

This executes repository validation and Node's built-in unit tests.

## Automated coverage

The MVP tests:

- seeded reproducibility;
- ability, AC, and HP bounds;
- deterministic batch naming;
- expected D&D 5e Actor source shape;
- HTML escaping for generated biography data.

Repository validation checks the manifest, referenced runtime files, and selected deprecated/removed API patterns.

## Foundry smoke-test checklist

1. Enable the module in a Foundry VTT 13 world using a supported D&D 5e system version.
2. Confirm the button appears only for a Game Master in the Actors directory.
3. Generate one NPC with defaults.
4. Confirm the Actor opens and displays the generated abilities, AC, HP, speed, CR, type, and biography.
5. Generate a batch with a seed; delete it; repeat with the same seed and confirm the generated data matches.
6. Test an existing Actor folder.
7. Test a new folder name.
8. Set the default folder setting to blank and confirm root creation works.
9. Switch the Foundry UI between English and German and confirm module UI localization.
10. Enable debug logging and confirm logs are concise; disable it and confirm normal generation remains quiet.
