import assert from "node:assert/strict";
import test from "node:test";

import { TIER_STYLES } from "../scripts/constants.mjs";
import { CR_VALUES, formatChallengeRating } from "../scripts/generator/data.mjs";
import {
  buildActorSource,
  createSeededRandom,
  escapeHtml,
  generateNpcBatch,
  generateNpcBlueprint,
  profileForChallengeRating,
  resolveTierProfile
} from "../scripts/generator/npc-generator.mjs";

test("seeded generation is reproducible", () => {
  const options = {
    role: "scout",
    tier: "veteran",
    tierStyle: TIER_STYLES.NAMED,
    species: "elf",
    namingStyle: "coastal",
    wealth: "average"
  };

  const first = generateNpcBlueprint(options, createSeededRandom("stable-seed"));
  const second = generateNpcBlueprint(options, createSeededRandom("stable-seed"));
  assert.deepEqual(first, second);
});

test("generated NPC values stay within supported ranges", () => {
  const npc = generateNpcBlueprint(
    { role: "bruiser", tier: "champion", tierStyle: TIER_STYLES.NAMED, species: "orc", namingStyle: "frontier" },
    createSeededRandom("limits")
  );

  for (const value of Object.values(npc.abilities)) {
    assert.ok(value >= 6 && value <= 24);
  }
  assert.ok(npc.ac >= 8 && npc.ac <= 30);
  assert.ok(npc.hp.value > 0);
  assert.match(npc.hp.formula, /^\d+d\d+(?:[+-]\d+)?$/);
});

test("CR mode exposes every standard 2024 CR", () => {
  assert.equal(CR_VALUES.length, 34);
  assert.deepEqual(CR_VALUES.slice(0, 4), [0, 0.125, 0.25, 0.5]);
  assert.equal(CR_VALUES.at(-1), 30);
  assert.equal(formatChallengeRating(0.125), "1/8");
  assert.equal(formatChallengeRating(0.25), "1/4");
  assert.equal(formatChallengeRating(0.5), "1/2");
});

test("exact CR selection is preserved while local support stats scale", () => {
  const profile = resolveTierProfile({ tierStyle: TIER_STYLES.CR, cr: 17 });
  assert.equal(profile.cr, 17);
  assert.equal(profile.label, "CR 17");
  assert.ok(profile.acBonus >= 6);
  assert.ok(profile.hpMultiplier > 16);

  const maximum = profileForChallengeRating(30);
  assert.equal(maximum.cr, 30);
  assert.equal(maximum.acBonus, 9);
  assert.equal(maximum.abilityBonus, 8);
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

test("actor source uses dnd5e NPC fields and records wealth", () => {
  const blueprint = generateNpcBlueprint({ wealth: "wellOff" }, createSeededRandom("actor"));
  const source = buildActorSource(blueprint, { folderId: "folder-id" });

  assert.equal(source.type, "npc");
  assert.equal(source.folder, "folder-id");
  assert.equal(source.system.attributes.ac.calc, "flat");
  assert.equal(source.system.details.cr, blueprint.cr);
  assert.equal(source.system.details.type.value, "humanoid");
  assert.equal(source.system.details.biography.value.includes("<strong>Race:</strong>"), true);
  assert.equal(source.flags["runyth-npc-button"].generated, true);
  assert.equal(source.flags["runyth-npc-button"].wealth, "Well-Off");
});

test("HTML values are escaped before biography interpolation", () => {
  assert.equal(escapeHtml(`<script>alert("x")</script>`), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
});
