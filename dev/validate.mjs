import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(root, "module.json"), "utf8"));
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const constantsSource = await readFile(path.join(root, "scripts/constants.mjs"), "utf8");

assert.equal(manifest.id, "runyth-npc-button");
assert.equal(manifest.title, "Runyth NPC Button");
assert.equal(packageJson.version, manifest.version, "package.json version must match module.json");
assert.match(constantsSource, new RegExp(`MODULE_VERSION\\s*=\\s*["']${manifest.version.replaceAll(".", "\\.")}["']`), "constants module version must match module.json");
assert.equal(manifest.compatibility.minimum, "13");
assert.ok(manifest.esmodules.includes("scripts/main.mjs"));
assert.ok(manifest.relationships.systems.some((entry) => entry.id === "dnd5e"));

for (const relativePath of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map((entry) => entry.path)]) {
  await readFile(path.join(root, relativePath));
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "dist" || entry.name === "validate.mjs") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(absolute));
    else files.push(absolute);
  }
  return files;
}

const files = await collectFiles(root);
for (const file of files) {
  if (!/\.(?:mjs|js|json|md|css|yml|yaml|sh)$/.test(file)) continue;
  const text = await readFile(file, "utf8");
  assert.equal(text.includes("globalThis.hasProperty"), false, `${file} uses removed globalThis.hasProperty`);
  assert.equal(/\bnew\s+Dialog\s*\(/.test(text), false, `${file} uses legacy Dialog`);
}

console.log("Validation passed.");
