import assert from "node:assert/strict";
import test from "node:test";

import { normalizeNpcJsonPayload, parseNpcJsonPayload, sanitizeBiographyHtml } from "../scripts/ai/npc-json.mjs";
import { buildAiPrompt } from "../scripts/ai/prompt-builder.mjs";

function actorSource(name = "Mara Reed") {
  return {
    name,
    type: "npc",
    img: "https://example.invalid/untrusted.png",
    folder: "must-not-survive",
    system: {
      abilities: {
        str: { value: 10 },
        dex: { value: 12 },
        con: { value: 11 },
        int: { value: 9 },
        wis: { value: 13 },
        cha: { value: 10 }
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
          value: '<p onclick="alert(1)"><strong>Appearance:</strong> Plain coat.</p><p><strong>Speech:</strong> Quiet.</p><p><strong>Motivation:</strong> Keep working.</p><p><strong>Mannerism:</strong> Taps a finger.</p><p><strong>Quirk:</strong> Sorts buttons.</p><p><strong>Rumours:</strong> Knows the miller.</p><p><strong>Secrets:</strong> Hid a letter.</p><p><strong>Relationships:</strong> Trusts Mara.</p><p><strong>Adventure Hook:</strong> Needs help.</p><script>alert(1)</script>',
          public: ""
        }
      },
      traits: { size: "med" }
    },
    items: [
      {
        name: "Mace",
        lookup: "Mace",
        quantity: 1,
        description: "A standard service weapon."
      },
      {
        name: "Worn coin purse",
        lookup: null,
        quantity: 1,
        description: '<p class="coins">Contains 8 cp and 3 sp.</p>'
      }
    ],
    flags: { arbitrary: true }
  };
}

test("AI prompt requests an array by default, including for one NPC", () => {
  const prompt = buildAiPrompt({ count: 1, singleAiObject: false });
  assert.match(prompt, /exactly one JSON array containing 1 Actor object/);
  assert.match(prompt, /root JSON value inside the code block must be an array/);
  assert.match(prompt, /single markdown code block labeled json/);
});

test("AI prompt requests a single object only when explicitly enabled", () => {
  const prompt = buildAiPrompt({ count: 1, singleAiObject: true });
  assert.match(prompt, /exactly one JSON object, not an array/);
  assert.match(prompt, /root JSON value inside the code block must be an object/);
  assert.match(prompt, /indent nested JSON with 2 spaces/);
});

test("AI prompt requires role-fitting inventory, rumours, secrets, relationships, and wealth", () => {
  const prompt = buildAiPrompt({
    count: 3,
    roleLabel: "Acolyte",
    roleEquipmentHint: "holy symbol and devotional possessions",
    wealthLabel: "Poor",
    wealthPrompt: "very little cash",
    tierLabel: "CR 1/4",
    raceLabel: "Human",
    habitatLabel: "Forest Village",
    habitatPrompt: "temperate woodland settlement",
    groupType: "guardPatrol",
    groupTypeLabel: "Guard Patrol",
    groupTypePrompt: "functioning guard patrol",
    groupCohesionLabel: "Functional",
    groupCohesionPrompt: "cooperate reliably",
    groupHierarchyLabel: "Clear chain",
    groupHierarchyPrompt: "clear chain of responsibility",
    relationshipDensityLabel: "Rich",
    relationshipDensityPrompt: "multiple concrete ties",
    internalConflictLabel: "Low",
    internalConflictPrompt: "mild disagreements",
    raceComposition: "mixed",
    raceCompositionLabel: "Mixed races",
    groupRaceLabels: ["Human", "Elf"],
    raceDistribution: "primary",
    raceDistributionLabel: "Primary race",
    raceDistributionPrompt: "about 70% primary race",
    namingStyleGuidance: "settled inland names",
    namingExamples: ["Aldren Voss", "Mira Halden", "Elian Mercer"]
  });
  assert.match(prompt, /Inventory is important/);
  assert.match(prompt, /holy symbol and devotional possessions/);
  assert.match(prompt, /Rumours, Secrets, Relationships/);
  assert.match(prompt, /intentional group/);
  assert.match(prompt, /Wealth: Poor/);
  assert.match(prompt, /lookup to its exact English canonical equipment name/);
  assert.match(prompt, /Creative idiomatic examples: Aldren Voss; Mira Halden; Elian Mercer/);
  assert.match(prompt, /Habitat: Forest Village/);
  assert.match(prompt, /Allowed races: Human, Elf/);
  assert.match(prompt, /Every NPC remains mechanically combatable/);
});

