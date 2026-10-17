import { applySafeMidiEffects } from "./midi-schema.mjs";
/**
 * Optional combat-activity extension for AI-imported NPCs.
 * Explicit schemas prevent AI JSON from injecting arbitrary Foundry document fields.
 * Targets dnd5e 5.0–5.3 native Activity data and Foundry VTT v13.
 * https://github.com/foundryvtt/dnd5e/wiki/Activities
 */

/** Escape action notes (no HTML tags accepted in combat descriptions). */
function sanitizeBiographyHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const ABILITIES = new Set(["str", "dex", "con", "int", "wis", "cha"]);
const SKILLS = new Set(["acr", "ani", "arc", "ath", "dec", "his", "ins", "itm", "inv", "med", "nat", "prc", "prf", "per", "rel", "slt", "ste", "sur"]);
const DAMAGE_TYPES = new Set(["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"]);
const KINDS = new Set(["attack", "save", "heal", "utility"]);
const ACTION_TIMES = new Set(["action", "bonus", "reaction", "none"]);
const CONDITIONS = new Set(["prone", "grappled", "restrained", "frightened", "blinded", "deafened", "poisoned"]);

function fail(path, message) {
  throw new Error(`${path}: ${message}`);
}

function obj(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "expected an object");
  return value;
}

function arr(value, path, max = 50) {
  if (!Array.isArray(value) || value.length > max) fail(path, `expected an array of at most ${max} entries`);
  return value;
}

function int(value, path, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) fail(path, `expected integer ${min}..${max}`);
  return value;
}

function str(value, path, max = 4000) {
  if (typeof value !== "string" || !value.trim() || value.length > max) fail(path, `expected non-empty string (max ${max})`);
  return value.trim();
}

function enumValue(value, allowed, path) {
  if (!allowed.has(value)) fail(path, `unexpected value ${JSON.stringify(value)}`);
  return value;
}

function idFor(a, b, kind) {
  const value = (a + 1) * 100000 + (b + 1) * 10 + kind;
  return `rnb${value.toString(36).padStart(13, "0")}`;
}

function damagePart(source, path) {
  const d = obj(source, path);
  const formula = str(d.formula, `${path}.formula`, 70);
  if (!/^(?:\d{1,2}d(?:4|6|8|10|12|20)(?:\s*[+-]\s*\d{1,2})?|\d{1,3})$/.test(formula)) {
    fail(path, `unsupported dice formula: ${formula}`);
  }
  const type = enumValue(d.type, DAMAGE_TYPES, `${path}.type`);
  return {
    custom: { enabled: true, formula },
    types: [type]
  };
}

function baseActivity(act, a, i) {
  const activation = act.activation ?? "action";
  enumValue(activation, ACTION_TIMES, `Actor ${a + 1}.combat.actions[${i}].activation`);
  const result = {
    _id: idFor(a, i, 1),
    name: act.name,
    type: act.kind,
    activation: { type: activation, value: 1, override: true },
    description: { chatFlavor: sanitizeBiographyHtml(act.description ?? "") }
  };
  if (act.range !== undefined) {
    result.range = { override: true, value: int(act.range, `combat.actions[${i}].range`, 0, 600), units: "ft" };
  }
  if (act.area) {
    const area = obj(act.area, `combat.actions[${i}].area`);
    const areaType = enumValue(area.type, new Set(["cone", "radius", "line", "square", "cube"]), "area.type");
    result.target = {
      override: true,
      template: {
        type: areaType,
        size: int(area.size, "area.size", 5, 120),
        units: "ft"
      },
      affects: { type: "creature" },
      prompt: true
    };
  } else if (act.targets) {
    result.target = { override: true, affects: { type: "creature", count: String(int(act.targets, "targets", 1, 10)) }, prompt: true };
  }
  if (act.uses) {
    const uses = obj(act.uses, `combat.actions[${i}].uses`);
    const max = int(uses.max, "uses.max", 1, 20);
    result.uses = {
      spent: 0,
      max: String(max),
      recovery: uses.recharge ? [{ period: "recharge", type: "recoverAll", formula: String(int(uses.recharge, "uses.recharge", 2, 6)) }] : []
    };
    result.consumption = { targets: [{ type: "activityUses", target: "", value: "1" }] };
  }
  return result;
}

