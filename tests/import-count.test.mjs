import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { buildNpcImportPlan, countNpcPayloadEntries } from "../scripts/ai/import-plan.mjs";
import { selectedPreviewPayload } from "../scripts/ui/npc-import-preview.mjs";

test("NPC payload counting uses only top-level Actor entries", () => {
  const payload = Array.from({ length: 20 }, (_, index) => ({
    name: `NPC ${index + 1}`,
    items: [{ name: "Nested item" }, { name: "Second nested item" }],
    nested: { arrays: [[1, 2, 3]] }
  }));
  assert.equal(countNpcPayloadEntries(payload), 20);
  assert.equal(countNpcPayloadEntries({ name: "Single NPC" }), 1);
  assert.equal(countNpcPayloadEntries(null), 0);
});

test("a 21-versus-20 mismatch automatically enters preview instead of failing", () => {
  const plan = buildNpcImportPlan({
    actualCount: 21,
    expectedCount: 20,
    maxBatch: 25,
    previewRequested: false,
    ignoreCountMismatch: false
  });
  assert.equal(plan.mismatch, true);
  assert.equal(plan.previewRequired, true);
  assert.equal(plan.autoPreview, true);
  assert.equal(plan.actualCount, 21);
  assert.equal(plan.expectedCount, 20);
  assert.equal("expectedCount" in plan.finalValidationOptions, false);
});

test("global count-agnostic mode allows a different safe array length without forced preview", () => {
  const plan = buildNpcImportPlan({
    actualCount: 21,
    expectedCount: 20,
    maxBatch: 25,
    previewRequested: false,
    ignoreCountMismatch: true
  });
  assert.equal(plan.mismatch, true);
  assert.equal(plan.previewRequired, false);
  assert.equal(plan.autoPreview, false);
});

test("configured maximum always forces review even when count mismatches are ignored", () => {
  const plan = buildNpcImportPlan({
    actualCount: 26,
    expectedCount: 25,
    maxBatch: 25,
    previewRequested: false,
    ignoreCountMismatch: true
  });
  assert.equal(plan.exceedsMaximum, true);
  assert.equal(plan.previewRequired, true);
  assert.equal(plan.autoPreview, true);
});

test("preview selection can reduce a 21-entry payload to the requested first 20", () => {
  const payload = Array.from({ length: 21 }, (_, index) => ({ name: `NPC ${index + 1}` }));
  const selected = selectedPreviewPayload(payload, new Set(Array.from({ length: 20 }, (_, index) => index)));
  assert.equal(selected.length, 20);
  assert.equal(selected[0].name, "NPC 1");
  assert.equal(selected.at(-1).name, "NPC 20");
  assert.equal(payload.length, 21);
});

test("dashboard import flow uses the centralized count plan and count setting", async () => {
  const [dashboard, settings] = await Promise.all([
    readFile(new URL("../scripts/ui/npc-dashboard.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/settings.mjs", import.meta.url), "utf8")
  ]);
  assert.match(dashboard, /buildNpcImportPlan/);
  assert.match(dashboard, /countNpcPayloadEntries/);
  assert.match(dashboard, /IGNORE_IMPORT_COUNT_MISMATCH/);
  assert.match(settings, /SETTINGS\.IGNORE_IMPORT_COUNT_MISMATCH/);
});
