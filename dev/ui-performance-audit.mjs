import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = path.join(root, "styles/runyth-npc-button.css");
const pickerPath = path.join(root, "scripts/ui/hierarchical-picker.mjs");
const multiPickerPath = path.join(root, "scripts/ui/hierarchical-multi-picker.mjs");
const [css, picker, multiPicker] = await Promise.all([
  readFile(cssPath, "utf8"),
  readFile(pickerPath, "utf8"),
  readFile(multiPickerPath, "utf8")
]);

const cssBytes = Buffer.byteLength(css, "utf8");
assert.ok(cssBytes < 96 * 1024, `UI stylesheet exceeds 96 KiB performance budget: ${cssBytes} bytes`);
assert.equal(/@keyframes\b/i.test(css), false, "UI must not use keyframe animation");
assert.equal(/\banimation\s*:/i.test(css), false, "UI must not use CSS animation properties");
assert.equal(/transition\s*:\s*all\b/i.test(css), false, "UI must not transition every property");
assert.equal(/backdrop-filter\s*:/i.test(css), false, "UI must not use backdrop-filter");
assert.equal(/filter\s*:\s*(?:blur|drop-shadow)\b/i.test(css), false, "UI must not use blur/drop-shadow filters");
assert.match(css, /prefers-reduced-motion:\s*reduce/i, "UI must respect reduced-motion preferences");
assert.match(css, /contain:\s*layout paint style;/, "virtualized picker viewport must isolate layout/paint work");
assert.match(css, /scrollbar-gutter:\s*stable;/, "scrolling surfaces should avoid scrollbar layout shifts");

for (const [name, source] of [["single picker", picker], ["multi picker", multiPicker]]) {
  assert.match(source, /const\s+OVERSCAN\s*=\s*\d+/, `${name} must retain bounded overscan virtualization`);
  assert.match(source, /requestAnimationFrame/, `${name} search/render work must remain frame-coalesced`);
  assert.match(source, /passive:\s*true/, `${name} scroll listener must remain passive`);
  assert.match(source, /replaceChildren\(/, `${name} must replace the bounded visible row window atomically`);
}

console.log(`UI performance audit passed (${cssBytes} CSS bytes).`);
