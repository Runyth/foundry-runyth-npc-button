// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import assert from "node:assert/strict";
import test from "node:test";

import { applyPreviewEdits, selectedPreviewPayload, validatePreviewPayload } from "../scripts/ui/npc-import-preview.mjs";

function rawActor(name = "Mara Reed") {
  return {
    name,
    type: "npc",
    img: "icons/svg/mystery-man.svg",
    system: {
      abilities: {
        str: { value: 10 }, dex: { value: 12 }, con: { value: 11 },
        int: { value: 9 }, wis: { value: 13 }, cha: { value: 10 }
      },
      attributes: {
        ac: { calc: "flat", flat: 12 },
        hp: { value: 9, max: 9, formula: "2d8" },
        movement: { walk: 30, units: "ft" }
      },
      details: {
        cr: 0.25,
        type: { value: "humanoid", subtype: "Human", swarm: "", custom: "" },
        biography: {
          value: "<p><strong>Appearance:</strong> Plain coat.</p><p><strong>Speech:</strong> Quiet.</p><p><strong>Motivation:</strong> Keep working.</p><p><strong>Mannerism:</strong> Taps a finger.</p><p><strong>Quirk:</strong> Sorts buttons.</p><p><strong>Rumours:</strong> Knows the miller.</p><p><strong>Secrets:</strong> Hid a letter.</p><p><strong>Relationships:</strong> Trusts Mara.</p><p><strong>Adventure Hook:</strong> Needs help.</p>",
          public: ""
        }
      },
      traits: { size: "med" }
    },
    items: [{ name: "Dagger", lookup: "Dagger", quantity: 1, description: "A small knife." }]
  };
}

test("preview editing changes only whitelisted simple fields without mutating the source", () => {
  const original = rawActor();
  const edited = applyPreviewEdits(original, {
    name: "Mara Vale",
    race: "Elf",
    cr: 1,
    ac: 14,
    hp: 12,
    hpMax: 12,
    speed: 35,
    biography: original.system.details.biography.value.replace("Plain coat", "Green coat")
  });
  assert.equal(original.name, "Mara Reed");
  assert.equal(edited.name, "Mara Vale");
  assert.equal(edited.system.details.type.subtype, "Elf");
  assert.equal(edited.system.details.cr, 1);
  assert.equal(edited.system.attributes.ac.flat, 14);
  assert.equal(edited.system.attributes.hp.value, 12);
  assert.equal(edited.system.attributes.movement.walk, 35);
  assert.match(edited.system.details.biography.value, /Green coat/);
  assert.equal(edited.items[0].lookup, "Dagger");
});

test("edited preview payload is revalidated against the import contract", () => {
  const edited = applyPreviewEdits(rawActor(), { name: "Edited NPC", hp: 15, hpMax: 15 });
  const normalized = validatePreviewPayload([edited], { expectedCount: 1 });
  assert.equal(normalized[0].name, "Edited NPC");
  assert.equal(normalized[0].system.attributes.hp.value, 15);
});

test("preview revalidation rejects invalid post-edit basics", () => {
  const invalid = applyPreviewEdits(rawActor(), { hp: 20, hpMax: 10 });
  assert.throws(
    () => validatePreviewPayload([invalid], { expectedCount: 1 }),
    /hp.max must be a number between 20 and 100000/
  );
});


test("preview subset selection preserves edited payload order and supports deselection", () => {
  const payload = [rawActor("One"), rawActor("Two"), rawActor("Three")];
  const selected = selectedPreviewPayload(payload, new Set([0, 2]));
  assert.deepEqual(selected.map((entry) => entry.name), ["One", "Three"]);
  assert.equal(payload.length, 3);
});
