// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
// Source notice, licence, and publication hygiene for Runyth NPC Button.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = (name) => path.join(root, name);
const read = (name) => readFileSync(repo(name), "utf8");

function everyProgramFile(directory, extensions) {
  const rows = readdirSync(repo(directory), { withFileTypes: true });
  const files = [];
  for (const row of rows) {
    const absolute = path.join(repo(directory), row.name);
    if (row.isDirectory()) files.push(...everyProgramFile(`${directory}/${row.name}`, extensions));
    else if (extensions.some((value) => row.name.endsWith(value))) files.push(`${directory}/${row.name}`);
  }
  return files;
}

const programFiles = [
  ...everyProgramFile("scripts", [".mjs"]),
  ...everyProgramFile("dev", [".mjs"]),
  ...everyProgramFile("tests", [".mjs"])
];

test("every program file starts with the standard two-line source notice", () => {
  assert.ok(programFiles.length > 50);
  const holder = ["// SPDX-License-Identifier: AGPL-3.0-or-later", "// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations."];
  const holderFragment = ["// Copyright (C) 2026 Daniel ", "Brani", "ewski. See the LICENSE file for rights and obligations."].join("");
  for (const file of programFiles) {
    const lines = read(file).split("\n");
    assert.deepEqual(lines.slice(0, 2), holder, `${file} carries the source notice`);
    assert.ok(lines[1].startsWith(holderFragment), `${file} notice holder`);
  }
});

test("the LICENSE file is the full GNU Affero General Public License v3 without a personal holder line", () => {
  const licence = read("LICENSE");
  assert.match(licence, /GNU AFFERO GENERAL PUBLIC LICENSE/);
  assert.match(licence, /Version 3, 19 November 2007/);
  assert.ok(licence.length > 30000);
  const probe = ["Aki", "to"].join(""); assert.ok(!licence.includes(probe));
});

test("the README quotes the standard licence chapter", () => {
  const readme = read("README.md");
  const holderLine = ["Copyright © 2026  [Daniel ", "Brani", "ewski](https://brani.dev/)"].join("");
  assert.ok(readme.includes("## Licence"));
  assert.ok(readme.includes(holderLine));
  assert.ok(readme.includes("This program is free software: you can redistribute it and/or modify"));
  assert.ok(readme.includes("<https://www.gnu.org/licenses/>"));
});

test("the changelog carries the 0.4.5 release section and its Runyth publication record", () => {
  const changelog = read("CHANGELOG.md");
  assert.ok(changelog.includes("## 0.4.5"));
  assert.ok(changelog.includes("First publication as a Runyth module"));
});

test("published surfaces name no foreign module outside technical flag surfaces and give no foreign credit", () => {
  const foreignProject = ["token-", "hud-wildcard"].join("");
  const foreignName = ["Token HUD ", "Wildcard"].join("");
  const presentationSource = ["garb", "-and-", "grime"].join("");
  const externalProject = ["orphan-", "black"].join("");
  const externalCredit = ["Mid", "i-QoL"].join("");
  const retiredLineage = ["veiled", "-inquisition"].join("");
  const volunteer = ["aki", "to"].join("");
  const mitRule = new RegExp(["MIT ", "License|Permission is hereby ", "granted"].join(""), "");
  for (const file of ["module.json", "package.json", "README.md", "CHANGELOG.md", "docs/examples/bree-bunch-12-npcs.json", "docs/examples/bree-bunch-native-activities-12-npcs.json", ...programFiles]) {
    const text = read(file);
    assert.ok(!text.includes(foreignProject), `${file} must not carry the foreign module id`);
    assert.ok(!text.includes(foreignName), `${file} must not carry the foreign module name`);
    assert.ok(!text.includes(presentationSource), `${file} must not carry the sibling presentation module id`);
    assert.ok(!text.includes(externalProject), `${file} must not carry the private campaign name`);
    // Technical integration surfaces permitted: the deep flag namespace `flags.midi-qol.*` (the foreign
    // module's own data key written onto imported documents) and the importer-contract JSON field `midi`
    // consumed by this module's import schema. Prose mentions of the foreign module stay forbidden.
    const proseOnly = text
      .replace(/flags\.midi-qol\.[a-zA-Z0-9._-]*/g, "")
      .replace(/"midi"\s*:/g, "\"in-contract\":");
    assert.ok(!proseOnly.includes(externalCredit), `${file} must not carry third-party module credit`);
    assert.ok(!text.includes(retiredLineage), `${file} must not carry the retired workspace lineage name`);
    assert.ok(!/[Cc]ourtesy of|[Tt]hanks to/.test(text), `${file} must not hand out upstream credit`);
    assert.ok(!text.includes(volunteer), `${file} must not carry personal identity outside licence surfaces`);
    assert.ok(!mitRule.test(text), `${file} must not quote the removed MIT licence`);
  }
});

test("extension fixtures stay neutral about campaign companions", () => {
  for (const file of ["tests/extension-and-portrait.test.mjs", "docs/extension-api.md"]) {
    const text = read(file);
    assert.ok(!text.includes("companion-module-example".slice(0, 0) + "Orphan") && !/[Oo]rphan/.test(text), `${file} must keep companion fixtures neutral`);
  }
});

test("compatibility references stay technical and dependency-free", () => {
  const manifest = JSON.parse(read("module.json"));
  assert.ok(!manifest.relationships.requires?.length);
  assert.equal(manifest.relationships.systems.length, 1);
  assert.equal(manifest.relationships.systems[0].id, "dnd5e");
  for (const file of ["README.md"]) {
    const text = read(file);
    assert.ok(!/donate|patreon|ko-?fi/i.test(text), `${file} must not carry funding prompts`);
  }
});

test("no private material lives on published source surfaces", () => {
  const pattern = (...parts) => new RegExp(parts.join(""), "iu"); // rules assembled at runtime
  const patterns = [
    pattern(["akki", "@"]),
    pattern(["ik", "\\.me"]),
    pattern(["GITHUB_", "TOKEN"]),
    pattern(["gh", "[psro]_[A-Za-z0-9]{20,}"]),
    pattern(["http.*\\.extra", "header"]),
    pattern(["x-", "access-", "token"]),
    pattern(["/mnt", "/"]),
    pattern(["/home", "/"]),
    pattern(["aki", "to"]),
    pattern(["ORPHAN-", "[-\\s]*", "BLACK"])
  ];
  for (const file of [
    "module.json",
    "package.json",
    "package-lock.json",
    "README.md",
    "CHANGELOG.md",
    ".github/workflows/quality.yml",
    ".github/workflows/release.yml",
    ...programFiles,
    ...(everyProgramFile("docs", [".md", ".txt", ".json"]))
  ]) {
    const text = read(file);
    for (const rule of patterns) {
      assert.ok(!rule.test(text), `${file} must not match ${String(rule)}`);
    }
  }
});
