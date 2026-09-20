import assert from "node:assert/strict";
import test from "node:test";

import { buildPortraitPromptFromActor } from "../scripts/ai/portrait-prompt-builder.mjs";
import { clearExtensionRegistry, getRaces, registerRace } from "../scripts/extensions/registry.mjs";
import { FilterSettingsForm, applyStringFilters, buildFilterProfile, defaultFilterConfiguration, parseFilterProfile, parseFilterSettings, settingsFromForm } from "../scripts/filters.mjs";

test("portrait prompt builder creates a terse single-image prompt", () => {
  const actor = {
    name: "Mara Reed",
    system: {
      details: {
        type: { subtype: "Human" },
        biography: {
          value: "<p><strong>Appearance:</strong> Lean woman in a patched coat.</p><p><strong>Tell:</strong> Keeps glancing over one shoulder.</p><p><strong>Quirk:</strong> Straightens every loose strap.</p>"
        }
      }
    },
    flags: {
      "runyth-npc-button": {
        role: "Scout",
        wealth: "Average"
      }
    },
    items: [{ name: "Shortbow" }, { name: "Traveler's Cloak" }]
  };

  const prompt = buildPortraitPromptFromActor(actor);
  assert.match(prompt, /Output exactly one full body image and nothing else\./);
  assert.match(prompt, /Mara Reed, adult Human Scout/);
  assert.match(prompt, /patched coat/);
  assert.match(prompt, /Shortbow/);
  assert.match(prompt, /adult anime style/);
  assert.match(prompt, /no extra characters/);
});

test("extension registry merges registered races", () => {
  clearExtensionRegistry();
  registerRace("hobgoblin", {
    label: "Hobgoblin",
    labelKey: "races.hobgoblin",
    group: "supplemental",
    size: "med",
    speed: 30
  });
  const races = getRaces();
  assert.equal(races.hobgoblin.label, "Hobgoblin");
  assert.equal(races.human.label, "Human");
  clearExtensionRegistry();
});

test("string filters combine allow and deny rules", () => {
  globalThis.game = {
    settings: { get: () => "" }
  };
  const settings = parseFilterSettings({
    roles: {
      exactAllow: "Guard, Scout",
      exactDeny: "Scout",
      containsAllow: "",
      containsDeny: "",
      prefixAllow: "",
      prefixDeny: "",
      suffixAllow: "",
      suffixDeny: "",
      regexAllow: "",
      regexDeny: "",
      caseSensitive: false,
      normalizeDiacritics: true,
      trimWhitespace: true
    }
  });
  const visible = applyStringFilters("roles", [
    { kind: "option", id: "guard", label: "Guard", display: "Guard" },
    { kind: "option", id: "scout", label: "Scout", display: "Scout" },
    { kind: "option", id: "merchant", label: "Merchant", display: "Merchant" }
  ], settings);
  assert.deepEqual(visible.map((entry) => entry.id), ["guard"]);
});


test("filter profiles export and import as versioned portable JSON", () => {
  const settings = parseFilterSettings({
    races: { exactDeny: "Tiefling" },
    roles: { regexAllow: "^(Guard|Scout)$" }
  });
  const profile = buildFilterProfile(settings);
  const restored = parseFilterProfile(JSON.stringify(profile));
  assert.equal(profile.format, "runyth-npc-button-filter-profile");
  assert.equal(profile.version, 1);
  assert.equal(restored.races.exactDeny, "Tiefling");
  assert.equal(restored.roles.regexAllow, "^(Guard|Scout)$");
});


class FilterControl {
  constructor(value = "", checked = false) {
    this.value = value;
    this.checked = checked;
  }
}

function fakeFilterForm(overrides = {}) {
  const defaults = defaultFilterConfiguration();
  const map = new Map();
  for (const [category, config] of Object.entries(defaults)) {
    for (const [key, value] of Object.entries(config)) {
      const override = overrides?.[category]?.[key];
      if (typeof value === "boolean") map.set(`filters.${category}.${key}`, new FilterControl("on", override ?? value));
      else map.set(`filters.${category}.${key}`, new FilterControl(override ?? value, false));
    }
  }
  return {
    querySelector(selector) {
      const match = selector.match(/^\[name="(.+)"\]$/);
      return match ? map.get(match[1]) ?? null : null;
    }
  };
}

test("ApplicationV2 filter settings form extracts defaults and edited values deterministically", () => {
  const form = fakeFilterForm({
    races: { exactDeny: "Goblin", caseSensitive: true },
    roles: { regexAllow: "^(Guard|Scout)$" }
  });
  const parsed = settingsFromForm(form);
  assert.equal(parsed.races.exactDeny, "Goblin");
  assert.equal(parsed.races.caseSensitive, true);
  assert.equal(parsed.roles.regexAllow, "^(Guard|Scout)$");
  assert.equal(parsed.roles.normalizeDiacritics, true);
});

test("filter settings ApplicationV2 form handler persists current form values", async () => {
  const writes = [];
  globalThis.game = {
    i18n: { localize: (key) => key },
    settings: {
      async set(moduleId, setting, value) { writes.push({ moduleId, setting, value }); }
    }
  };
  globalThis.ui = { notifications: { info() {} } };
  const form = fakeFilterForm({ folders: { containsDeny: "Archive" } });
  const handler = FilterSettingsForm.DEFAULT_OPTIONS.form.handler;
  await handler.call({}, new Event("submit"), form);
  assert.equal(writes.length, 1);
  const persisted = JSON.parse(writes[0].value);
  assert.equal(persisted.folders.containsDeny, "Archive");
});


test("malformed and foreign filter profiles are rejected", () => {
  assert.throws(() => parseFilterProfile("not json"), SyntaxError);
  assert.throws(() => parseFilterProfile(JSON.stringify({ format: "other", version: 1, filters: {} })), /not a Runyth NPC Button filter profile/);
  assert.throws(() => parseFilterProfile(JSON.stringify({ format: "runyth-npc-button-filter-profile", version: 99, filters: {} })), /Unsupported filter profile version/);
});
