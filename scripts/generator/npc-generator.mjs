import {
  CR_VALUES,
  DRIVES,
  FAMILY_STRUCTURES,
  GROUP_COHESION,
  GROUP_HIERARCHY,
  GROUP_RUMOURS,
  GROUP_SECRETS,
  GROUP_TYPES,
  INTERNAL_CONFLICT,
  COMBAT_READINESS,
  ROLE_COMBAT_PROFILES,
  ROLE_COMPOSITION_MODES,
  ROLE_VARIANTS,
  WEAPON_CATEGORIES,
  WEAPON_VARIETY,
  HABITATS,
  IMPRESSIONS,
  NAME_STYLES,
  QUIRKS,
  RACES,
  RELATIONSHIP_DENSITY,
  ROLES,
  TELLS,
  TIERS,
  WEALTH_LEVELS,
  WEALTH_DISTRIBUTIONS,
  formatChallengeRating
} from "./data.mjs";
import { DEFAULT_OPTIONS, TIER_STYLES } from "../constants.mjs";
import { getGroupTypes, getHabitats, getNamingStyles, getRaces, getRoles } from "../extensions/registry.mjs";
import { buildWealthBundle, formatCopperValue } from "./wealth.mjs";

const ABILITIES = Object.freeze(["str", "dex", "con", "int", "wis", "cha"]);
const GENDER_TUPLE = Object.freeze(["male", "female"]);
const GENDERED_GIVEN_NAMES = Object.freeze({
  central: Object.freeze({
    male: Object.freeze(["Aren", "Bren", "Daro", "Elian", "Garen", "Iven", "Kelan", "Orin", "Rovan", "Tarin", "Aldren", "Tomas", "Corven"]),
    female: Object.freeze(["Calia", "Fenna", "Hessa", "Jora", "Lysa", "Maren", "Nella", "Pera", "Sella", "Vera", "Mira", "Elira", "Nadia"])
  }),
  coastal: Object.freeze({
    male: Object.freeze(["Bero", "Corin", "Eren", "Faro", "Harin", "Joren", "Liro", "Nero", "Rian", "Varen", "Orro", "Tavian"]),
    female: Object.freeze(["Alda", "Dessa", "Gilda", "Iria", "Kessa", "Mira", "Ossa", "Sora", "Tessa", "Maela", "Selka", "Ivena"])
  }),
  highland: Object.freeze({
    male: Object.freeze(["Ardan", "Cael", "Edrin", "Garr", "Korr", "Nerin", "Rann", "Torren", "Davor", "Hakon", "Merren"]),
    female: Object.freeze(["Brina", "Dorna", "Fara", "Hedra", "Ilda", "Marda", "Orla", "Siva", "Vara", "Brenna", "Eira"])
  }),
  frontier: Object.freeze({
    male: Object.freeze(["Bram", "Dain", "Flint", "Hale", "Joss", "Kitt", "Noll", "Perrin", "Silas", "Toma", "Cole", "Emmet", "Tobin"]),
    female: Object.freeze(["Cora", "Etta", "Greta", "Mara", "Rhea", "Willa", "Ada", "Nessa", "Ruth"])
  })
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hashSeed(seed) {
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed) {
  let state = hashSeed(seed) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGenerationSeed() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint32Array(4);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(8, "0")).join("-");
  }
  return `seed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function pick(values, random) {
  return values[Math.floor(random() * values.length)];
}

function shuffle(values, random) {
  const output = [...values];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

function abilityModifier(score) {
  return Math.floor((score - 10) / 2);
}

function titleCase(value) {
  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(^|[\s-])\p{L}/gu, (match) => match.toUpperCase());
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resolveRace(raceKey, customRace) {
  const races = getRaces();
  const configured = races[raceKey] ?? races.human ?? RACES.human;
  if (raceKey !== "custom") return configured;

  const label = titleCase(customRace) || "Humanoid";
  return { ...configured, label };
}

function raceSelectionFromId(id) {
  const value = String(id ?? "").trim();
  if (value.startsWith("custom:")) {
    return { species: "custom", customSpecies: value.slice(7).trim() || "Humanoid" };
  }
  const races = getRaces();
  if (races[value] && value !== "custom") return { species: value, customSpecies: "" };
  return null;
}

export function normalizeGroupRaceIds(options = {}) {
  const raw = Array.isArray(options.groupRaces) ? options.groupRaces : [];
  const normalized = [];
  const seen = new Set();
  for (const entry of raw) {
    const value = String(entry ?? "").trim();
    if (!raceSelectionFromId(value) || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  const primary = options.species === "custom"
    ? `custom:${String(options.customSpecies ?? "Humanoid").trim() || "Humanoid"}`
    : ((getRaces()[options.species] ? options.species : "human"));
  if (!seen.has(primary)) normalized.unshift(primary);
  return normalized.length ? normalized : ["human"];
}

function proportionalCounts(ids, count, weights) {
  const safeWeights = ids.map((id) => Math.max(0, Number(weights[id]) || 0));
  const total = safeWeights.reduce((sum, value) => sum + value, 0) || ids.length;
  const exact = safeWeights.map((weight) => count * ((total === ids.length && safeWeights.every((value) => value === 0) ? 1 : weight) / total));
  const counts = exact.map((value) => Math.floor(value));
  let remaining = count - counts.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  for (let index = 0; remaining > 0; index = (index + 1) % order.length) {
    counts[order[index].index] += 1;
    remaining -= 1;
  }
  return counts;
}

export function buildGenderAssignments(options = {}, count = 1, random = Math.random) {
  const total = clamp(Math.trunc(Number(count) || 1), 1, 100);
  const mode = ["random", "balanced", "mostlyMale", "mostlyFemale", "exact"].includes(String(options.genderComposition))
    ? String(options.genderComposition)
    : DEFAULT_OPTIONS.genderComposition;

  if (mode === "random") {
    return Array.from({ length: total }, () => GENDER_TUPLE[random() < 0.5 ? 0 : 1]);
  }

  let maleCount;
  if (mode === "balanced") maleCount = Math.ceil(total / 2);
  else if (mode === "mostlyMale") maleCount = Math.round(total * 0.8);
  else if (mode === "mostlyFemale") maleCount = Math.round(total * 0.2);
  else {
    const configuredMale = Number(options.maleCount);
    maleCount = Number.isFinite(configuredMale) ? clamp(Math.trunc(configuredMale), 0, total) : Math.ceil(total / 2);
  }
  const femaleCount = total - maleCount;
  return shuffle([
    ...Array.from({ length: maleCount }, () => GENDER_TUPLE[0]),
    ...Array.from({ length: femaleCount }, () => GENDER_TUPLE[1])
  ], random);
}

/**
 * Build an exact-size race assignment plan. "Balanced" and weighted modes use
 * integer quotas before shuffling so small groups do not accidentally collapse
 * to one race because of repeated random draws.
 */
export function buildRaceAssignments(options = {}, count = 1, random = Math.random) {
  const total = clamp(Math.trunc(Number(count) || 1), 1, 100);
  let composition = String(options.raceComposition ?? "single");
  if (composition === "mixed") composition = String(options.raceDistribution ?? "balanced");
  if (composition === "single") {
    return Array.from({ length: total }, () => ({
      species: getRaces()[options.species] ? options.species : "human",
      customSpecies: options.species === "custom" ? String(options.customSpecies ?? "Humanoid") : ""
    }));
  }

  const ids = normalizeGroupRaceIds(options);
  if (ids.length === 1) {
    const only = raceSelectionFromId(ids[0]) ?? { species: "human", customSpecies: "" };
    return Array.from({ length: total }, () => ({ ...only }));
  }

  const primaryId = ids.includes(options.primaryRace) ? options.primaryRace : ids[0];

  if (composition === "exact") {
    const configured = options.raceExactCounts && typeof options.raceExactCounts === "object" ? options.raceExactCounts : {};
    const quotas = ids.map((id) => Math.max(0, Math.trunc(Number(configured[id]) || 0)));
    const assigned = quotas.reduce((sum, value) => sum + value, 0);
    if (assigned !== total) {
      throw new Error(`Exact Race counts must add up to ${total}; currently ${assigned}.`);
    }
    const assignments = [];
    ids.forEach((id, index) => {
      const selection = raceSelectionFromId(id) ?? { species: "human", customSpecies: "" };
      for (let item = 0; item < quotas[index]; item += 1) assignments.push({ ...selection });
    });
    return shuffle(assignments, random);
  }

  const weights = {};
  if (composition === "primary" || composition === "dominant") {
    const primaryShare = composition === "dominant" ? 0.85 : 0.70;
    const minorityShare = (1 - primaryShare) / Math.max(1, ids.length - 1);
    for (const id of ids) weights[id] = id === primaryId ? primaryShare : minorityShare;
  } else if (composition === "weighted") {
    const configured = options.raceWeights && typeof options.raceWeights === "object" ? options.raceWeights : {};
    for (const id of ids) weights[id] = Math.max(0, Number(configured[id]) || 0);
    if (!Object.values(weights).some((value) => value > 0)) {
      for (const id of ids) weights[id] = 1;
    }
  } else {
    for (const id of ids) weights[id] = 1;
  }

  const quotas = proportionalCounts(ids, total, weights);
  const assignments = [];
  ids.forEach((id, index) => {
    const selection = raceSelectionFromId(id) ?? { species: "human", customSpecies: "" };
    for (let item = 0; item < quotas[index]; item += 1) assignments.push({ ...selection });
  });
  return shuffle(assignments, random);
}

export function normalizeGroupRoleIds(options = {}) {
  const roles = getRoles();
  const raw = Array.isArray(options.groupRoles) ? options.groupRoles : [];
  const normalized = [];
  const seen = new Set();
  for (const entry of raw) {
    const value = String(entry ?? "").trim();
    if (!roles[value] || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }
  const primary = roles[options.role] ? options.role : DEFAULT_OPTIONS.role;
  if (!seen.has(primary)) normalized.unshift(primary);
  return normalized.length ? normalized : [DEFAULT_OPTIONS.role];
}

export function buildRoleAssignments(options = {}, count = 1, random = Math.random, groupType = GROUP_TYPES.independent) {
  const total = clamp(Math.trunc(Number(count) || 1), 1, 100);
  const roles = getRoles();
  const composition = String(options.roleComposition ?? "groupPreset");
  const primary = roles[options.role] ? options.role : DEFAULT_OPTIONS.role;

  if (composition === "single" || composition === "variants") {
    return Array.from({ length: total }, (_, index) => ({
      role: primary,
      variant: composition === "variants" ? roleVariantForIndex(primary, index) : ""
    }));
  }

  if (composition === "groupPreset") {
    return Array.from({ length: total }, (_, index) => ({
      role: practicalRoleForIndex({ ...options, role: primary }, groupType, index),
      variant: ""
    }));
  }

  const ids = normalizeGroupRoleIds(options);
  if (ids.length === 1) return Array.from({ length: total }, () => ({ role: ids[0], variant: "" }));
  const primaryId = primary;
  const weights = {};
  if (composition === "primary" || composition === "dominant") {
    const primaryShare = composition === "dominant" ? 0.85 : 0.70;
    const minorityShare = (1 - primaryShare) / Math.max(1, ids.length - 1);
    for (const id of ids) weights[id] = id === primaryId ? primaryShare : minorityShare;
  } else if (composition === "weighted") {
    const configured = options.roleWeights && typeof options.roleWeights === "object" ? options.roleWeights : {};
    for (const id of ids) weights[id] = Math.max(0, Number(configured[id]) || 0);
    if (!Object.values(weights).some((value) => value > 0)) {
      for (const id of ids) weights[id] = 1;
    }
  } else {
    for (const id of ids) weights[id] = 1;
  }
  const quotas = proportionalCounts(ids, total, weights);
  const assignments = [];
  ids.forEach((id, index) => {
    for (let item = 0; item < quotas[index]; item += 1) assignments.push({ role: id, variant: "" });
  });
  return shuffle(assignments, random);
}

function roleVariantForIndex(roleId, index) {
  const roleConfig = getRoles()[roleId] ?? {};
  const variants = Array.isArray(roleConfig.variants) && roleConfig.variants.length
    ? roleConfig.variants
    : (ROLE_VARIANTS[roleId] ?? []);
  return variants.length ? variants[index % variants.length] : "";
}

function weaponPoolsForVariety(weapons, varietyId) {
  const variety = WEAPON_VARIETY[varietyId] ? varietyId : "mixed";
  const melee = weapons.filter((name) => WEAPON_CATEGORIES[name] !== "ranged");
  const ranged = weapons.filter((name) => WEAPON_CATEGORIES[name] === "ranged");
  if (variety === "meleeOnly") return { variety, primary: melee, secondary: [] };
  if (variety === "rangedOnly") return { variety, primary: ranged, secondary: [] };
  if (variety === "meleePreferred") return { variety, primary: melee.length ? melee : weapons, secondary: ranged };
  if (variety === "rangedPreferred") return { variety, primary: ranged.length ? ranged : weapons, secondary: melee };
  return { variety: "mixed", primary: [...weapons], secondary: [] };
}

function chooseWeapon(pool, cr, readinessOffset = 0) {
  if (!pool.length) return "";
  const qualityIndex = Math.min(
    pool.length - 1,
    Math.floor(Math.max(0, Number(cr) || 0) / 5),
    Math.max(0, readinessOffset)
  );
  return pool[qualityIndex];
}

function combatLoadout(roleId, options, cr = 0) {
  const readiness = COMBAT_READINESS[options.combatReadiness] ?? COMBAT_READINESS.standard;
  if (readiness.level === 0) return [];
  const roleConfig = getRoles()[roleId] ?? {};
  const baseProfile = roleConfig.combatProfile ?? ROLE_COMBAT_PROFILES[roleId] ?? { weaponAt: 4, armorAt: 99, weapons: ["Dagger"], armor: [], guidance: "keep combat gear minimal and occupation-appropriate" };
  const variant = String(options.roleVariant ?? "");
  let profile = baseProfile;
  if (roleId === "scholar" && ["Jurist", "Scribe", "Tutor", "Archivist", "Accountant", "Historian"].includes(variant)) {
    profile = { ...baseProfile, weapons: ["Dagger"], armor: [], armorAt: 99 };
  } else if (roleId === "artisan" && ["Baker", "Tailor", "Cobbler"].includes(variant)) {
    profile = { ...baseProfile, weapons: ["Dagger"], armor: [], armorAt: 99 };
  }
  const violentGroup = ["guardPatrol", "watchShift", "militia", "mercenaryBand", "orcRaiders", "banditCrew"].includes(String(options.groupType ?? ""));
  const weaponAt = violentGroup ? Math.min(profile.weaponAt, 1) : profile.weaponAt;
  const pools = weaponPoolsForVariety(profile.weapons ?? [], options.weaponVariety ?? DEFAULT_OPTIONS.weaponVariety);
  const items = [];
  if (readiness.level >= weaponAt && pools.primary.length) {
    const primary = chooseWeapon(pools.primary, cr, readiness.level - weaponAt);
    if (primary) items.push({ name: primary, lookup: primary, kind: "weapon" });

    if (readiness.level >= 3) {
      const primaryBackups = pools.primary.filter((weapon) => weapon !== primary);
      const backup = chooseWeapon(primaryBackups, cr, readiness.level - weaponAt - 1);
      if (backup) items.push({ name: backup, lookup: backup, kind: "weapon" });
      else if (pools.variety === "mixed" && (profile.weapons ?? []).length > 1) {
        const alternate = (profile.weapons ?? []).find((weapon) => weapon !== primary);
        if (alternate) items.push({ name: alternate, lookup: alternate, kind: "weapon" });
      }
    }

    if (readiness.level >= 4) {
      const candidates = pools.variety === "mixed"
        ? (profile.weapons ?? [])
        : [...pools.primary, ...pools.secondary];
      for (const weapon of candidates) {
        if (items.some((entry) => entry.name === weapon)) continue;
        items.push({ name: weapon, lookup: weapon, kind: "weapon" });
        if (items.filter((entry) => entry.kind === "weapon").length >= 3) break;
      }
    }
  }
  if (readiness.level >= profile.armorAt && profile.armor.length) {
    const armorOptions = profile.armor.filter((name) => name !== "Shield");
    const hasShield = profile.armor.includes("Shield");
    if (armorOptions.length) {
      const crStep = Math.floor(Math.max(0, Number(cr) || 0) / 8);
      const armorIndex = Math.min(armorOptions.length - 1, Math.max(0, readiness.level - profile.armorAt), crStep);
      const armor = armorOptions[armorIndex];
      items.push({ name: armor, lookup: armor, kind: "armor" });
    }
    if (hasShield && readiness.level >= Math.max(3, profile.armorAt)) {
      items.push({ name: "Shield", lookup: "Shield", kind: "shield" });
    }
  }
  return items;
}

function armorClassFromLoadout(dexScore, combatItems, tier) {
  const dex = abilityModifier(dexScore);
  const names = new Set((combatItems ?? []).map((item) => item.name));
  let ac = 10 + dex;
  if (names.has("Leather Armor")) ac = 11 + dex;
  if (names.has("Hide Armor")) ac = 12 + Math.min(2, dex);
  if (names.has("Chain Shirt")) ac = 13 + Math.min(2, dex);
  if (names.has("Scale Mail")) ac = 14 + Math.min(2, dex);
  if (names.has("Chain Mail")) ac = 16;
  if (names.has("Shield")) ac += 2;
  const trainingBonus = Math.min(2, Math.max(0, Math.floor((Number(tier?.abilityBonus) || 0) / 3)));
  return clamp(ac + trainingBonus, 8, 30);
}

function interpolate(left, right, ratio) {
  return left + ((right - left) * ratio);
}

/**
 * Convert an exact CR choice into the coarse numeric knobs used by the local
 * generator. CR itself remains exact; only supporting stats are interpolated.
 */
export function profileForChallengeRating(value) {
  const cr = clamp(Number(value) || 0, 0, 30);
  const anchors = [
    { cr: 0, acBonus: 0, hpMultiplier: 0.7, abilityBonus: -1 },
    { cr: 0.125, acBonus: 1, hpMultiplier: 1.0, abilityBonus: 0 },
    { cr: 0.5, acBonus: 2, hpMultiplier: 1.8, abilityBonus: 1 },
    { cr: 2, acBonus: 3, hpMultiplier: 3.0, abilityBonus: 2 },
    { cr: 5, acBonus: 4, hpMultiplier: 5.0, abilityBonus: 3 },
    { cr: 10, acBonus: 5, hpMultiplier: 10.0, abilityBonus: 4 },
    { cr: 15, acBonus: 6, hpMultiplier: 16.0, abilityBonus: 5 },
    { cr: 20, acBonus: 7, hpMultiplier: 23.0, abilityBonus: 6 },
    { cr: 25, acBonus: 8, hpMultiplier: 30.0, abilityBonus: 7 },
    { cr: 30, acBonus: 9, hpMultiplier: 38.0, abilityBonus: 8 }
  ];

  const exact = anchors.find((entry) => entry.cr === cr);
  if (exact) {
    return {
      label: `CR ${formatChallengeRating(cr)}`,
      cr,
      acBonus: exact.acBonus,
      hpMultiplier: exact.hpMultiplier,
      abilityBonus: exact.abilityBonus
    };
  }

  const upperIndex = anchors.findIndex((entry) => entry.cr > cr);
  const upper = anchors[upperIndex];
  const lower = anchors[Math.max(0, upperIndex - 1)];
  const ratio = (cr - lower.cr) / (upper.cr - lower.cr);

  return {
    label: `CR ${formatChallengeRating(cr)}`,
    cr,
    acBonus: Math.round(interpolate(lower.acBonus, upper.acBonus, ratio)),
    hpMultiplier: interpolate(lower.hpMultiplier, upper.hpMultiplier, ratio),
    abilityBonus: Math.round(interpolate(lower.abilityBonus, upper.abilityBonus, ratio))
  };
}

export function resolveTierProfile(options = {}) {
  if (options.tierStyle === TIER_STYLES.CR) {
    const requested = Number(options.cr);
    const cr = CR_VALUES.includes(requested) ? requested : 0.125;
    return profileForChallengeRating(cr);
  }
  return TIERS[options.tier] ?? TIERS.trained;
}

function buildAbilityScores(role, tier, random) {
  const scores = {};
  for (const ability of ABILITIES) {
    const variance = Math.floor(random() * 5) - 2;
    const roleBias = role.biases[ability] ?? 0;
    scores[ability] = clamp(10 + roleBias + tier.abilityBonus + variance, 6, 24);
  }
  return scores;
}

function buildHitPoints(role, tier, conScore, hitDie) {
  const conModifier = abilityModifier(conScore);
  const target = Math.max(1, Math.round(role.hpBase * tier.hpMultiplier));
  const averagePerDie = Math.max(1, ((hitDie + 1) / 2) + conModifier);
  const diceCount = Math.max(1, Math.round(target / averagePerDie));
  const flatBonus = diceCount * conModifier;
  const average = Math.max(1, Math.round(diceCount * ((hitDie + 1) / 2) + flatBonus));
  const suffix = flatBonus === 0 ? "" : flatBonus > 0 ? `+${flatBonus}` : `${flatBonus}`;

  return {
    value: average,
    max: average,
    formula: `${diceCount}d${hitDie}${suffix}`
  };
}

function generatedName(style, random, forcedFamilyName = "", gender = "male", namingStyleId = "") {
  const genderedPool = GENDERED_GIVEN_NAMES[namingStyleId]?.[gender];
  const givenPool = Array.isArray(genderedPool) && genderedPool.length ? genderedPool : style.given;
  return `${pick(givenPool, random)} ${forcedFamilyName || pick(style.family, random)}`;
}

function habitatLabel(options) {
  if (String(options.habitat ?? "").startsWith("custom:")) return titleCase(String(options.habitat).slice(7));
  const habitats = getHabitats();
  return habitats[options.habitat]?.label ?? habitats.forestVillage?.label ?? HABITATS.forestVillage.label;
}

function buildBiography(blueprint) {
  const rows = [
    `<p><strong>Role:</strong> ${escapeHtml(blueprint.role)}${blueprint.roleVariant ? ` — ${escapeHtml(blueprint.roleVariant)}` : ""} (${escapeHtml(blueprint.tier)})</p>`,
    `<p><strong>Race:</strong> ${escapeHtml(blueprint.race)}</p>`,
    `<p><strong>Gender:</strong> ${escapeHtml(blueprint.gender === "female" ? "Female" : "Male")}</p>`,
    `<p><strong>Wealth:</strong> ${escapeHtml(blueprint.wealth)}</p>`,
    `<p><strong>Wealth distribution:</strong> ${escapeHtml(blueprint.wealthDistribution)}</p>`,
    `<p><strong>Portable wealth:</strong> ${escapeHtml(formatCopperValue(blueprint.wealthBudgetCp))} total; ${escapeHtml(formatCopperValue(blueprint.wealthCashCp))} carried as coin.</p>`,
    `<p><strong>Combat readiness:</strong> ${escapeHtml(blueprint.combatReadiness)}</p>`,
    `<p><strong>Weapon variety:</strong> ${escapeHtml(blueprint.weaponVariety)}</p>`,
    `<p><strong>Habitat:</strong> ${escapeHtml(blueprint.habitat)}</p>`,
    `<p><strong>Generation seed:</strong> ${escapeHtml(blueprint.generationSeed)}</p>`
  ];
  if (blueprint.groupType && blueprint.groupType !== GROUP_TYPES.independent.label) {
    rows.push(`<p><strong>Group:</strong> ${escapeHtml(blueprint.groupType)}</p>`);
    rows.push(`<p><strong>Group role:</strong> ${escapeHtml(blueprint.groupMemberRole)}</p>`);
    if (blueprint.familyStructure) rows.push(`<p><strong>Family structure:</strong> ${escapeHtml(blueprint.familyStructure)}</p>`);
    rows.push(`<p><strong>Group cohesion:</strong> ${escapeHtml(blueprint.groupCohesion)}</p>`);
    rows.push(`<p><strong>Hierarchy:</strong> ${escapeHtml(blueprint.groupHierarchy)}</p>`);
    rows.push(`<p><strong>Relationship density:</strong> ${escapeHtml(blueprint.relationshipDensity)}</p>`);
    rows.push(`<p><strong>Internal conflict:</strong> ${escapeHtml(blueprint.internalConflict)}</p>`);
  }
  rows.push(
    `<p><strong>First impression:</strong> ${escapeHtml(blueprint.impression)}.</p>`,
    `<p><strong>Drive:</strong> ${escapeHtml(blueprint.drive)}.</p>`,
    `<p><strong>Tell:</strong> ${escapeHtml(blueprint.tell)}.</p>`,
    `<p><strong>Quirk:</strong> ${escapeHtml(blueprint.quirk)}.</p>`
  );
  if (blueprint.relationship) rows.push(`<p><strong>Relationships:</strong> ${escapeHtml(blueprint.relationship)}</p>`);
  if (blueprint.groupRumour) rows.push(`<p><strong>Rumour:</strong> ${escapeHtml(blueprint.groupRumour)}.</p>`);
  if (blueprint.groupSecret) rows.push(`<p><strong>Secret:</strong> ${escapeHtml(blueprint.groupSecret)}.</p>`);
  return rows.join("");
}

export function generateNpcBlueprint(options = {}, random = Math.random) {
  const roles = getRoles();
  const role = roles[options.role] ?? roles.guard ?? ROLES.guard;
  const tier = resolveTierProfile(options);
  const race = resolveRace(options.species ?? "human", options.customSpecies ?? "");
  const styles = getNamingStyles();
  const style = styles[options.namingStyle] ?? styles.central ?? NAME_STYLES.central;
  const wealth = WEALTH_LEVELS[options.wealth] ?? WEALTH_LEVELS.average;
  const wealthBundle = buildWealthBundle({ wealth: options.wealth, distribution: options.wealthDistribution });
  const wealthDistribution = WEALTH_DISTRIBUTIONS[options.wealthDistribution] ?? WEALTH_DISTRIBUTIONS.mixed;
  const scores = buildAbilityScores(role, tier, random);
  const hitDie = race.size === "sm" ? 6 : 8;
  const hp = buildHitPoints(role, tier, scores.con, hitDie);
  const gender = options.gender === "female" ? "female" : "male";
  const generated = generatedName(style, random, options.forcedFamilyName ?? "", gender, options.namingStyle ?? "");
  const suppliedName = titleCase(options.customName ?? "");
  const name = suppliedName || generated;
  const combatItems = combatLoadout(options.role ?? DEFAULT_OPTIONS.role, options, tier.cr);

  return {
    name,
    roleId: options.role ?? DEFAULT_OPTIONS.role,
    role: role.label,
    roleVariant: String(options.roleVariant ?? ""),
    tier: tier.label,
    race: race.label,
    species: race.label,
    gender,
    wealth: wealth.label,
    wealthDistribution: wealthDistribution.label,
    wealthBudgetCp: wealthBundle.budgetCp,
    wealthCashCp: wealthBundle.cashCp,
    currency: wealthBundle.currency,
    wealthItems: wealthBundle.valuables,
    combatReadiness: (COMBAT_READINESS[options.combatReadiness] ?? COMBAT_READINESS.standard).label,
    weaponVariety: (WEAPON_VARIETY[options.weaponVariety] ?? WEAPON_VARIETY.mixed).label,
    generationSeed: String(options.generationSeed ?? options.seed ?? ""),
    combatItems,
    habitat: habitatLabel(options),
    cr: tier.cr,
    ac: armorClassFromLoadout(scores.dex, combatItems, tier),
    hp,
    speed: race.speed,
    size: race.size,
    abilities: scores,
    impression: pick(IMPRESSIONS, random),
    drive: pick(DRIVES, random),
    tell: pick(TELLS, random),
    quirk: pick(QUIRKS, random),
    groupType: "",
    groupMemberRole: "",
    familyStructure: "",
    groupCohesion: "",
    groupHierarchy: "",
    relationshipDensity: "",
    internalConflict: "",
    relationship: "",
    groupRumour: "",
    groupSecret: ""
  };
}

function practicalRoleForIndex(options, groupType, index) {
  const roleCycle = Array.isArray(groupType?.roleCycle) ? groupType.roleCycle : [];
  if (!groupType || groupType === GROUP_TYPES.independent || !roleCycle.length) return options.role;
  const roles = getRoles();
  if (index === 0) return roles[options.role] ? options.role : DEFAULT_OPTIONS.role;
  return roleCycle[(index - 1) % roleCycle.length] ?? options.role;
}

function relationshipFor(index, blueprints, options, isFamily) {
  if (blueprints.length < 2) return "";
  const current = blueprints[index];
  const previous = blueprints[(index - 1 + blueprints.length) % blueprints.length];
  const next = blueprints[(index + 1) % blueprints.length];
  const alternate = blueprints[(index + 2) % blueprints.length];
  const density = options.relationshipDensity ?? DEFAULT_OPTIONS.relationshipDensity;
  const conflict = options.internalConflict ?? DEFAULT_OPTIONS.internalConflict;
  const hierarchy = options.groupHierarchy ?? DEFAULT_OPTIONS.groupHierarchy;
  const cohesion = options.groupCohesion ?? DEFAULT_OPTIONS.groupCohesion;

  const ties = [];
  if (isFamily) {
    ties.push(`${current.name} relies on ${previous.name} for practical support`);
  } else if (cohesion === "close") {
    ties.push(`${current.name} trusts ${previous.name} enough to ask for help without explanation`);
  } else if (cohesion === "strained" || cohesion === "fractured") {
    ties.push(`${current.name} still works with ${previous.name}, but their trust has become conditional`);
  } else {
    ties.push(`${current.name} trusts ${previous.name} on routine matters`);
  }

  if (conflict === "high") {
    ties.push(isFamily
      ? `has a serious unresolved family disagreement with ${next.name}`
      : `has a serious unresolved dispute with ${next.name}`);
  } else if (conflict === "medium") {
    ties.push(isFamily
      ? `has a consequential unresolved family disagreement with ${next.name}`
      : `disagrees with ${next.name} over a consequential group decision`);
  } else if (conflict === "low") {
    ties.push(isFamily
      ? `has a smaller unresolved family disagreement with ${next.name}`
      : `regularly disagrees with ${next.name} over a smaller recurring issue`);
  } else if (density !== "light") {
    ties.push(`usually backs ${next.name} when outsiders challenge the group`);
  }

  if (density === "rich" || density === "tangled") {
    ties.push(`shares an older obligation with ${alternate.name}`);
  }
  if (density === "tangled" && blueprints.length > 3) {
    ties.push(`is unsure whether ${next.name} knows the full story behind that obligation`);
  }
  if (hierarchy === "rigid") {
    ties.push(`treats rank as a real boundary even in private`);
  } else if (hierarchy === "egalitarian") {
    ties.push(`expects major decisions to be argued through collectively`);
  }

  return `${ties.join("; ")}.`;
}

export function buildActorSource(blueprint, { folderId = null } = {}) {
  const abilities = Object.fromEntries(
    ABILITIES.map((ability) => [ability, { value: blueprint.abilities[ability] }])
  );

  return {
    name: blueprint.name,
    type: "npc",
    folder: folderId || null,
    img: "icons/svg/mystery-man.svg",
    system: {
      abilities,
      currency: { ...(blueprint.currency ?? { pp: 0, gp: 0, ep: 0, sp: 0, cp: 1 }) },
      attributes: {
        ac: {
          calc: "flat",
          flat: blueprint.ac
        },
        hp: {
          value: blueprint.hp.value,
          max: blueprint.hp.max,
          formula: blueprint.hp.formula
        },
        movement: {
          walk: blueprint.speed,
          units: "ft"
        }
      },
      details: {
        cr: blueprint.cr,
        type: {
          value: "humanoid",
          subtype: blueprint.race,
          swarm: "",
          custom: ""
        },
        biography: {
          value: buildBiography(blueprint),
          public: ""
        }
      },
      traits: {
        size: blueprint.size
      }
    },
    items: [
      ...(blueprint.combatItems ?? []).map((item) => ({
        name: item.name,
        type: "loot",
        img: "icons/svg/item-bag.svg",
        system: {
          quantity: 1,
          description: {
            value: `<p>${escapeHtml(`Role-appropriate ${item.kind} generated for ${blueprint.combatReadiness} combat readiness.`)}</p>`,
            chat: ""
          }
        },
        flags: {
          "runyth-npc-button": {
            generated: true,
            canonicalLookup: item.lookup ?? ""
          }
        }
      })),
      ...(blueprint.wealthItems ?? []).map((item) => ({
        name: item.name,
        type: "loot",
        img: "icons/svg/item-bag.svg",
        system: {
          quantity: 1,
          description: {
            value: `<p>${escapeHtml(`Portable personal wealth worth ${formatCopperValue(item.valueCp)}.`)}</p>`,
            chat: ""
          }
        },
        flags: {
          "runyth-npc-button": {
            generated: true,
            wealthValueCp: item.valueCp
          }
        }
      }))
    ],
    flags: {
      "runyth-npc-button": {
        generated: true,
        role: blueprint.role,
        roleVariant: blueprint.roleVariant,
        tier: blueprint.tier,
        wealth: blueprint.wealth,
        wealthDistribution: blueprint.wealthDistribution,
        wealthBudgetCp: blueprint.wealthBudgetCp,
        wealthCashCp: blueprint.wealthCashCp,
        combatReadiness: blueprint.combatReadiness,
        weaponVariety: blueprint.weaponVariety,
        generationSeed: blueprint.generationSeed,
        gender: blueprint.gender,
        habitat: blueprint.habitat,
        groupType: blueprint.groupType,
        groupMemberRole: blueprint.groupMemberRole,
        familyStructure: blueprint.familyStructure,
        groupCohesion: blueprint.groupCohesion,
        groupHierarchy: blueprint.groupHierarchy,
        relationshipDensity: blueprint.relationshipDensity,
        internalConflict: blueprint.internalConflict
      }
    }
  };
}

export function generateNpcBatch(options = {}) {
  const count = clamp(Number(options.count) || 1, 1, 100);
  const baseSeed = String(options.seed ?? "").trim() || createGenerationSeed();
  const random = createSeededRandom(baseSeed);
  const customName = String(options.customName ?? "").trim();
  const groupTypes = getGroupTypes();
  const groupType = groupTypes[options.groupType] ?? groupTypes.independent ?? GROUP_TYPES.independent;
  const family = options.groupType === "family";
  const styles = getNamingStyles();
  const style = styles[options.namingStyle] ?? styles.central ?? NAME_STYLES.central;
  const forcedFamilyName = family ? pick(style.family, random) : "";
  const raceAssignments = buildRaceAssignments(options, count, random);
  const roleAssignments = buildRoleAssignments(options, count, random, groupType);
  const genderAssignments = buildGenderAssignments(options, count, random);
  const sharedRumour = groupType === GROUP_TYPES.independent ? "" : pick(GROUP_RUMOURS, random);
  const sharedSecret = groupType === GROUP_TYPES.independent ? "" : pick(GROUP_SECRETS, random);
  const blueprints = [];
  const usedNames = new Set();

  for (let index = 0; index < count; index += 1) {
    let blueprint;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const race = raceAssignments[index] ?? { species: options.species, customSpecies: options.customSpecies };
      const roleAssignment = roleAssignments[index] ?? { role: options.role, variant: "" };
      const perNpcOptions = {
        ...options,
        ...race,
        role: roleAssignment.role,
        roleVariant: roleAssignment.variant,
        gender: genderAssignments[index] ?? GENDER_TUPLE[0],
        generationSeed: baseSeed,
        forcedFamilyName,
        customName: customName && count > 1 ? `${customName} ${index + 1}` : customName
      };
      blueprint = generateNpcBlueprint(perNpcOptions, random);
      if (!usedNames.has(blueprint.name)) break;
    }
    usedNames.add(blueprint.name);
    blueprint.groupType = groupType.label ?? "Group";
    const memberRoles = Array.isArray(groupType.memberRoles) && groupType.memberRoles.length ? groupType.memberRoles : ["Member"];
    blueprint.groupMemberRole = memberRoles[index % memberRoles.length] ?? "Member";
    blueprint.familyStructure = family
      ? (FAMILY_STRUCTURES[options.familyStructure] ?? FAMILY_STRUCTURES.household).label
      : "";
    blueprint.groupCohesion = (GROUP_COHESION[options.groupCohesion] ?? GROUP_COHESION.functional).label;
    blueprint.groupHierarchy = (GROUP_HIERARCHY[options.groupHierarchy] ?? GROUP_HIERARCHY.informal).label;
    blueprint.relationshipDensity = (RELATIONSHIP_DENSITY[options.relationshipDensity] ?? RELATIONSHIP_DENSITY.rich).label;
    blueprint.internalConflict = (INTERNAL_CONFLICT[options.internalConflict] ?? INTERNAL_CONFLICT.low).label;
    blueprint.groupRumour = sharedRumour;
    blueprint.groupSecret = sharedSecret;
    blueprints.push(blueprint);
  }

  if (groupType !== GROUP_TYPES.independent) {
    for (let index = 0; index < blueprints.length; index += 1) {
      blueprints[index].relationship = relationshipFor(index, blueprints, options, family);
    }
  }

  return blueprints;
}
