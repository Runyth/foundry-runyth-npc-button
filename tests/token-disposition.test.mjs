import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_OPTIONS } from "../scripts/constants.mjs";
import { buildActorSource, createSeededRandom, generateNpcBlueprint } from "../scripts/generator/npc-generator.mjs";
import { applyTokenDispositionToActorSource, resolveTokenDisposition, TOKEN_DISPOSITION_MODES } from "../scripts/token-disposition.mjs";

test("token disposition exposes every native Foundry state plus no-override default", () => {
  assert.deepEqual(Object.keys(TOKEN_DISPOSITION_MODES), ["default", "friendly", "neutral", "hostile", "secret"]);
  assert.equal(DEFAULT_OPTIONS.tokenDisposition, "default");
  assert.equal(resolveTokenDisposition("friendly"), 1);
  assert.equal(resolveTokenDisposition("neutral"), 0);
  assert.equal(resolveTokenDisposition("hostile"), -1);
  assert.equal(resolveTokenDisposition("secret"), -2);
  assert.equal(resolveTokenDisposition("default"), null);
});

test("native Foundry disposition constants are honored when present", () => {
  const previous = globalThis.CONST;
  globalThis.CONST = { TOKEN_DISPOSITIONS: { FRIENDLY: 11, NEUTRAL: 12, HOSTILE: 13, SECRET: 14 } };
  try {
    assert.equal(resolveTokenDisposition("friendly"), 11);
    assert.equal(resolveTokenDisposition("neutral"), 12);
    assert.equal(resolveTokenDisposition("hostile"), 13);
    assert.equal(resolveTokenDisposition("secret"), 14);
  } finally {
    if (previous === undefined) delete globalThis.CONST;
    else globalThis.CONST = previous;
  }
});

test("Foundry default leaves an Actor source untouched", () => {
  const source = { name: "Unchanged", prototypeToken: { actorLink: false }, flags: {} };
  assert.equal(applyTokenDispositionToActorSource(source, "default"), source);
  assert.deepEqual(source.prototypeToken, { actorLink: false });
});

test("explicit disposition merges safely into existing prototype token data", () => {
  const source = {
    name: "Guard",
    prototypeToken: { actorLink: true, displayName: 20 },
    flags: { other: { preserved: true }, "runyth-npc-button": { generated: true } }
  };
  const result = applyTokenDispositionToActorSource(source, "friendly");
  assert.notEqual(result, source);
  assert.deepEqual(result.prototypeToken, { actorLink: true, displayName: 20, disposition: 1 });
  assert.equal(result.flags.other.preserved, true);
  assert.equal(result.flags["runyth-npc-button"].generated, true);
  assert.equal(result.flags["runyth-npc-button"].tokenDisposition, "friendly");
  assert.equal(source.prototypeToken.disposition, undefined);
});

test("locally generated Actor sources apply selected prototype token disposition", () => {
  const blueprint = generateNpcBlueprint({
    role: "guard",
    species: "human",
    namingStyle: "central",
    wealth: "average",
    tokenDisposition: "hostile"
  }, createSeededRandom("disposition-test"));
  const source = buildActorSource(blueprint);
  assert.equal(blueprint.tokenDisposition, "hostile");
  assert.equal(source.prototypeToken.disposition, -1);
  assert.equal(source.flags["runyth-npc-button"].tokenDisposition, "hostile");
});

test("AI-import Actor creation applies the dashboard disposition after preview/normalization", async () => {
  const { createImportedNpcActors } = await import("../scripts/services/actor-service.mjs");
  const previous = {
    game: globalThis.game,
    Actor: globalThis.Actor,
    Hooks: globalThis.Hooks
  };
  let captured = null;
  globalThis.game = {
    user: { isGM: true },
    system: { id: "dnd5e" },
    settings: {
      get(_moduleId, setting) {
        if (setting === "maxBatchSize") return 25;
        return "";
      }
    },
    packs: new Map()
  };
  globalThis.Actor = {
    implementation: {
      async createDocuments(sources) {
        captured = sources;
        return sources;
      }
    }
  };
  globalThis.Hooks = { callAll() {} };
  try {
    const input = [{ name: "Imported NPC", type: "npc", items: [], flags: {} }];
    await createImportedNpcActors(input, { useActorRoot: true, tokenDisposition: "secret" });
    assert.equal(captured.length, 1);
    assert.equal(captured[0].prototypeToken.disposition, -2);
    assert.equal(captured[0].flags["runyth-npc-button"].tokenDisposition, "secret");
  } finally {
    if (previous.game === undefined) delete globalThis.game;
    else globalThis.game = previous.game;
    if (previous.Actor === undefined) delete globalThis.Actor;
    else globalThis.Actor = previous.Actor;
    if (previous.Hooks === undefined) delete globalThis.Hooks;
    else globalThis.Hooks = previous.Hooks;
  }
});
