// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import assert from "node:assert/strict";
import test from "node:test";

import { buildActorSource, createSeededRandom, generateNpcBlueprint } from "../scripts/generator/npc-generator.mjs";
import { buildWealthBundle, currencyValueCp, wealthBudgetCp } from "../scripts/generator/wealth.mjs";

test("every wealth distribution preserves the same fixed total budget", () => {
  const modes = ["itemsHeavy", "mixed", "coinsHeavy", "fewHighValue", "manySmallValue"];
  for (const wealth of ["poor", "average", "wellOff", "elite"]) {
    const expected = wealthBudgetCp(wealth);
    for (const distribution of modes) {
      const bundle = buildWealthBundle({ wealth, distribution });
      const itemValue = bundle.valuables.reduce((sum, item) => sum + item.valueCp, 0);
      assert.equal(currencyValueCp(bundle.currency) + itemValue, expected, `${wealth}/${distribution}`);
      assert.ok(currencyValueCp(bundle.currency) >= 1, `${wealth}/${distribution} must carry coin`);
    }
  }
});

test("wealth distribution changes the split without changing total value", () => {
  const itemHeavy = buildWealthBundle({ wealth: "average", distribution: "itemsHeavy" });
  const mixed = buildWealthBundle({ wealth: "average", distribution: "mixed" });
  const coinHeavy = buildWealthBundle({ wealth: "average", distribution: "coinsHeavy" });

  assert.equal(itemHeavy.budgetCp, mixed.budgetCp);
  assert.equal(mixed.budgetCp, coinHeavy.budgetCp);
  assert.ok(itemHeavy.cashCp < mixed.cashCp);
  assert.ok(mixed.cashCp < coinHeavy.cashCp);
});

test("few-high-value and many-small-value modes alter item concentration", () => {
  const few = buildWealthBundle({ wealth: "elite", distribution: "fewHighValue" });
  const many = buildWealthBundle({ wealth: "elite", distribution: "manySmallValue" });
  assert.ok(few.valuables.length < many.valuables.length);
  assert.equal(few.itemBudgetCp, many.itemBudgetCp);
});

test("generated Actor source stores real dnd5e currency and valued possessions", () => {
  const blueprint = generateNpcBlueprint({
    wealth: "wellOff",
    wealthDistribution: "mixed",
    role: "merchant"
  }, createSeededRandom("wealth-source"));
  const source = buildActorSource(blueprint);

  assert.ok(currencyValueCp(source.system.currency) > 0);
  const wealthItems = source.items.filter((item) => Number(item.flags?.["runyth-npc-button"]?.wealthValueCp) > 0);
  assert.ok(wealthItems.length > 0);
  const itemValue = wealthItems.reduce((sum, item) => sum + item.flags["runyth-npc-button"].wealthValueCp, 0);
  assert.equal(currencyValueCp(source.system.currency) + itemValue, wealthBudgetCp("wellOff"));
  assert.equal(source.flags["runyth-npc-button"].wealthDistribution, "Mixed");
});
