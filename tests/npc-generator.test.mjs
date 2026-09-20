import assert from "node:assert/strict";
import test from "node:test";

import { TIER_STYLES } from "../scripts/constants.mjs";
import { CR_VALUES, HABITATS, NAME_STYLES, RACES, formatChallengeRating } from "../scripts/generator/data.mjs";
import {
  buildActorSource,
  buildRaceAssignments,
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


test("built-in Race catalog contains all standard 2024 Player's Handbook races", () => {
  const ids = Object.keys(RACES).filter((id) => id !== "custom").sort();
  assert.deepEqual(ids, [
    "aasimar", "dragonborn", "dwarf", "elf", "gnome",
    "goliath", "halfling", "human", "orc", "tiefling"
  ]);
});

test("Forest Village is available as the normal default habitat and habitat catalog is broad", () => {
  assert.equal(HABITATS.forestVillage.label, "Forest Village");
  assert.ok(Object.keys(HABITATS).length >= 20);
  assert.equal(HABITATS.desertOasis.group, "arid");
  assert.equal(HABITATS.island.group, "water");
  assert.equal(HABITATS.mountains.group, "rugged");
});

test("every naming style provides a rich creative example set", () => {
  for (const style of Object.values(NAME_STYLES)) {
    assert.ok(style.examples.length >= 12);
    assert.ok(style.aiGuidance.length > 40);
    assert.equal(new Set(style.examples).size, style.examples.length);
  }
});

test("balanced mixed-race assignment uses exact quotas instead of random collapse", () => {
  const assignments = buildRaceAssignments({
    raceComposition: "mixed",
    species: "human",
    groupRaces: ["human", "elf", "dwarf"],
    primaryRace: "human",
    raceDistribution: "balanced"
  }, 9, createSeededRandom("mixed-balanced"));

  const counts = assignments.reduce((map, entry) => {
    map[entry.species] = (map[entry.species] ?? 0) + 1;
    return map;
  }, {});
  assert.deepEqual(counts, { human: 3, elf: 3, dwarf: 3 });
});

test("primary-race mixed groups keep a strong majority while preserving minorities", () => {
  const assignments = buildRaceAssignments({
    raceComposition: "mixed",
    species: "orc",
    groupRaces: ["orc", "human", "goliath"],
    primaryRace: "orc",
    raceDistribution: "primary"
  }, 20, createSeededRandom("mixed-primary"));

  const orcs = assignments.filter((entry) => entry.species === "orc").length;
  assert.ok(orcs >= 13 && orcs <= 15);
  assert.ok(assignments.some((entry) => entry.species === "human"));
  assert.ok(assignments.some((entry) => entry.species === "goliath"));
});

test("family generation shares a surname and adds quirks, relationship lore, secrets, and habitat", () => {
  const family = generateNpcBatch({
    count: 5,
    groupType: "family",
    species: "human",
    raceComposition: "single",
    habitat: "forestVillage",
    namingStyle: "central",
    seed: "family-test"
  });
  const surnames = family.map((npc) => npc.name.split(" ").at(-1));
  assert.equal(new Set(surnames).size, 1);
  assert.ok(family.every((npc) => npc.quirk));
  assert.ok(family.every((npc) => npc.relationship.includes("family disagreement")));
  assert.ok(family.every((npc) => npc.groupSecret));
  assert.ok(family.every((npc) => npc.groupRumour));
  assert.ok(family.every((npc) => npc.habitat === "Forest Village"));
  assert.ok(family.every((npc) => npc.familyStructure === "Single household"));
  assert.ok(family.every((npc) => npc.groupCohesion === "Functional"));
  assert.ok(family.every((npc) => npc.groupHierarchy === "Informal leader"));
  assert.ok(family.every((npc) => npc.relationshipDensity === "Rich"));
  assert.ok(family.every((npc) => npc.internalConflict === "Low"));
});

test("advanced group controls alter local relationship lore and Actor flags", () => {
  const group = generateNpcBatch({
    count: 4,
    groupType: "guardPatrol",
    species: "human",
    raceComposition: "single",
    habitat: "marketTown",
    namingStyle: "central",
    groupCohesion: "fractured",
    groupHierarchy: "rigid",
    relationshipDensity: "tangled",
    internalConflict: "high",
    seed: "advanced-group-test"
  });
  assert.ok(group.every((npc) => npc.relationship.includes("serious unresolved dispute")));
  assert.ok(group.every((npc) => npc.relationship.includes("rank as a real boundary")));
  assert.ok(group.every((npc) => npc.groupCohesion === "Fractured"));
  assert.ok(group.every((npc) => npc.groupHierarchy === "Rigid hierarchy"));
  assert.ok(group.every((npc) => npc.relationshipDensity === "Tangled"));
  assert.ok(group.every((npc) => npc.internalConflict === "High"));
  const actor = buildActorSource(group[0]);
  assert.equal(actor.flags["runyth-npc-button"].groupCohesion, "Fractured");
  assert.equal(actor.flags["runyth-npc-button"].groupHierarchy, "Rigid hierarchy");
  assert.match(actor.system.details.biography.value, /<strong>Internal conflict:<\/strong> High/);
});
