import assert from "node:assert/strict";
import test from "node:test";

import { buildPortraitPromptFromActor } from "../scripts/ai/portrait-prompt-builder.mjs";
import { clearExtensionRegistry, getRaces, registerRace } from "../scripts/extensions/registry.mjs";
import { applyStringFilters, parseFilterSettings } from "../scripts/filters.mjs";

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
