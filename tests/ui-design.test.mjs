import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../styles/runyth-npc-button.css", import.meta.url), "utf8");
const dashboard = await readFile(new URL("../scripts/ui/npc-dashboard.mjs", import.meta.url), "utf8");

test("feature visual system provides scoped theme tokens and distinct dashboard surfaces", () => {
  assert.match(css, /--rnb-accent:/);
  assert.match(css, /--rnb-surface-1:/);
  assert.match(css, /--rnb-border:/);
  assert.match(css, /\.runyth-npc-button__section--generation/);
  assert.match(css, /\.runyth-npc-button__section--composition/);
  assert.match(css, /\.runyth-npc-button__section--group/);
  assert.match(css, /\.runyth-npc-button__section--destination/);
  assert.match(css, /\.runyth-npc-button__section--ai/);
  assert.match(dashboard, /runyth-npc-button__section--generation/);
  assert.match(dashboard, /runyth-npc-button__section--destination/);
});

test("cosmetic layer avoids expensive or layout-janking animation patterns", () => {
  assert.doesNotMatch(css, /@keyframes\b/i);
  assert.doesNotMatch(css, /\banimation\s*:/i);
  assert.doesNotMatch(css, /backdrop-filter\s*:/i);
  assert.doesNotMatch(css, /filter\s*:\s*(?:blur|drop-shadow)\b/i);
  assert.doesNotMatch(css, /transition\s*:\s*all\b/i);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
});

test("large scrolling and virtualized UI surfaces retain containment and stable scroll ergonomics", () => {
  assert.match(css, /\.runyth-npc-button__picker-viewport[\s\S]*?contain:\s*layout paint style;/);
  assert.match(css, /scrollbar-gutter:\s*stable;/);
  assert.match(css, /overscroll-behavior:\s*contain;/);
  assert.match(css, /\.runyth-npc-button__filter-profile-toolbar[\s\S]*?position:\s*sticky;/);
  assert.match(css, /\.runyth-npc-button__footer[\s\S]*?position:\s*sticky;/);
});

test("visual overhaul preserves responsive and accessibility states", () => {
  assert.match(css, /button:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*780px\)/);
  assert.match(css, /@media\s*\(max-width:\s*560px\)/);
  assert.match(css, /\.runyth-npc-button__preview-layout/);
  assert.match(css, /\.runyth-npc-button__filters-fieldset/);
  assert.match(css, /\.runyth-npc-button__help section/);
});



test("cosmetic feature release preserves dashboard action and field contracts", () => {
  for (const action of ["create-local", "copy-prompt", "import-npc"]) {
    assert.match(dashboard, new RegExp(`data-action=["']${action}["']`));
  }
  for (const pickerName of ["groupType", "habitat", "role", "raceSelection", "namingStyle", "groupRaces", "groupRoles", "destinationSelection"]) {
    assert.ok(dashboard.includes(`name: "${pickerName}"`), `missing picker field contract: ${pickerName}`);
  }
  for (const chipName of ["wealth", "combatReadiness", "weaponVariety", "raceComposition", "roleComposition"]) {
    assert.ok(dashboard.includes(`choiceChips("${chipName}"`), `missing choice field contract: ${chipName}`);
  }
  for (const directName of ["count", "openLastActor", "previewImport", "aiPayload"]) {
    assert.ok(dashboard.includes(`name="${directName}"`), `missing direct field contract: ${directName}`);
  }
});


test("dashboard removes single-object mode and exposes scalable exact Race quotas", () => {
  assert.doesNotMatch(dashboard, /name="singleAiObject"/);
  assert.match(dashboard, /name:\s*"raceExactCounts"/);
  assert.match(dashboard, /data-virtual-quota-editor="runyth-npc-button-race-exact-counts"/);
  assert.match(dashboard, /mountVirtualQuotaEditor/);
});

test("role mix UX exposes primary role, live allocation preview, and zero-safe weight entry", () => {
  assert.match(dashboard, /data-primary-role-note/);
  assert.match(dashboard, /data-role-mix-preview/);
  assert.match(dashboard, /min="0"[^>]*data-role-weight/);
  assert.match(dashboard, /event\.target\?\.matches\?\.\("\[data-role-weight\]"\)/);
  assert.match(dashboard, /event\.stopPropagation\(\)/);
});


test("help documents every role composition mode with concrete distribution examples", async () => {
  const { readFile } = await import("node:fs/promises");
  const helpSource = await readFile(new URL("../scripts/ui/npc-help.mjs", import.meta.url), "utf8");
  const english = JSON.parse(await readFile(new URL("../lang/en.json", import.meta.url), "utf8"))["runyth-npc-button"].help;
  for (const mode of ["single", "variants", "groupPreset", "balanced", "primary", "dominant", "weighted"]) {
    assert.equal(typeof english.roleMixModes[mode], "string");
    assert.equal(typeof english.roleMixExamples[mode], "string");
  }
  assert.match(helpSource, /roleMixRows/);
  assert.match(english.roleMixWeights, /10\/20\/30/);
  assert.match(english.roleMixWeights, /0 excludes/);
});

test("help presents composition and comparable controls as structured tables", async () => {
  const { readFile } = await import("node:fs/promises");
  const helpSource = await readFile(new URL("../scripts/ui/npc-help.mjs", import.meta.url), "utf8");
  const english = JSON.parse(await readFile(new URL("../lang/en.json", import.meta.url), "utf8"))["runyth-npc-button"].help;

  for (const mode of ["single", "dominant", "primary", "balanced", "weighted", "exact"]) {
    assert.equal(typeof english.raceMixModes[mode], "string");
    assert.equal(typeof english.raceMixExamples[mode], "string");
  }

  for (const mode of ["weaponless", "minimal", "standard", "prepared", "armed"]) {
    assert.equal(typeof english.combatReadinessModes[mode], "string");
    assert.equal(typeof english.combatReadinessExamples[mode], "string");
  }

  for (const mode of ["meleeOnly", "meleePreferred", "mixed", "rangedPreferred", "rangedOnly"]) {
    assert.equal(typeof english.weaponVarietyModes[mode], "string");
    assert.equal(typeof english.weaponVarietyExamples[mode], "string");
  }

  for (const tableRows of ["generationRows", "raceMixRows", "roleMixRows", "combatRows", "weaponRows", "filterRows", "previewRows", "aiRows"]) {
    assert.match(helpSource, new RegExp(`\\b${tableRows}\\b`));
  }
  assert.match(helpSource, /runyth-npc-button__help-table-wrap/);
  assert.match(english.raceMixWeights, /10\/20\/30/);
});
