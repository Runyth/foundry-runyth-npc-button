// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import assert from "node:assert/strict";
import test from "node:test";

import { MODULE_ID } from "../scripts/constants.mjs";
import { resolveCanonicalItemsForActors } from "../scripts/services/item-resolver.mjs";

function fallbackItem({ lookup = "Mace", quantity = 2 } = {}) {
  return {
    name: lookup || "Keepsake",
    type: "loot",
    system: { quantity },
    flags: {
      [MODULE_ID]: {
        aiImported: true,
        canonicalLookup: lookup
      }
    }
  };
}

test("canonical AI equipment resolves from dnd5e packs while preserving requested quantity", async () => {
  const canonicalSource = {
    _id: "canonical-id",
    name: "Mace",
    type: "weapon",
    folder: "source-folder",
    sort: 100,
    ownership: { default: 0 },
    _stats: { systemId: "dnd5e" },
    system: { quantity: 1, damage: { base: { number: 1, denomination: 6 } } },
    flags: { core: { sourceId: "Compendium.dnd5e.equipment24.Item.canonical-id" } }
  };

  const pack = {
    documentName: "Item",
    async getIndex() {
      return [{ _id: "canonical-id", name: "Mace" }];
    },
    async getDocument(id) {
      assert.equal(id, "canonical-id");
      return { toObject: () => structuredClone(canonicalSource) };
    }
  };

  globalThis.game = {
    packs: new Map([["dnd5e.equipment24", pack]])
  };
  globalThis.foundry = {
    utils: {
      deepClone: structuredClone
    }
  };

  const [actor] = await resolveCanonicalItemsForActors([{ name: "Priest", items: [fallbackItem()] }]);
  const [item] = actor.items;

  assert.equal(item.type, "weapon");
  assert.equal(item.system.quantity, 2);
  assert.equal(item._id, undefined);
  assert.equal(item.folder, undefined);
  assert.equal(item.sort, undefined);
  assert.equal(item.ownership, undefined);
  assert.equal(item._stats, undefined);
  assert.equal(item.flags[MODULE_ID].canonicalLookup, "Mace");
  assert.equal(item.flags[MODULE_ID].canonicalPack, "dnd5e.equipment24");
});

test("unresolved or invented AI possessions remain safe fallback items", async () => {
  globalThis.game = {
    packs: new Map()
  };
  globalThis.foundry = {
    utils: {
      deepClone: structuredClone
    }
  };

  const invented = fallbackItem({ lookup: "", quantity: 1 });
  const [actor] = await resolveCanonicalItemsForActors([{ name: "Civilian", items: [invented] }]);

  assert.deepEqual(actor.items[0], invented);
});

test("canonical resolution preserves local-generation flags", async () => {
  const canonicalSource = {
    _id: "canonical-id",
    name: "Mace",
    type: "weapon",
    system: { quantity: 1 },
    flags: {}
  };
  const pack = {
    documentName: "Item",
    async getIndex() { return [{ _id: "canonical-id", name: "Mace" }]; },
    async getDocument() { return { toObject: () => structuredClone(canonicalSource) }; }
  };
  globalThis.game = { packs: new Map([["dnd5e.equipment24", pack]]) };
  globalThis.foundry = { utils: { deepClone: structuredClone } };

  const localItem = {
    name: "Mace",
    type: "loot",
    system: { quantity: 1 },
    flags: { [MODULE_ID]: { generated: true, canonicalLookup: "Mace" } }
  };
  const [actor] = await resolveCanonicalItemsForActors([{ name: "Guard", items: [localItem] }]);
  assert.equal(actor.items[0].flags[MODULE_ID].generated, true);
  assert.equal(actor.items[0].flags[MODULE_ID].canonicalPack, "dnd5e.equipment24");
});
