// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { balancedQuotaCounts } from "../scripts/ui/virtual-quota-editor.mjs";

test("virtual quota balancing scales to many selected Races and preserves exact total", () => {
  const ids = Array.from({ length: 37 }, (_, index) => `race-${index + 1}`);
  const counts = balancedQuotaCounts(ids, 100);
  assert.equal(Object.keys(counts).length, 37);
  assert.equal(Object.values(counts).reduce((sum, value) => sum + value, 0), 100);
  assert.ok(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts)) <= 1);
});

test("virtual quota editor uses bounded rendering and does not rebuild rows on numeric input", async () => {
  const source = await readFile(new URL("../scripts/ui/virtual-quota-editor.mjs", import.meta.url), "utf8");
  assert.match(source, /const\s+OVERSCAN\s*=\s*6/);
  assert.match(source, /viewport\.addEventListener\("scroll", renderRows, \{ signal, passive: true \}\)/);
  const inputHandler = source.match(/windowElement\.addEventListener\("input",[\s\S]*?\}, \{ signal \}\);/)?.[0] ?? "";
  assert.match(inputHandler, /counts\[id\]/);
  assert.doesNotMatch(inputHandler, /renderRows\(/);
});
