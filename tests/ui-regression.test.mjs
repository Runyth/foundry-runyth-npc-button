// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import assert from "node:assert/strict";
import test from "node:test";

import { bindDashboardActionButtons } from "../scripts/ui/dashboard-bindings.mjs";
import { bindNamedControls, bindOptionalControl, namedFormChecked, namedFormControls, namedFormValue } from "../scripts/ui/form-events.mjs";
import { readClipboardText, tryWriteClipboardText, writeClipboardText } from "../scripts/utils/clipboard.mjs";

class FakeControl extends EventTarget {
  constructor({ name = "", type = "text", value = "", checked = false } = {}) {
    super();
    this.name = name;
    this.type = type;
    this.value = value;
    this.checked = checked;
    this.disabled = false;
  }
}

class FakeForm {
  constructor(controls = [], actions = {}) {
    this.controls = controls;
    this.actions = actions;
  }

  querySelectorAll(selector) {
    const match = selector.match(/^\[name="(.+)"\]$/);
    if (!match) return [];
    return this.controls.filter((control) => control.name === match[1]);
  }

  querySelector(selector) {
    return this.actions[selector] ?? this.querySelectorAll(selector)[0] ?? null;
  }
}

test("named form helpers support RadioNodeList-like multiple same-name controls", () => {
  const radios = ["single", "balanced", "primary", "weighted"].map((value, index) => new FakeControl({
    name: "raceComposition",
    type: "radio",
    value,
    checked: index === 0
  }));
  const form = new FakeForm(radios);
  let changes = 0;
  const controller = new AbortController();
  assert.equal(bindNamedControls(form, "raceComposition", "change", () => { changes += 1; }, { signal: controller.signal }), 4);
  assert.equal(namedFormControls(form, "raceComposition").length, 4);
  assert.equal(namedFormValue(form, "raceComposition"), "single");

  radios[0].checked = false;
  radios[2].checked = true;
  radios[2].dispatchEvent(new Event("change"));
  assert.equal(namedFormValue(form, "raceComposition"), "primary");
  assert.equal(changes, 1);
  controller.abort();
});

test("role composition and checkbox values work for single and grouped controls", () => {
  const roleRadios = [
    new FakeControl({ name: "roleComposition", type: "radio", value: "groupPreset", checked: false }),
    new FakeControl({ name: "roleComposition", type: "radio", value: "balanced", checked: true })
  ];
  const openActor = new FakeControl({ name: "openLastActor", type: "checkbox", value: "on", checked: true });
  const form = new FakeForm([...roleRadios, openActor]);
  assert.equal(namedFormValue(form, "roleComposition"), "balanced");
  assert.equal(namedFormChecked(form, "openLastActor"), true);
  assert.equal(namedFormValue(form, "missing", "fallback"), "fallback");
});

test("missing optional controls never crash binding", () => {
  const form = new FakeForm();
  assert.equal(bindNamedControls(form, "missing", "change", () => {}), 0);
  assert.equal(bindOptionalControl(form, '[data-action="missing"]', "click", () => {}), false);
});

test("dashboard action buttons remain live after grouped controls are bound", () => {
  const raceRadios = ["single", "balanced", "primary"].map((value, index) => new FakeControl({
    name: "raceComposition",
    type: "radio",
    value,
    checked: index === 0
  }));
  const copy = new FakeControl();
  const create = new FakeControl();
  const importNpc = new FakeControl();
  const form = new FakeForm(raceRadios, {
    '[data-action="copy-prompt"]': copy,
    '[data-action="create-local"]': create,
    '[data-action="import-npc"]': importNpc
  });
  const controller = new AbortController();
  bindNamedControls(form, "raceComposition", "change", () => {}, { signal: controller.signal });
  let copied = 0;
  let created = 0;
  let imported = 0;
  const bound = bindDashboardActionButtons(form, {
    copyPrompt: () => { copied += 1; },
    create: () => { created += 1; },
    importNpc: () => { imported += 1; }
  }, controller.signal);
  assert.deepEqual(bound, { create: true, copyPrompt: true, importNpc: true });
  copy.dispatchEvent(new Event("click"));
  create.dispatchEvent(new Event("click"));
  importNpc.dispatchEvent(new Event("click"));
  assert.deepEqual({ copied, created, imported }, { copied: 1, created: 1, imported: 1 });
  controller.abort();
});

test("aborting the previous render prevents duplicate action firing after rerender", () => {
  const copy = new FakeControl();
  const form = new FakeForm([], { '[data-action="copy-prompt"]': copy });
  let fired = 0;
  const first = new AbortController();
  bindDashboardActionButtons(form, { copyPrompt: () => { fired += 100; } }, first.signal);
  first.abort();
  const second = new AbortController();
  bindDashboardActionButtons(form, { copyPrompt: () => { fired += 1; } }, second.signal);
  copy.dispatchEvent(new Event("click"));
  assert.equal(fired, 1);
  second.abort();
});

