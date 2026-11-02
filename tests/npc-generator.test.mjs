// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import assert from "node:assert/strict";
import test from "node:test";

import { TIER_STYLES } from "../scripts/constants.mjs";
import { CR_VALUES, HABITATS, NAME_STYLES, RACES, formatChallengeRating } from "../scripts/generator/data.mjs";
import {
  buildActorSource,
  buildGenderAssignments,
  buildRaceAssignments,
  buildRoleAssignments,
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


test("strong primary-race composition produces an 8/1/1-style ten-person mix", () => {
  const assignments = buildRaceAssignments({
    raceComposition: "dominant",
    species: "human",
    groupRaces: ["human", "elf", "dwarf"],
    primaryRace: "human"
  }, 10, createSeededRandom("dominant-races"));
  const counts = assignments.reduce((map, entry) => {
    map[entry.species] = (map[entry.species] ?? 0) + 1;
    return map;
  }, {});
  assert.deepEqual(counts, { human: 8, elf: 1, dwarf: 1 });
});

test("exact Race composition uses the configured integer quotas", () => {
  const assignments = buildRaceAssignments({
    raceComposition: "exact",
    species: "human",
    groupRaces: ["human", "elf", "dwarf"],
    raceExactCounts: { human: 8, elf: 1, dwarf: 1 }
  }, 10, createSeededRandom("exact-races"));
  const counts = assignments.reduce((map, entry) => {
    map[entry.species] = (map[entry.species] ?? 0) + 1;
    return map;
  }, {});
  assert.deepEqual(counts, { human: 8, elf: 1, dwarf: 1 });
});

test("exact Race composition rejects totals that do not match Count", () => {
  assert.throws(() => buildRaceAssignments({
    raceComposition: "exact",
    species: "human",
    groupRaces: ["human", "elf"],
    raceExactCounts: { human: 8, elf: 1 }
  }, 10, createSeededRandom("invalid-exact-races")), /must add up to 10; currently 9/);
});

test("merchant role variants distribute distinct merchant specializations before repeating", () => {
  const batch = generateNpcBatch({
    count: 5,
    role: "merchant",
    roleComposition: "variants",
    groupType: "independent",
    seed: "merchant-variants"
  });
  assert.equal(new Set(batch.map((npc) => npc.roleVariant)).size, 5);
  assert.ok(batch.every((npc) => npc.role === "Merchant"));
});

test("balanced mixed roles use exact quotas", () => {
  const assignments = buildRoleAssignments({
    role: "merchant",
    roleComposition: "balanced",
    groupRoles: ["merchant", "guard", "scholar"],
    primaryRole: "merchant"
  }, 9, createSeededRandom("balanced-roles"));
  const counts = assignments.reduce((map, entry) => {
    map[entry.role] = (map[entry.role] ?? 0) + 1;
    return map;
  }, {});
  assert.deepEqual(counts, { merchant: 3, guard: 3, scholar: 3 });
});

function roleCounts(assignments) {
  return assignments.reduce((map, entry) => {
    map[entry.role] = (map[entry.role] ?? 0) + 1;
    return map;
  }, {});
}

test("primary and strong-primary role modes use the main Role as the invariant primary role", () => {
  const base = { role: "merchant", groupRoles: ["merchant", "guard", "scholar"], primaryRole: "scholar" };
  assert.deepEqual(roleCounts(buildRoleAssignments({ ...base, roleComposition: "primary" }, 10, createSeededRandom("primary-role"))), { merchant: 7, guard: 2, scholar: 1 });
  assert.deepEqual(roleCounts(buildRoleAssignments({ ...base, roleComposition: "dominant" }, 10, createSeededRandom("dominant-role"))), { merchant: 8, guard: 1, scholar: 1 });
});

test("custom role weights are relative, accept zero, and preserve exact batch size", () => {
  const base = { role: "merchant", roleComposition: "weighted", groupRoles: ["merchant", "guard", "scholar"] };
  const proportional = roleCounts(buildRoleAssignments({ ...base, roleWeights: { merchant: 10, guard: 20, scholar: 30 } }, 10, createSeededRandom("weights-10-20-30")));
  assert.deepEqual(proportional, { merchant: 2, guard: 3, scholar: 5 });
  const zeroExcluded = roleCounts(buildRoleAssignments({ ...base, roleWeights: { merchant: 0, guard: 1, scholar: 1 } }, 10, createSeededRandom("weights-zero")));
  assert.deepEqual(zeroExcluded, { guard: 5, scholar: 5 });
  const allZeroFallback = roleCounts(buildRoleAssignments({ ...base, roleWeights: { merchant: 0, guard: 0, scholar: 0 } }, 10, createSeededRandom("weights-all-zero")));
  assert.deepEqual(allZeroFallback, { merchant: 4, guard: 3, scholar: 3 });
});

test("weaponless readiness removes all generated combat gear", () => {
  const npc = generateNpcBlueprint({
    role: "soldier",
    combatReadiness: "weaponless",
    tier: "veteran"
  }, createSeededRandom("weaponless"));
  assert.deepEqual(npc.combatItems, []);
  assert.equal(npc.combatReadiness, "Weaponless");
});

test("jurist combat ceiling stays discreet even at maximum readiness and high CR", () => {
  const npc = generateNpcBlueprint({
    role: "scholar",
    roleVariant: "Jurist",
    combatReadiness: "armed",
    tierStyle: TIER_STYLES.CR,
    cr: 10
  }, createSeededRandom("armed-jurist"));
  assert.deepEqual(npc.combatItems.map((item) => item.name), ["Dagger"]);
});

test("minimal readiness still arms an orc-raider civilian with a simple plausible weapon", () => {
  const npc = generateNpcBlueprint({
    role: "civilian",
    groupType: "orcRaiders",
    combatReadiness: "minimal",
    tier: "trained"
  }, createSeededRandom("minimal-raider"));
  assert.deepEqual(npc.combatItems.map((item) => item.name), ["Dagger"]);
});

test("highly prepared soldiers carry armor plus shield instead of a shield-only loadout", () => {
  const npc = generateNpcBlueprint({
    role: "soldier",
    combatReadiness: "armed",
    tierStyle: TIER_STYLES.CR,
    cr: 10
  }, createSeededRandom("armed-soldier"));
  const names = npc.combatItems.map((item) => item.name);
  assert.ok(names.includes("Chain Mail"));
  assert.ok(names.includes("Shield"));
  assert.ok(names.some((name) => ["Spear", "Longsword", "Light Crossbow"].includes(name)));
});

test("every local batch gets a reusable generation seed and stores it on Actor metadata", () => {
  const batch = generateNpcBatch({ count: 3, role: "guard", seed: "reusable-seed" });
  assert.ok(batch.every((npc) => npc.generationSeed === "reusable-seed"));
  const actor = buildActorSource(batch[0]);
  assert.equal(actor.flags["runyth-npc-button"].generationSeed, "reusable-seed");
  assert.match(actor.system.details.biography.value, /<strong>Generation seed:<\/strong> reusable-seed/);
});

test("blank local seed is automatically materialized once for the whole batch", () => {
  const batch = generateNpcBatch({ count: 4, role: "civilian" });
  const seeds = new Set(batch.map((npc) => npc.generationSeed));
  assert.equal(seeds.size, 1);
  assert.ok([...seeds][0].length >= 8);
});

test("weapon variety hard modes constrain role-appropriate generated weapons", () => {
  const rangedScout = generateNpcBlueprint({
    role: "scout",
    combatReadiness: "armed",
    weaponVariety: "rangedOnly",
    tier: "elite",
    seed: "ranged-scout"
  }, createSeededRandom("ranged-scout"));
  const scoutWeapons = rangedScout.combatItems.filter((item) => item.kind === "weapon").map((item) => item.name);
  assert.deepEqual(scoutWeapons, ["Shortbow"]);

  const meleeGuard = generateNpcBlueprint({
    role: "guard",
    combatReadiness: "armed",
    weaponVariety: "meleeOnly",
    tier: "elite"
  }, createSeededRandom("melee-guard"));
  assert.ok(meleeGuard.combatItems.some((item) => item.kind === "weapon"));
  assert.equal(meleeGuard.combatItems.some((item) => item.name === "Light Crossbow"), false);
});

test("ranged-only never invents an implausible ranged weapon for a jurist", () => {
  const jurist = generateNpcBlueprint({
    role: "scholar",
    roleVariant: "Jurist",
    combatReadiness: "armed",
    weaponVariety: "rangedOnly",
    tierStyle: TIER_STYLES.CR,
    cr: 10
  }, createSeededRandom("ranged-jurist"));
  assert.equal(jurist.combatItems.some((item) => item.kind === "weapon"), false);
});

test("weapon preference modes keep the preferred engagement range primary at high readiness", () => {
  const rangedPreferred = generateNpcBlueprint({
    role: "guard",
    combatReadiness: "armed",
    weaponVariety: "rangedPreferred",
    tierStyle: TIER_STYLES.CR,
    cr: 12
  }, createSeededRandom("ranged-preferred"));
  assert.equal(rangedPreferred.combatItems.find((item) => item.kind === "weapon")?.name, "Light Crossbow");

  const meleePreferred = generateNpcBlueprint({
    role: "guard",
    combatReadiness: "armed",
    weaponVariety: "meleePreferred",
    tierStyle: TIER_STYLES.CR,
    cr: 12
  }, createSeededRandom("melee-preferred"));
  assert.notEqual(meleePreferred.combatItems.find((item) => item.kind === "weapon")?.name, "Light Crossbow");
});


test("batch gender assignment stays limited to the built-in binary tuple", () => {
  for (const mode of ["random", "balanced", "mostlyMale", "mostlyFemale", "exact"]) {
    const assignments = buildGenderAssignments({ genderComposition: mode, maleCount: 8, femaleCount: 2 }, 10, createSeededRandom(`gender-${mode}`));
    assert.equal(assignments.length, 10);
    assert.ok(assignments.every((value) => value === "male" || value === "female"));
  }
});

test("exact batch gender counts are preserved and stored on generated actors", () => {
  const batch = generateNpcBatch({
    count: 10,
    genderComposition: "exact",
    maleCount: 8,
    femaleCount: 2,
    seed: "gender-exact"
  });
  assert.equal(batch.filter((npc) => npc.gender === "male").length, 8);
  assert.equal(batch.filter((npc) => npc.gender === "female").length, 2);
  const actor = buildActorSource(batch[0]);
  assert.equal(["male", "female"].includes(actor.flags["runyth-npc-button"].gender), true);
  assert.match(actor.system.details.biography.value, /<strong>Gender:<\/strong> (Male|Female)/);
});

test("balanced and strong-majority gender mixes use exact integer quotas", () => {
  const balanced = buildGenderAssignments({ genderComposition: "balanced" }, 5, createSeededRandom("gender-balanced"));
  assert.equal(balanced.filter((value) => value === "male").length, 3);
  assert.equal(balanced.filter((value) => value === "female").length, 2);

  const mostlyMale = buildGenderAssignments({ genderComposition: "mostlyMale" }, 10, createSeededRandom("gender-mostly-male"));
  assert.equal(mostlyMale.filter((value) => value === "male").length, 8);
  assert.equal(mostlyMale.filter((value) => value === "female").length, 2);

  const mostlyFemale = buildGenderAssignments({ genderComposition: "mostlyFemale" }, 10, createSeededRandom("gender-mostly-female"));
  assert.equal(mostlyFemale.filter((value) => value === "female").length, 8);
  assert.equal(mostlyFemale.filter((value) => value === "male").length, 2);
});

test("generated names support fixed prefix, infix, and suffix without changing the default naming style", () => {
  const npc = generateNpcBlueprint({
    namingStyle: "central",
    nameFormatPreset: "standard",
    namePrefix: "House",
    nameInfix: "van",
    nameSuffix: "the Younger"
  }, createSeededRandom("formatted-name-affixes"));
  assert.match(npc.name, /^House .+ van .+ the Younger$/);
});

test("location and formal naming presets place optional components only where configured", () => {
  const located = generateNpcBlueprint({
    role: "guard",
    namingStyle: "central",
    nameFormatPreset: "location",
    nameLocation: "Velia"
  }, createSeededRandom("formatted-name-location"));
  assert.match(located.name, / of Velia$/);

  const formal = generateNpcBlueprint({
    role: "noble",
    gender: "female",
    namingStyle: "central",
    nameFormatPreset: "formal",
    titleMode: "always"
  }, createSeededRandom("formatted-name-title"));
  assert.match(formal.name, /^Lady /);
});

test("nickname preset can force a generated nickname and avoids empty punctuation", () => {
  const withNickname = generateNpcBlueprint({
    namingStyle: "central",
    nameFormatPreset: "nickname",
    nicknameMode: "always"
  }, createSeededRandom("formatted-name-nickname"));
  assert.match(withNickname.name, /"[^"]+"/);

  const withoutNickname = generateNpcBlueprint({
    namingStyle: "central",
    nameFormatPreset: "nickname",
    nicknameMode: "never"
  }, createSeededRandom("formatted-name-no-nickname"));
  assert.doesNotMatch(withoutNickname.name, /""/);
  assert.doesNotMatch(withoutNickname.name, /\s{2,}/);
});

test("custom name templates support exact token placement and batch index", () => {
  const batch = generateNpcBatch({
    count: 2,
    role: "soldier",
    species: "human",
    namingStyle: "central",
    nameFormatPreset: "custom",
    nameTemplate: "{title} {last}, {first}[ \"{nickname}\"] — {race} {role} #{index}[ of {location}]",
    titleMode: "always",
    nicknameMode: "always",
    nameLocation: "Velia",
    seed: "custom-template-batch"
  });
  assert.match(batch[0].name, / — Human Soldier #1 of Velia$/);
  assert.match(batch[1].name, / — Human Soldier #2 of Velia$/);
  assert.ok(batch.every((npc) => /"[^"]+"/.test(npc.name)));
});

test("Name or batch prefix remains a hard override over advanced name formatting", () => {
  const batch = generateNpcBatch({
    count: 2,
    customName: "Dock Crew",
    nameFormatPreset: "custom",
    nameTemplate: "{title} {first} {last} of {location}",
    nameLocation: "Velia",
    titleMode: "always",
    seed: "prefix-overrides-template"
  });
  assert.deepEqual(batch.map((npc) => npc.name), ["Dock Crew 1", "Dock Crew 2"]);
});