test("AI prompt carries combat readiness and role composition constraints", () => {
  const prompt = buildAiPrompt({
    count: 5,
    role: "merchant",
    roleLabel: "Merchant",
    roleComposition: "variants",
    roleCompositionLabel: "Role variants",
    roleCompositionPrompt: "distribute distinct merchant subtypes",
    roleVariants: ["Market trader", "Traveling peddler", "Cloth merchant", "Grain factor", "Money changer"],
    combatReadiness: "armed",
    combatReadinessLabel: "Highly Prepared",
    combatReadinessPrompt: "maximum realistic preparedness for the role",
    roleCombatGuidance: "merchants remain lightly and discreetly armed at most",
    raceComposition: "dominant",
    raceCompositionLabel: "Strong primary-race majority",
    raceCompositionPrompt: "about 80–90% primary race",
    groupRaceLabels: ["Human", "Elf", "Dwarf"],
    primaryRaceLabel: "Human"
  });
  assert.match(prompt, /Role composition: Role variants/);
  assert.match(prompt, /Available primary-role variants: Market trader, Traveling peddler/);
  assert.match(prompt, /Combat readiness: Highly Prepared/);
  assert.match(prompt, /never justify absurd occupational gear/);
  assert.match(prompt, /8\/1\/1/);
});

test("default import contract rejects a lone object", () => {
  assert.throws(
    () => normalizeNpcJsonPayload(actorSource(), { expectedCount: 1 }),
    /must be an array/
  );
});

test("single-object import mode rejects an array", () => {
  assert.throws(
    () => normalizeNpcJsonPayload([actorSource()], { expectedCount: 1, allowSingleObject: true }),
    /single Actor JSON object is required/
  );
});

test("AI Actor normalization strips unsupported source data, sanitizes biography, and converts inventory requests", () => {
  const [actor] = normalizeNpcJsonPayload([actorSource()], { expectedCount: 1 });
  assert.equal(actor.folder, undefined);
  assert.equal(actor.img, "icons/svg/mystery-man.svg");
  assert.equal(actor.items.length, 2);
  assert.equal(actor.items[0].type, "loot");
  assert.equal(actor.items[0].flags["runyth-npc-button"].canonicalLookup, "Mace");
  assert.equal(actor.items[1].flags["runyth-npc-button"].canonicalLookup, "");
  assert.equal(actor.items[1].system.description.value, "<p>Contains 8 cp and 3 sp.</p>");
  assert.deepEqual(actor.flags, { "runyth-npc-button": { aiImported: true } });
  assert.equal(actor.system.details.biography.value.includes("onclick"), false);
  assert.equal(actor.system.details.biography.value.includes("<script>"), false);
  assert.match(actor.system.details.biography.value, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test("AI inventory rejects invalid quantities", () => {
  const source = actorSource();
  source.items[0].quantity = 0;
  assert.throws(
    () => normalizeNpcJsonPayload([source], { expectedCount: 1 }),
    /quantity must be a number between 1 and 1000/
  );
});

test("clipboard parser tolerates a fenced JSON reply", () => {
  const payload = parseNpcJsonPayload('```json\n[{"name":"Test"}]\n```');
  assert.deepEqual(payload, [{ name: "Test" }]);
});

test("biography sanitizer preserves supported tags and removes attributes", () => {
  assert.equal(
    sanitizeBiographyHtml('<p class="x">Hello <em>there</em><br/></p>'),
    "<p>Hello <em>there</em><br></p>"
  );
});

test("AI import rejects biographies that omit the required Quirk section", () => {
  const source = actorSource();
  source.system.details.biography.value = source.system.details.biography.value.replace(
    '<p><strong>Quirk:</strong> Sorts buttons.</p>',
    ""
  );
  assert.throws(
    () => normalizeNpcJsonPayload([source], { expectedCount: 1 }),
    /must include a labeled Quirk: section/
  );
});

test("AI import rejects an empty inventory", () => {
  const source = actorSource();
  source.items = [];
  assert.throws(
    () => normalizeNpcJsonPayload([source], { expectedCount: 1 }),
    /items must contain at least one inventory entry/
  );
});


test("AI prompt carries weapon variety independently of combat readiness", () => {
  const prompt = buildAiPrompt({
    count: 1,
    combatReadinessLabel: "Prepared",
    combatReadinessPrompt: "above-normal readiness",
    weaponVarietyLabel: "Ranged preference",
    weaponVarietyPrompt: "strongly prefer ranged weapons",
    roleLabel: "Scout"
  });
  assert.match(prompt, /Weapon variety: Ranged preference/);
  assert.match(prompt, /strongly prefer ranged weapons/);
  assert.match(prompt, /Weapon variety never overrides role realism/);
});


test("AI prompt carries exact batch gender composition", () => {
  const prompt = buildAiPrompt({
    count: 10,
    genderComposition: "exact",
    genderCompositionLabel: "Exact numbers",
    genderExactMale: 8,
    genderExactFemale: 2
  });
  assert.match(prompt, /Gender mix: Exact numbers/);
  assert.match(prompt, /exactly 8 male and 2 female NPCs/);
  assert.match(prompt, /Gender, Appearance, Speech/);
});