test("repeated composition changes fire once each and survive keyboard-style change events", () => {
  const radios = ["single", "balanced", "primary", "dominant", "weighted"].map((value, index) => new FakeControl({
    name: "raceComposition",
    type: "radio",
    value,
    checked: index === 0
  }));
  const form = new FakeForm(radios);
  const controller = new AbortController();
  const seen = [];
  bindNamedControls(form, "raceComposition", "change", () => seen.push(namedFormValue(form, "raceComposition")), { signal: controller.signal });
  for (let index = 1; index < radios.length; index += 1) {
    for (const radio of radios) radio.checked = false;
    radios[index].checked = true;
    radios[index].dispatchEvent(new Event("change"));
  }
  assert.deepEqual(seen, ["balanced", "primary", "dominant", "weighted"]);
  controller.abort();
});

test("clipboard writer uses Foundry clipboard when available", async () => {
  let copied = "";
  await writeClipboardText("prompt", {
    gameRef: { clipboard: { copyPlainText(value) { copied = value; } } },
    navigatorRef: {}
  });
  assert.equal(copied, "prompt");
});

test("clipboard writer falls back to browser clipboard when Foundry copy throws", async () => {
  let copied = "";
  await writeClipboardText("prompt", {
    gameRef: { clipboard: { copyPlainText() { throw new Error("primary failed"); } } },
    navigatorRef: { clipboard: { async writeText(value) { copied = value; } } }
  });
  assert.equal(copied, "prompt");
});

test("clipboard reader returns browser clipboard text", async () => {
  const value = await readClipboardText({ navigatorRef: { clipboard: { async readText() { return "json"; } } } });
  assert.equal(value, "json");
});

test("best-effort clipboard writer isolates unfocused and permission failures", async () => {
  let foundryCalls = 0;
  let browserCalls = 0;
  const notAllowed = Object.assign(new Error("Document is not focused"), { name: "NotAllowedError" });
  const result = await tryWriteClipboardText("prepared prompt", {
    gameRef: { clipboard: { copyPlainText() { foundryCalls += 1; throw notAllowed; } } },
    navigatorRef: { clipboard: { async writeText() { browserCalls += 1; throw notAllowed; } } }
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.name, "NotAllowedError");
  assert.equal(foundryCalls, 1);
  assert.equal(browserCalls, 1);
});

test("best-effort clipboard writer reports unavailable API without throwing", async () => {
  const result = await tryWriteClipboardText("prepared prompt", { gameRef: {}, navigatorRef: {} });
  assert.equal(result.ok, false);
  assert.match(result.error.message, /not available/i);
});

test("dashboard preserves prepared prompt and treats clipboard failure as a warning path", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../scripts/ui/npc-dashboard.mjs", import.meta.url), "utf8");
  assert.match(source, /this\.#lastPreparedPrompt = prompt/);
  assert.match(source, /tryWriteClipboardText\(prompt\)/);
  assert.match(source, /notifications\.promptCopyManual/);
  assert.match(source, /data-prompt-output/);
  assert.doesNotMatch(source, /await writeClipboardText\(prompt\)/);
});

test("runtime clipboard fallbacks never use deprecated execCommand", async () => {
  const { readFile } = await import("node:fs/promises");
  const sources = await Promise.all([
    "../scripts/utils/clipboard.mjs",
    "../scripts/ui/manual-copy.mjs",
    "../scripts/ui/actor-portrait-button.mjs",
    "../scripts/filters.mjs"
  ].map((file) => readFile(new URL(file, import.meta.url), "utf8")));
  assert.equal(sources.some((source) => source.includes("execCommand")), false);
});


test("multi-picker selection updates do not reset the virtual viewport", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("../scripts/ui/hierarchical-multi-picker.mjs", import.meta.url), "utf8"));
  const toggleBody = source.match(/function toggleRow\(row, button = null\) \{([\s\S]*?)\n  \}/)?.[1] ?? "";
  assert.equal(toggleBody.includes("updateActiveRows"), false);
  assert.equal(toggleBody.includes("updateRenderedOption"), true);
  assert.match(source, /if \(resetScroll\) viewport\.scrollTop = 0/);
  assert.match(source, /updateActiveRows\(\{ resetScroll: true \}\)/);
});


test("all runtime clipboard write surfaces use the best-effort isolation path", async () => {
  const { readFile } = await import("node:fs/promises");
  for (const file of [
    "../scripts/ui/npc-dashboard.mjs",
    "../scripts/ui/actor-portrait-button.mjs",
    "../scripts/filters.mjs",
    "../scripts/ui/manual-copy.mjs"
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /tryWriteClipboardText/);
    assert.doesNotMatch(source, /import\s*\{[^}]*\bwriteClipboardText\b[^}]*\}/);
  }
});

test("dashboard exposes native token disposition control and imports apply it before Actor creation", async () => {
  const { readFile } = await import("node:fs/promises");
  const [dashboardSource, serviceSource] = await Promise.all([
    readFile(new URL("../scripts/ui/npc-dashboard.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/services/actor-service.mjs", import.meta.url), "utf8")
  ]);
  assert.match(dashboardSource, /choiceChips\("tokenDisposition", TOKEN_DISPOSITION_MODES/);
  assert.match(dashboardSource, /tokenDisposition:\s*namedFormValue\(form, "tokenDisposition"/);
  assert.match(serviceSource, /applyTokenDispositionToActorSource/);
  assert.match(serviceSource, /preparedSources = actorSources\.map/);
});
