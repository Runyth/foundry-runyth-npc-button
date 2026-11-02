// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import assert from "node:assert/strict";
import test from "node:test";

import { buildAiPrompt } from "../scripts/ai/prompt-builder.mjs";
import { ageBoundsForNpc, buildAgeAssignments } from "../scripts/generator/age.mjs";
import { buildActorSource, createSeededRandom, generateNpcBatch } from "../scripts/generator/npc-generator.mjs";

test("exact age range uses literal years and stays inside inclusive bounds", () => {
  const races = Array.from({ length: 10 }, () => ({ species: "elf" }));
  const roles = Array.from({ length: 10 }, () => ({ role: "guard" }));
  const ages = buildAgeAssignments({ ageRange: "exactRange", ageMin: 20, ageMax: 35, ageSpread: "even" }, races, roles, 10, createSeededRandom("age-exact"), { id: "independent" });
  assert.equal(ages.length, 10);
  assert.ok(ages.every((age) => age >= 20 && age <= 35));
  assert.ok(Math.max(...ages) - Math.min(...ages) >= 10);
});

test("named age ranges are Race-relative instead of applying human years to every Race", () => {
  const human = ageBoundsForNpc({ ageRange: "mature", species: "human" }, { species: "human" }, { role: "merchant" }, { id: "independent" });
  const elf = ageBoundsForNpc({ ageRange: "mature", species: "elf" }, { species: "elf" }, { role: "merchant" }, { id: "independent" });
  assert.ok(human.min < human.max);
  assert.ok(elf.min > human.max);
  assert.ok(elf.max > elf.min);
});

test("contextual family age range is broader than a contextual guard peer group", () => {
  const family = ageBoundsForNpc({ ageRange: "contextual", species: "human", groupType: "family" }, { species: "human" }, { role: "civilian" }, { id: "family" });
  const guards = ageBoundsForNpc({ ageRange: "contextual", species: "human", groupType: "guardPatrol" }, { species: "human" }, { role: "guard" }, { id: "guardPatrol" });
  assert.ok((family.max - family.min) > (guards.max - guards.min));
});

test("group age spreads produce distinct distribution patterns without leaving the selected range", () => {
  const races = Array.from({ length: 20 }, () => ({ species: "human" }));
  const roles = Array.from({ length: 20 }, () => ({ role: "artisan" }));
  const base = { ageRange: "exactRange", ageMin: 20, ageMax: 60 };
  const clustered = buildAgeAssignments({ ...base, ageSpread: "clustered" }, races, roles, 20, createSeededRandom("cluster"), { id: "independent" });
  const younger = buildAgeAssignments({ ...base, ageSpread: "younger" }, races, roles, 20, createSeededRandom("younger"), { id: "independent" });
  const older = buildAgeAssignments({ ...base, ageSpread: "older" }, races, roles, 20, createSeededRandom("older"), { id: "independent" });
  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  assert.ok(clustered.every((age) => age >= 20 && age <= 60));
  assert.ok(mean(younger) < mean(older));
  assert.ok(clustered.every((age) => age >= 34 && age <= 46));
});

test("generated NPCs store age in blueprint, biography, and module metadata", () => {
  const [npc] = generateNpcBatch({ count: 1, species: "human", role: "guard", ageRange: "exactRange", ageMin: 42, ageMax: 42, ageSpread: "natural", seed: "age-42" });
  assert.equal(npc.age, 42);
  const source = buildActorSource(npc);
  assert.equal("age" in source.system.details, false);
  assert.equal(source.flags["runyth-npc-button"].age, 42);
  assert.match(source.system.details.biography.value, /<strong>Age:<\/strong> 42/);
});

test("AI prompt carries age range and group spread instructions", () => {
  const prompt = buildAiPrompt({
    count: 10,
    ageRange: "exactRange",
    ageRangeLabel: "Exact year range",
    ageMin: 20,
    ageMax: 35,
    ageSpreadLabel: "Evenly spread",
    ageSpreadPrompt: "spread the batch broadly and evenly across the selected age range"
  });
  assert.match(prompt, /Age range: literal ages from 20 through 35 years inclusive/);
  assert.match(prompt, /Group age spread: Evenly spread/);
  assert.match(prompt, /<strong>Age:<\/strong> 34/);
  assert.doesNotMatch(prompt, /"age": 34/);
});