function buildCombatItem(raw, actorIndex, index) {
  const path = `Actor ${actorIndex + 1}.combat.actions[${index}]`;
  const act = obj(raw, path);
  const name = str(act.name, `${path}.name`, 100);
  const kind = enumValue(act.kind, KINDS, `${path}.kind`);
  const description = sanitizeBiographyHtml(act.description ?? "");
  const activity = baseActivity({ ...act, name, kind }, actorIndex, index);
  const isWeapon = kind === "attack";
  const itemType = isWeapon ? "weapon" : "feat";
  const system = {
    description: { value: `<p>${name}: ${description}</p>`, chat: "" },
    activities: { [activity._id]: activity }
  };
  if (isWeapon) {
    const attack = obj(act.attack, `${path}.attack`);
    const toHit = int(attack.toHit, `${path}.attack.toHit`, -5, 25);
    const mode = enumValue(attack.mode ?? "melee", new Set(["melee", "ranged"]), `${path}.attack.mode`);
    const reach = int(attack.reach ?? 5, `${path}.attack.reach`, 0, 30);
    const normal = int(attack.range ?? 0, `${path}.attack.range`, 0, 600);
    const long = int(attack.longRange ?? 0, `${path}.attack.longRange`, 0, 1200);
    const damage = damagePart(act.damage, `${path}.damage`);
    if (mode === "ranged") {
      activity.range = { override: true, value: normal, units: "ft" };
    } else {
      activity.range = { override: true, value: reach, units: "ft" };
    }
    activity.attack = {
      ability: "none",
      bonus: String(toHit),
      flat: true,
      type: { value: mode, classification: "weapon" }
    };
    activity.damage = { includeBase: false, parts: [damage] };
    system.type = { value: act.natural ? "natural" : (mode === "ranged" ? "simpleR" : "martialM") };
    system.equipped = true;
    system.proficient = 1;
    system.damage = { base: damage };
    system.range = { reach, value: normal, long, units: "ft" };
    system.properties = mode === "ranged" ? ["amm", "two"] : [];
    system.quantity = int(act.quantity ?? 1, `${path}.quantity`, 1, 100);
  } else if (kind === "save") {
    const save = obj(act.save, `${path}.save`);
    const ability = enumValue(save.ability, ABILITIES, `${path}.save.ability`);
    const dc = int(save.dc, `${path}.save.dc`, 5, 30);
    activity.save = {
      ability: [ability],
      dc: { calculation: "", formula: String(dc) }
    };
    activity.damage = {
      onSave: act.onSave ?? (act.damage ? "half" : "none"),
      parts: act.damage ? [damagePart(act.damage, `${path}.damage`)] : []
    };
    enumValue(activity.damage.onSave, new Set(["half", "none", "full"]), `${path}.onSave`);
  } else if (kind === "heal") {
    const healing = str(act.healing, `${path}.healing`, 70);
    if (!/^(\d{1,2}d(?:4|6|8|10|12)\s*\+\s*\d{1,2}|\d{1,3})$/.test(healing)) fail(`${path}.healing`, "invalid formula");
    activity.healing = { custom: { enabled: true, formula: healing }, types: ["healing"] };
  } else {
    const rollFormula = act.roll ?? "";
    if (rollFormula && !/^(?:\d{1,2}d(?:4|6|8|10|12)(?:\s*\+\s*\d{1,2})?|\d{1,3})$/.test(rollFormula)) {
      fail(`${path}.roll`, "invalid utility roll formula");
    }
    activity.roll = { formula: rollFormula, name: rollFormula ? name : "", prompt: false, visible: !!rollFormula };
  }

  const effects = [];
  if (act.condition) {
    const condition = enumValue(act.condition, CONDITIONS, `${path}.condition`);
    const effectId = idFor(actorIndex, index, 2);
    effects.push({
      _id: effectId,
      name: `${name}: ${condition}`,
      img: "icons/svg/aura.svg",
      origin: "",
      transfer: false,
      disabled: false,
      statuses: [condition],
      changes: [],
      duration: {},
      flags: { "runyth-npc-button": { conditional: true } }
    });
    activity.effects = [{ _id: effectId, onSave: false }];
  }
  if (act.buff === "attackAdvantage" && !act.midi) {
    system.description.value += "<p>Effect: chosen allies gain Advantage on their next attack roll. Requires Midi-QoL/DAE effect configuration.</p>";
  }
  const item = {
    name: isWeapon && act.weapon ? str(act.weapon, `${path}.weapon`, 100) : name,
    type: itemType,
    img: isWeapon ? "icons/svg/sword.svg" : "icons/svg/book.svg",
    system,
    effects,
    flags: { "runyth-npc-button": { aiImported: true, combatActivity: true } }
  };
  applySafeMidiEffects(act.midi, item, activity, actorIndex, index);
  return item;
}

