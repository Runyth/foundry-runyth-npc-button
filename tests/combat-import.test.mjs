import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseAndNormalizeNpcJson } from "../scripts/ai/npc-json.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const encounter = fs.readFileSync(path.join(root, "docs/examples/bree-bunch-12-npcs.json"), "utf8");
const actors = parseAndNormalizeNpcJson(encounter, { expectedCount: 12 });
const activities = (actor) => actor.items.flatMap(item => Object.values(item.system.activities ?? {}));
const weapon = (actor, name) => actor.items.find(i => i.type === "weapon" && i.name === name);
const action = (actor, name) => activities(actor).find(a => a.name === name);

test("encounter comprises eight distinct humans and four boars, no hounds", () => {
  assert.equal(actors.length, 12);
  assert.equal(actors.filter(a => a.system.details.type.value === "beast").length, 4);
  assert.equal(actors.filter(a => a.system.details.type.value === "humanoid").length, 8);
  assert.equal(new Set(actors.map(a => a.name)).size, 12);
  assert.equal(actors.filter(a => /hound/i.test(a.name)).length, 0);
});

test("every NPC has a native, equipped weapon with an attack and a typed damage roll", () => {
  for (const actor of actors) {
    const weapons = actor.items.filter(i => i.type === "weapon");
    assert.ok(weapons.length, `${actor.name} has no weapons`);
    for (const item of weapons) {
      assert.equal(item.system.equipped, true, `${actor.name}: ${item.name} unequipped`);
      const attacks = Object.values(item.system.activities).filter(a => a.type === "attack");
      assert.ok(attacks.length, `${actor.name}: ${item.name} has no attack`);
      for (const attack of attacks) {
        assert.equal(attack.attack.flat, true);
        assert.match(attack.attack.bonus, /^-?\d+$/);
        assert.equal(attack.damage.includeBase, false);
        assert.equal(attack.damage.parts.length, 1);
        const part = attack.damage.parts[0];
        assert.ok(part.custom.enabled);
        assert.match(part.custom.formula, /^(?:\d+d\d+(?:[+\-]\d+)?|\d+)$/);
        assert.ok(part.types.length);
      }
    }
  }
});

test("boars have correct resistances, vulnerability, tusk attacks, speed, and charge saves", () => {
  for (const boar of actors.filter(a => a.system.details.type.value === "beast")) {
    assert.deepEqual(boar.system.traits.dr.value, ["bludgeoning", "slashing"]);
    assert.deepEqual(boar.system.traits.dv.value, ["piercing"]);
    assert.equal(boar.system.attributes.movement.walk, 40);
    assert.equal(boar.system.attributes.hp.max, 26);
    const tusks = weapon(boar, "Tusks");
    assert.ok(tusks);
    assert.equal(tusks.system.type.value, "natural");
    assert.equal(Object.values(tusks.system.activities).length, 2);
    assert.equal(action(boar, "Tusks").damage.parts[0].custom.formula, "1d8+3");
    assert.equal(action(boar, "Goring Charge").damage.parts[0].custom.formula, "2d8+3");
    assert.equal(action(boar, "Tusks").attack.bonus, "5");
    assert.equal(action(boar, "Charge Knockdown").save.dc.formula, "13");
    assert.equal(action(boar, "Charge Knockdown").damage.onSave, "none");
  }
});

test("Sachem has usable attack, healing, commands and protective reaction", () => {
  const sachem = actors[0];
  assert.equal(action(sachem, "Boar Axe").attack.bonus, "5");
  assert.equal(action(sachem, "Rally the Wounded").healing.custom.formula, "1d6+3");
  assert.equal(action(sachem, "Rally the Wounded").type, "heal");
  assert.equal(action(sachem, "Hold Fast!").roll.formula, "1d8+2");
  assert.ok(action(sachem, "Boar's Command"));
  assert.equal(sachem.system.abilities.str.proficient, 1);
  assert.equal(sachem.system.skills.ath.value, 1);
});

test("warrior has native cone damage and knockback; builder has native trap saves", () => {
  for (const warrior of actors.slice(1,3)) {
    const sweep = action(warrior, "Brutal Sweep");
    assert.equal(sweep.type, "save");
    assert.equal(sweep.save.dc.formula, "13");
    assert.equal(sweep.damage.parts[0].custom.formula, "2d6+3");
    assert.equal(sweep.target.template.type, "cone");
    assert.equal(sweep.target.template.size, 10);
    assert.ok(action(warrior, "Boar's Rush — Knockback"));
  }
  for (const builder of actors.slice(5,7)) {
    assert.equal(action(builder, "Collapse the Timber").damage.parts[0].custom.formula, "2d6");
    assert.equal(action(builder, "Collapse the Timber").target.template.size, 10);
    assert.equal(action(builder, "Rig Tripwire").damage.onSave, "none");
    assert.equal(action(builder, "Hook Pole").attack.bonus, "4");
  }
});

test("alternative dagger & longbow attacks group on one weapon with correct range", () => {
  for (const scout of actors.slice(3,5)) {
    const item = weapon(scout, "Dagger");
    assert.equal(item.system.quantity, 3);
    assert.equal(Object.values(item.system.activities).length, 2);
    assert.equal(action(scout, "Dagger (Thrown)").range.value, 20);
    assert.equal(action(scout, "Dagger (Thrown)").attack.type.value, "ranged");
  }
  const hunter = actors[7];
  assert.equal(Object.values(weapon(hunter, "Longbow").system.activities).length, 2);
  assert.equal(action(hunter, "Pinning Arrow").range.value, 150);
});

test("unknown fields are not passed through and invalid combat data is rejected", () => {
  const payload = JSON.parse(encounter);
  payload[0].combat.actions[0].attack.toHit = "hello";
  assert.throws(() => parseAndNormalizeNpcJson(JSON.stringify(payload), { expectedCount: 12 }), /attack.toHit/);
  const payload2 = JSON.parse(encounter);
  payload2[8].combat.resistances.push("plasma");
  assert.throws(() => parseAndNormalizeNpcJson(JSON.stringify(payload2)), /resistances/);
});
