import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseAndNormalizeNpcJson } from "../scripts/ai/npc-json.mjs";
import { interceptRelentless } from "../scripts/services/relentless.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const text = fs.readFileSync(path.join(root, "docs/examples/bree-bunch-native-activities-12-npcs.json"), "utf8");
const payload = JSON.parse(text);
const normalize = (p) => parseAndNormalizeNpcJson(JSON.stringify(p), { expectedCount: 12 });
const actors = normalize(payload);
const activities = (actor) => actor.items.flatMap(i => Object.values(i.system?.activities ?? {}));
const feature = (actor, name) => actor.items.find(i => Object.values(i.system?.activities ?? {}).some(a => a.name === name));
const actorOf = (name) => actors.find(a => a.name.includes(name));
const activityOf = (actor,name) => activities(actor).find(a => a.name === name);

test("Midi example imports exactly twelve distinct actors with four marked boars", () => {
  assert.equal(actors.length,12);
  assert.equal(new Set(actors.map(x => x.name)).size,12);
  assert.equal(actors.filter(x => x.flags["runyth-npc-button"].relentlessOnce).length,4);
});
test("all twelve actors have at least one equipped native Attack item", () => {
  for (const actor of actors) {
    assert.ok(actor.items.some(i => i.type === "weapon" && i.system.equipped && Object.values(i.system.activities).some(a => a.type === "attack")),actor.name);
  }
});
test("Sachem Command Advantage survives normalization as activity-linked DAE effect", () => {
  const item=feature(actors[0],"Boar's Command");
  const activity=activityOf(actors[0],"Boar's Command");
  assert.equal(activity.target.affects.count,"2");
  assert.equal(activity.effects.length,1);
  const eff=item.effects.find(e=>e._id===activity.effects[0]._id);
  assert.deepEqual(eff.flags.dae.specialDuration,["1Attack"]);
  assert.equal(eff.changes[0].key,"flags.midi-qol.advantage.attack.all");
  assert.equal(eff.changes[0].mode,0);
});
test("Reckless Swing self advantage and target exposure are two distinct effects",()=>{
  const actor=actorOf("Haldric"); const activity=activityOf(actor,"Reckless Swing");
  assert.equal(activity.target.affects.type,"self");
  const item=feature(actor,"Reckless Swing");
  const keys=item.effects.map(e=>e.changes[0].key);
  assert.deepEqual(keys,["flags.midi-qol.advantage.attack.all","flags.midi-qol.grants.advantage.attack.all"]);
});
test("Pinning Arrow applies a temporary non-permanent speed effect on hit",()=>{
  const actor=actorOf("Oskar"); const item=feature(actor,"Pinning Arrow");
  const activity=activityOf(actor,"Pinning Arrow");
  const effect=item.effects.find(e=>e._id===activity.effects[0]._id);
  assert.equal(effect.changes[0].key,"system.attributes.movement.walk");
  assert.equal(effect.changes[0].mode,2);
  assert.equal(effect.changes[0].value,"-10");
  assert.equal(effect.duration.rounds,1);
});
test("D&D 5e damage traits are retained with equipped boar tusks",()=>{
  for(const actor of actors.filter(x=>x.flags["runyth-npc-button"].relentlessOnce)){
    assert.deepEqual(actor.system.traits.dr.value,["bludgeoning","slashing"]);
    assert.deepEqual(actor.system.traits.dv.value,["piercing"]);
    const tusks=actor.items.find(i=>i.name==="Tusks");
    assert.ok(tusks?.system.equipped);
    assert.ok(Object.values(tusks.system.activities).some(a=>a.type==="attack" && a.damage.parts[0].types.includes("piercing")));
  }
});
test("untrusted injected Midi paths, mode, condition, macro, and script are rejected",()=>{
  const cases=[
    (p)=>p[0].combat.actions[4].midi.effects[0].changes[0].key="flags.someOtherModule.script",
    (p)=>p[0].combat.actions[4].midi.effects[0].changes[0].value="eval('bad')",
    (p)=>p[0].combat.actions[4].midi.effects[0].changes[0].mode="OVERRIDE",
    (p)=>p[0].combat.actions[4].midi.effects[0].specialDuration=["executeMacro"],
    (p)=>p[0].combat.actions[4].midi.macro="maliciousCode()",
    (p)=>p[0].combat.actions[4].midi.effects[0].statuses=["uncontrolled"]
  ];
  for(const fn of cases){const clone=structuredClone(payload);fn(clone);assert.throws(()=>normalize(clone));}
});
test("Relentless triggers at 0 HP after a non-massive hit and consumes once",()=>{
  let spent=false;
  const actor={system:{attributes:{hp:{value:8,max:26,temp:0}}},getFlag:(_m,k)=> k==="relentlessOnce" ? true : spent};
  const updates={"system.attributes.hp.value":0};
  interceptRelentless(actor,10,updates);
  assert.equal(updates["system.attributes.hp.value"],1);
  assert.equal(updates["flags.runyth-npc-button.relentlessSpent"],true);
  spent=true;
  const again={"system.attributes.hp.value":0};
  interceptRelentless(actor,12,again);
  assert.equal(again["system.attributes.hp.value"],0);
});
test("Relentless excludes massive damage, zero old HP, temp damage and irrelevant actors",()=>{
  const fake=(value,max=26,temp=0,enabled=true)=>({system:{attributes:{hp:{value,max,temp}}},getFlag:(_m,k)=>k==="relentlessOnce"&&enabled});
  for(const [actor,amount] of [[fake(5),31],[fake(0),5],[fake(5,26,0,false),12]]){
    const up={"system.attributes.hp.value":0};interceptRelentless(actor,amount,up);assert.equal(up["system.attributes.hp.value"],0);
  }
  const notZero={"system.attributes.hp.value":5};interceptRelentless(fake(5,26,10),5,notZero);
  assert.equal(notZero["system.attributes.hp.value"],5);
});
test("No giant out-of-range or unsupported numeric native effect modifiers",()=>{
  const modified=structuredClone(payload);
  modified[10].combat.actions[3].midi.effects[0].changes[0].value="900000000";
  assert.throws(()=>normalize(modified),/must be a boolean|integer native modifier/);
});