/** Apply only allowlisted combat capabilities; normal imports remain unchanged. */
export function appendNpcCombatData(source, combat, actorIndex) {
  if (combat === undefined || combat === null) return source;
  const input = obj(combat, `Actor ${actorIndex + 1}.combat`);
  const out = source;
  const saves = arr(input.savingThrows ?? [], "combat.savingThrows", 6);
  for (const ability of saves) {
    enumValue(ability, ABILITIES, "combat.savingThrows");
    out.system.abilities[ability].proficient = 1;
  }
  const skills = obj(input.skills ?? {}, "combat.skills");
  out.system.skills = {};
  for (const [skill, proficiency] of Object.entries(skills)) {
    enumValue(skill, SKILLS, "combat.skills");
    out.system.skills[skill] = { value: int(proficiency, `combat.skills.${skill}`, 0, 2) };
  }
  for (const [inputKey, traitKey] of [["resistances", "dr"], ["vulnerabilities", "dv"]]) {
    const values = arr(input[inputKey] ?? [], `combat.${inputKey}`, 13);
    for (const damageType of values) enumValue(damageType, DAMAGE_TYPES, `combat.${inputKey}`);
    if (values.length) out.system.traits[traitKey] = { value: [...new Set(values)], bypasses: [], custom: "" };
  }
  if (input.relentlessOnce !== undefined) {
    if (input.relentlessOnce !== true && input.relentlessOnce !== false) fail("combat.relentlessOnce", "expected boolean");
    if (input.relentlessOnce) out.flags["runyth-npc-button"].relentlessOnce = true;
  }
  const actions = arr(input.actions ?? [], "combat.actions", 35);
  if (actions.length) {
    // Replace an inventory weapon with its full-fledged attacking counterpart instead of creating duplicates.
    const replaced = new Set(actions.filter(a => a.kind === "attack")
      .map(a => String(a.replaceInventory ?? a.weapon ?? a.name).trim().toLocaleLowerCase()));
    out.items = out.items.filter(item => !replaced.has(item.name.toLocaleLowerCase()));
    const combatItems = [];
    const weaponGroups = new Map();
    actions.forEach((action, i) => {
      const item = buildCombatItem(action, actorIndex, i);
      const key = action.kind === "attack" ? item.name.toLocaleLowerCase() : null;
      if (key && weaponGroups.has(key)) {
        const existing = weaponGroups.get(key);
        Object.assign(existing.system.activities, item.system.activities);
        existing.effects.push(...item.effects);
        existing.system.quantity = Math.max(existing.system.quantity, item.system.quantity);
      } else {
        if (key) weaponGroups.set(key, item);
        combatItems.push(item);
      }
    });
    out.items.push(...combatItems);
  }
  return out;
}
