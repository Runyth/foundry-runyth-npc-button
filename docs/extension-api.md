# Extension API

Runyth NPC Button exposes a public integration surface at:

`game.modules.get("runyth-npc-button").api`

The API is intended for complementary Foundry modules, macros, and local tooling.

## Stable catalog registration API

These functions remain available for extending dashboard catalogs:

- `registerRace(id, data)` / `unregisterRace(id)`
- `registerRole(id, data)` / `unregisterRole(id)`
- `registerNamingStyle(id, data)` / `unregisterNamingStyle(id)`
- `registerHabitat(id, data)` / `unregisterHabitat(id)`
- `registerGroupType(id, data)` / `unregisterGroupType(id)`
- `getRaces()` / `getRoles()` / `getNamingStyles()` / `getHabitats()` / `getGroupTypes()` / `getCatalogGroups()`
- `getComplementaryCatalogModules()` — returns source-attributed complementary-module contribution counts.
- `getUnattributedCatalogEntries()` — returns extension entries that are active but lack source-module ownership metadata.
- `attributeCatalogEntries(sourceModuleId, contributions, options)` — backfills source-module ownership for already-registered entries.

Catalog registrations may additionally provide a few optional metadata fields that the core module understands:

- `sourceModuleId: string` — marks the entry as contributed by a complementary module. The entry is then color-highlighted in dashboard pickers and filter catalogs. The GM can configure one highlight color per module in global settings.
- `sourceModuleTitle: string` — optional human-readable override for the source-module badge.
- `portraitGuidance: string` — for Race registrations, appends race-specific portrait guidance to the built-in single-image portrait prompt.

Example:

```js
const api = game.modules.get("runyth-npc-button")?.api;

api?.registerRace("goblin", {
  label: "Goblin",
  group: "supplemental",
  size: "sm",
  speed: 30,
  sourceModuleId: "orphan-black-companion",
  portraitGuidance: "read unmistakably as a Goblin with a wiry frame, oversized ears, sharp features, and a goblin silhouette rather than a green human"
});
```

For a complementary module that already registers entries without `sourceModuleId`, patching every config object is not required. It can attribute the existing registrations once:

```js
api?.attributeCatalogEntries("orphan-black-npc-button", {
  races: ["goblin", "hobgoblin"],
  roles: ["slave", "day-labourer", "forced-labourer", "migrant-labourer"]
});
```

This ownership metadata is what allows the core module to group entries by complementary module and apply the GM-configured per-module highlight color. Merely installing or enabling a module cannot provide that information reliably.

## Prompt pipeline API

This feature release adds a prompt-pipeline API so complementary modules can customize AI prompts without monkey-patching internals.

### Exposed helpers

- `buildAiPrompt(options)`
- `buildPortraitPromptFromActor(actor)`
- `registerPromptExtension(id, config)`
- `unregisterPromptExtension(id)`
- `getPromptExtensions(target?)`
- `resolvePromptContext(target, context)`
- `resolvePromptComponents(target, defaults, context)`
- `clearPromptExtensionRegistry()`

### Prompt targets

Current built-in prompt targets are:

- `portrait` — single-NPC portrait / full-body image prompts.
- `npcJson` — strict JSON generation prompts for AI-assisted NPC import.

### Registration model

Prompt extensions are registered by ID and ordered deterministically by:

1. ascending numeric `priority`
2. ascending `id`

Later/higher-priority entries therefore win for replacement-oriented behavior.

### Supported integration styles

A prompt extension may provide one or both of the following patterns for a target.

#### 1. Structured portrait-component customization

Useful when a module wants to alter the default style or other reusable prompt fragments while keeping the built-in prompt builder.

Supported portrait component groups are currently:

- `output`
- `subject`
- `style`
- `background`
- `negative`

Each target config may provide:

- `components`
- `mergeMode`
- `transformComponents(components, context)`

`mergeMode` may be:

- `replace`
- `prepend`
- `append`
- `clear`

It may be supplied globally as a string or per component key as an object.

#### 2. Full prompt composition / post-processing

Useful when a module wants total control over a target's final prompt.

Each target config may provide:

- `transformContext(context)`
- `compose({ context, components, buildDefault })`
- `transformText(text, context, components)`

`compose` fully replaces the final builder for the target where it is registered as the highest-priority composer. `transformText` runs after composition and can append or rewrite the output.

## Example: replace portrait style defaults

```js
const api = game.modules.get("runyth-npc-button")?.api;

api?.registerPromptExtension("my-portrait-style", {
  priority: 50,
  targets: {
    portrait: {
      mergeMode: {
        style: "replace",
        background: "replace"
      },
      components: {
        style: [
          "ink illustration",
          "high-contrast monochrome",
          "harsh rim lighting"
        ],
        background: [
          "dark parchment background"
        ]
      }
    }
  }
});
```

## Example: override the JSON AI prompt completely

```js
const api = game.modules.get("runyth-npc-button")?.api;

api?.registerPromptExtension("my-json-format", {
  priority: 100,
  targets: {
    npcJson: {
      compose({ context }) {
        return [
          "Return one markdown code block labeled json.",
          `Generate exactly ${context.count ?? 1} NPCs.`,
          "Use my external schema here."
        ].join("\n");
      }
    }
  }
});
```

## Default portrait aesthetic

The built-in portrait prompt now defaults to a grounded semi-realistic adult-anime aesthetic inspired by rugged low-fantasy worker/traveler illustrations:

- muted earth-tone palette
- painterly shading
- crisp linework
- weathered textiles, leather, rope, and material detail
- clean isolated studio-style presentation

This is a style baseline only. Complementary modules can change it through the prompt-pipeline API.

Additionally, the built-in portrait builder now pushes non-human races toward race-idiomatic anatomy and silhouette. If a registered Race provides `portraitGuidance`, that text is folded into the default prompt before prompt extensions run.

## Naming-style and Role metadata used by advanced name formatting

The existing catalog API remains compatible with advanced generated-name formatting. Complementary modules may optionally add:

- `nicknames: string[]` to a registered Naming style; when omitted, the core generic nickname pool is used.
- `titles: string[]` to a registered Role; when omitted, the core role-appropriate title pool is used where available.

The core name-template engine remains responsible for placement, optional blocks, fixed affixes, batch index, Role, and Race tokens. Extensions do not need to reimplement the formatter merely to provide additional naming vocabulary.
