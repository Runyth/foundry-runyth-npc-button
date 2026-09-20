import { MODULE_ID } from "../constants.mjs";
import { logger } from "../logger.mjs";

const CANDIDATE_PACK_IDS = Object.freeze([
  "dnd5e.equipment24",
  "dnd5e.items",
  "dnd5e.tradegoods"
]);

let canonicalIndexPromise = null;

function normalizedName(value) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

async function buildCanonicalIndex() {
  const result = new Map();
  for (const packId of CANDIDATE_PACK_IDS) {
    const pack = game.packs.get(packId);
    if (!pack || pack.documentName !== "Item") continue;

    try {
      const index = await pack.getIndex({ fields: ["name"] });
      for (const entry of index) {
        const key = normalizedName(entry.name);
        if (!key || result.has(key)) continue;
        result.set(key, { packId, id: entry._id });
      }
    } catch (error) {
      logger.debug(`Could not index canonical Item pack ${packId}.`, error);
    }
  }
  return result;
}

async function canonicalIndex() {
  canonicalIndexPromise ??= buildCanonicalIndex();
  return canonicalIndexPromise;
}

function stripEmbeddedIncompatibleFields(source) {
  const copy = foundry.utils.deepClone(source);
  delete copy._id;
  delete copy.folder;
  delete copy.sort;
  delete copy.ownership;
  delete copy._stats;
  return copy;
}

async function resolveCanonicalItem(item) {
  const lookup = item?.flags?.[MODULE_ID]?.canonicalLookup;
  if (!lookup) return item;

  const index = await canonicalIndex();
  const match = index.get(normalizedName(lookup));
  if (!match) return item;

  try {
    const pack = game.packs.get(match.packId);
    const document = await pack?.getDocument(match.id);
    if (!document) return item;

    const source = stripEmbeddedIncompatibleFields(document.toObject());
    const quantity = Number(item.system?.quantity);
    if (Number.isFinite(quantity) && quantity > 0) {
      source.system ??= {};
      source.system.quantity = quantity;
    }
    source.flags ??= {};
    source.flags[MODULE_ID] = {
      ...(source.flags[MODULE_ID] ?? {}),
      aiImported: true,
      canonicalLookup: lookup,
      canonicalPack: match.packId
    };
    return source;
  } catch (error) {
    logger.debug(`Could not resolve canonical Item "${lookup}"; keeping safe fallback loot Item.`, error);
    return item;
  }
}

export async function resolveCanonicalItemsForActors(actorSources = []) {
  return Promise.all(actorSources.map(async (actor) => ({
    ...actor,
    items: await Promise.all((actor.items ?? []).map(resolveCanonicalItem))
  })));
}
