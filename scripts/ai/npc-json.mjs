import { MODULE_ID } from "../constants.mjs";

const ABILITIES = Object.freeze(["str", "dex", "con", "int", "wis", "cha"]);
const VALID_SIZES = new Set(["tiny", "sm", "med", "lg", "huge", "grg"]);
const DEFAULT_ACTOR_IMAGE = "icons/svg/mystery-man.svg";
const DEFAULT_ITEM_IMAGE = "icons/svg/item-bag.svg";
const ALLOWED_BIOGRAPHY_TAGS = new Set(["p", "/p", "strong", "/strong", "em", "/em", "ul", "/ul", "li", "/li", "br", "br/"]);

function fail(message) {
  throw new Error(message);
}

function finiteNumber(value, path, { min = -Infinity, max = Infinity } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    fail(`${path} must be a number between ${min} and ${max}.`);
  }
  return number;
}

function integer(value, path, { min, max }) {
  const number = finiteNumber(value, path, { min, max });
  if (!Number.isInteger(number)) fail(`${path} must be an integer.`);
  return number;
}

function objectAt(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${path} must be an object.`);
  return value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Preserve only a tiny, attribute-free HTML subset in AI-authored biography
 * and roleplay item text. Everything else is escaped as plain text.
 */
export function sanitizeBiographyHtml(value) {
  const input = String(value ?? "");
  const tagPattern = /<\s*(\/?\s*[a-zA-Z]+\s*\/?)[^>]*>/g;
  let output = "";
  let cursor = 0;

  for (const match of input.matchAll(tagPattern)) {
    output += escapeHtml(input.slice(cursor, match.index));
    const normalized = match[1].replaceAll(/\s+/g, "").toLowerCase();
    if (ALLOWED_BIOGRAPHY_TAGS.has(normalized)) {
      if (normalized === "br" || normalized === "br/") output += "<br>";
      else output += `<${normalized}>`;
    } else {
      output += escapeHtml(match[0]);
    }
    cursor = match.index + match[0].length;
  }

  output += escapeHtml(input.slice(cursor));
  return output;
}

function extractJsonCandidate(text) {
  let value = String(text ?? "").trim();
  if (!value) fail("The clipboard does not contain JSON.");

  value = value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  if (value.startsWith("[") || value.startsWith("{")) return value;

  const arrayIndex = value.indexOf("[");
  const objectIndex = value.indexOf("{");
  const starts = [arrayIndex, objectIndex].filter((index) => index >= 0);
  if (!starts.length) fail("No JSON object or array was found in the clipboard text.");

  const start = Math.min(...starts);
  const opener = value[start];
  const closer = opener === "[" ? "]" : "}";
  const end = value.lastIndexOf(closer);
  if (end < start) fail("The JSON payload appears to be incomplete.");
  return value.slice(start, end + 1);
}

export function parseNpcJsonPayload(text) {
  const candidate = extractJsonCandidate(text);
  try {
    return JSON.parse(candidate);
  } catch (error) {
    fail(`The clipboard JSON could not be parsed: ${error.message}`);
  }
}

function normalizeItemRequest(source, actorIndex, itemIndex) {
  const path = `Actor ${actorIndex + 1}.items[${itemIndex}]`;
  const item = objectAt(source, path);
  const name = String(item.name ?? "").trim();
  if (!name) fail(`${path}.name is required.`);

  const rawLookup = item.lookup;
  const lookup = rawLookup === null || rawLookup === undefined ? "" : String(rawLookup).trim();
  const quantity = integer(item.quantity ?? 1, `${path}.quantity`, { min: 1, max: 1000 });
  const description = sanitizeBiographyHtml(item.description ?? "");

  return {
    name: name.slice(0, 120),
    type: "loot",
    img: DEFAULT_ITEM_IMAGE,
    system: {
      quantity,
      description: {
        value: description,
        chat: ""
      }
    },
    flags: {
      [MODULE_ID]: {
        aiImported: true,
        canonicalLookup: lookup.slice(0, 120)
      }
    }
  };
}

function normalizeItems(value, actorIndex) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail(`Actor ${actorIndex + 1}.items must be an array.`);
  if (value.length > 50) fail(`Actor ${actorIndex + 1}.items may contain at most 50 entries.`);
  return value.map((item, itemIndex) => normalizeItemRequest(item, actorIndex, itemIndex));
}

function normalizeActor(source, index) {
  const path = `Actor ${index + 1}`;
  const actor = objectAt(source, path);
  const name = String(actor.name ?? "").trim();
  if (!name) fail(`${path}.name is required.`);
  if (actor.type !== undefined && actor.type !== "npc") fail(`${path}.type must be "npc".`);

  const system = objectAt(actor.system, `${path}.system`);
  const abilitiesInput = objectAt(system.abilities, `${path}.system.abilities`);
  const abilities = Object.fromEntries(ABILITIES.map((ability) => {
    const abilityData = objectAt(abilitiesInput[ability], `${path}.system.abilities.${ability}`);
    return [ability, {
      value: integer(abilityData.value, `${path}.system.abilities.${ability}.value`, { min: 1, max: 30 })
    }];
  }));

  const attributes = objectAt(system.attributes, `${path}.system.attributes`);
  const ac = objectAt(attributes.ac, `${path}.system.attributes.ac`);
  const hp = objectAt(attributes.hp, `${path}.system.attributes.hp`);
  const movement = objectAt(attributes.movement, `${path}.system.attributes.movement`);
  const hpValue = finiteNumber(hp.value, `${path}.system.attributes.hp.value`, { min: 0, max: 100000 });
  const hpMax = finiteNumber(hp.max, `${path}.system.attributes.hp.max`, { min: hpValue, max: 100000 });

  const details = objectAt(system.details, `${path}.system.details`);
  const creatureType = objectAt(details.type, `${path}.system.details.type`);
  const biography = objectAt(details.biography, `${path}.system.details.biography`);
  const traits = objectAt(system.traits, `${path}.system.traits`);
  const size = String(traits.size ?? "").trim().toLowerCase();
  if (!VALID_SIZES.has(size)) fail(`${path}.system.traits.size must be one of: ${[...VALID_SIZES].join(", ")}.`);

  return {
    name: name.slice(0, 120),
    type: "npc",
    img: DEFAULT_ACTOR_IMAGE,
    system: {
      abilities,
      attributes: {
        ac: {
          calc: "flat",
          flat: finiteNumber(ac.flat, `${path}.system.attributes.ac.flat`, { min: 0, max: 50 })
        },
        hp: {
          value: hpValue,
          max: hpMax,
          formula: String(hp.formula ?? "").trim().slice(0, 80)
        },
        movement: {
          walk: finiteNumber(movement.walk, `${path}.system.attributes.movement.walk`, { min: 0, max: 1000 }),
          units: "ft"
        }
      },
      details: {
        cr: finiteNumber(details.cr, `${path}.system.details.cr`, { min: 0, max: 30 }),
        type: {
          value: String(creatureType.value ?? "humanoid").trim().slice(0, 80) || "humanoid",
          subtype: String(creatureType.subtype ?? "").trim().slice(0, 120),
          swarm: "",
          custom: String(creatureType.custom ?? "").trim().slice(0, 120)
        },
        biography: {
          value: sanitizeBiographyHtml(biography.value),
          public: sanitizeBiographyHtml(biography.public)
        }
      },
      traits: {
        size
      }
    },
    items: normalizeItems(actor.items, index),
    flags: {
      [MODULE_ID]: {
        aiImported: true
      }
    }
  };
}

/**
 * Normalize an untrusted AI payload into the narrow Actor source contract this
 * module owns. By default, an array is mandatory even when one NPC is expected.
 */
export function normalizeNpcJsonPayload(payload, {
  expectedCount,
  maxCount = 100,
  allowSingleObject = false
} = {}) {
  let entries;
  if (Array.isArray(payload)) {
    if (allowSingleObject) fail("A single Actor JSON object is required when single-object mode is enabled.");
    entries = payload;
  } else if (payload && typeof payload === "object") {
    if (!allowSingleObject) fail("The JSON payload must be an array of Actor objects.");
    entries = [payload];
  } else {
    fail(allowSingleObject
      ? "The JSON payload must be a single Actor object."
      : "The JSON payload must be an array of Actor objects.");
  }

  if (!entries.length) fail("The JSON payload contains no Actors.");
  if (entries.length > maxCount) fail(`The JSON payload contains ${entries.length} Actors, exceeding the maximum of ${maxCount}.`);
  if (expectedCount !== undefined && entries.length !== Number(expectedCount)) {
    fail(`Expected ${expectedCount} Actor(s), but the JSON payload contains ${entries.length}.`);
  }

  return entries.map(normalizeActor);
}

export function parseAndNormalizeNpcJson(text, options = {}) {
  return normalizeNpcJsonPayload(parseNpcJsonPayload(text), options);
}
