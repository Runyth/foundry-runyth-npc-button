import assert from "node:assert/strict";
import test from "node:test";

import {
  buildActorSource,
  createSeededRandom,
  escapeHtml,
  generateNpcBatch,
  generateNpcBlueprint
} from "../scripts/generator/npc-generator.mjs";

test("seeded generation is reproducible", () => {
  const options = {
    role: "scout",
    tier: "veteran",
    species: "elf",
    namingStyle: "coastal"
  };

  const first = generateNpcBlueprint(options, createSeededRandom("stable-seed"));
  const second = generateNpcBlueprint(options, createSeededRandom("stable-seed"));
  assert.deepEqual(first, second);
});

test("generated NPC values stay within supported ranges", () => {
  const npc = generateNpcBlueprint(
    { role: "bruiser", tier: "champion", species: "orc", namingStyle: "frontier" },
    createSeededRandom("limits")
  );

  for (const value of Object.values(npc.abilities)) {
    assert.ok(value >= 6 && value <= 20);
  }
  assert.ok(npc.ac >= 8 && npc.ac <= 22);
  assert.ok(npc.hp.value > 0);
  assert.match(npc.hp.formula, /^\d+d\d+(?:[+-]\d+)?$/);
});

test("batch custom name becomes a numbered prefix", () => {
  const batch = generateNpcBatch({
    count: 3,
    customName: "Harbor Watch",
    seed: "batch"
  });

  assert.deepEqual(batch.map((npc) => npc.name), [
    "Harbor Watch 1",
    "Harbor Watch 2",
    "Harbor Watch 3"
  ]);
});

test("actor source uses dnd5e NPC fields", () => {
  const blueprint = generateNpcBlueprint({}, createSeededRandom("actor"));
  const source = buildActorSource(blueprint, { folderId: "folder-id" });

  assert.equal(source.type, "npc");
  assert.equal(source.folder, "folder-id");
  assert.equal(source.system.attributes.ac.calc, "flat");
  assert.equal(source.system.details.cr, blueprint.cr);
  assert.equal(source.system.details.type.value, "humanoid");
  assert.equal(source.flags["runyth-npc-button"].generated, true);
});

test("HTML values are escaped before biography interpolation", () => {
  assert.equal(escapeHtml(`<script>alert("x")</script>`), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
});
