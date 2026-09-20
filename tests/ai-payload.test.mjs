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
          value: '<p onclick="alert(1)"><strong>Appearance:</strong> Plain coat.</p><script>alert(1)</script>',
          public: ""
        }
      },
      traits: { size: "med" }
    },
    items: [{ name: "Untrusted item" }],
    flags: { arbitrary: true }
  };
}

test("AI prompt requests an array by default, including for one NPC", () => {
  const prompt = buildAiPrompt({ count: 1, singleAiObject: false });
  assert.match(prompt, /exactly one JSON array containing 1 Actor object/);
  assert.match(prompt, /root JSON value must be an array/);
});

test("AI prompt requests a single object only when explicitly enabled", () => {
  const prompt = buildAiPrompt({ count: 1, singleAiObject: true });
  assert.match(prompt, /exactly one JSON object, not an array/);
  assert.match(prompt, /root JSON value must be an object/);
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

test("AI Actor normalization strips unsupported source data and sanitizes biography HTML", () => {
  const [actor] = normalizeNpcJsonPayload([actorSource()], { expectedCount: 1 });
  assert.equal(actor.folder, undefined);
  assert.equal(actor.img, "icons/svg/mystery-man.svg");
  assert.deepEqual(actor.items, []);
  assert.deepEqual(actor.flags, { "runyth-npc-button": { aiImported: true } });
  assert.equal(actor.system.details.biography.value.includes("onclick"), false);
  assert.equal(actor.system.details.biography.value.includes("<script>"), false);
  assert.match(actor.system.details.biography.value, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
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
