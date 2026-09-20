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
  formatChallengeRating
} from "./data.mjs";
import { DEFAULT_OPTIONS, TIER_STYLES } from "../constants.mjs";

const ABILITIES = Object.freeze(["str", "dex", "con", "int", "wis", "cha"]);

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
  const configured = RACES[raceKey] ?? RACES.human;
  if (raceKey !== "custom") return configured;

  const label = titleCase(customRace) || "Humanoid";
  return { ...configured, label };
}

function raceSelectionFromId(id) {
  const value = String(id ?? "").trim();
  if (value.startsWith("custom:")) {
    return { species: "custom", customSpecies: value.slice(7).trim() || "Humanoid" };
  }
  if (RACES[value] && value !== "custom") return { species: value, customSpecies: "" };
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
    : (RACES[options.species] ? options.species : "human");
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

/**
 * Build an exact-size race assignment plan. "Balanced" and weighted modes use
 * integer quotas before shuffling so small groups do not accidentally collapse
 * to one race because of repeated random draws.
 */
export function buildRaceAssignments(options = {}, count = 1, random = Math.random) {
  const total = clamp(Math.trunc(Number(count) || 1), 1, 100);
  if (options.raceComposition !== "mixed") {
    return Array.from({ length: total }, () => ({
      species: RACES[options.species] ? options.species : "human",
      customSpecies: options.species === "custom" ? String(options.customSpecies ?? "Humanoid") : ""
    }));
  }

  const ids = normalizeGroupRaceIds(options);
  if (ids.length === 1) {
    const only = raceSelectionFromId(ids[0]) ?? { species: "human", customSpecies: "" };
    return Array.from({ length: total }, () => ({ ...only }));
  }

  const primaryId = ids.includes(options.primaryRace) ? options.primaryRace : ids[0];
  const distribution = String(options.raceDistribution ?? "balanced");
  const weights = {};
  if (distribution === "primary" || distribution === "dominant") {
    const primaryShare = distribution === "dominant" ? 0.85 : 0.70;
    const minorityShare = (1 - primaryShare) / Math.max(1, ids.length - 1);
    for (const id of ids) weights[id] = id === primaryId ? primaryShare : minorityShare;
  } else if (distribution === "weighted") {
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

function generatedName(style, random, forcedFamilyName = "") {
  return `${pick(style.given, random)} ${forcedFamilyName || pick(style.family, random)}`;
}

function habitatLabel(options) {
  if (String(options.habitat ?? "").startsWith("custom:")) return titleCase(String(options.habitat).slice(7));
  return HABITATS[options.habitat]?.label ?? HABITATS.forestVillage.label;
}

function buildBiography(blueprint) {
  const rows = [
    `<p><strong>Role:</strong> ${escapeHtml(blueprint.role)} (${escapeHtml(blueprint.tier)})</p>`,
    `<p><strong>Race:</strong> ${escapeHtml(blueprint.race)}</p>`,
    `<p><strong>Wealth:</strong> ${escapeHtml(blueprint.wealth)}</p>`,
    `<p><strong>Habitat:</strong> ${escapeHtml(blueprint.habitat)}</p>`
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
  const role = ROLES[options.role] ?? ROLES.guard;
  const tier = resolveTierProfile(options);
  const race = resolveRace(options.species ?? "human", options.customSpecies ?? "");
  const style = NAME_STYLES[options.namingStyle] ?? NAME_STYLES.central;
  const wealth = WEALTH_LEVELS[options.wealth] ?? WEALTH_LEVELS.average;
  const scores = buildAbilityScores(role, tier, random);
  const hitDie = race.size === "sm" ? 6 : 8;
  const hp = buildHitPoints(role, tier, scores.con, hitDie);
  const generated = generatedName(style, random, options.forcedFamilyName ?? "");
  const suppliedName = titleCase(options.customName ?? "");
  const name = suppliedName || generated;

  return {
    name,
    role: role.label,
    tier: tier.label,
    race: race.label,
    species: race.label,
    wealth: wealth.label,
    habitat: habitatLabel(options),
    cr: tier.cr,
    ac: clamp(role.ac + tier.acBonus, 8, 30),
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
  if (!groupType || groupType === GROUP_TYPES.independent || !groupType.roleCycle.length) return options.role;
  if (index === 0) return ROLES[options.role] ? options.role : DEFAULT_OPTIONS.role;
  return groupType.roleCycle[(index - 1) % groupType.roleCycle.length] ?? options.role;
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
    flags: {
      "runyth-npc-button": {
        generated: true,
        role: blueprint.role,
        tier: blueprint.tier,
        wealth: blueprint.wealth,
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
  const baseSeed = String(options.seed ?? "").trim();
  const random = baseSeed ? createSeededRandom(baseSeed) : Math.random;
  const customName = String(options.customName ?? "").trim();
  const groupType = GROUP_TYPES[options.groupType] ?? GROUP_TYPES.independent;
  const family = options.groupType === "family";
  const style = NAME_STYLES[options.namingStyle] ?? NAME_STYLES.central;
  const forcedFamilyName = family ? pick(style.family, random) : "";
  const raceAssignments = buildRaceAssignments(options, count, random);
  const sharedRumour = groupType === GROUP_TYPES.independent ? "" : pick(GROUP_RUMOURS, random);
  const sharedSecret = groupType === GROUP_TYPES.independent ? "" : pick(GROUP_SECRETS, random);
  const blueprints = [];
  const usedNames = new Set();

  for (let index = 0; index < count; index += 1) {
    let blueprint;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const race = raceAssignments[index] ?? { species: options.species, customSpecies: options.customSpecies };
      const perNpcOptions = {
        ...options,
        ...race,
        role: practicalRoleForIndex(options, groupType, index),
        forcedFamilyName,
        customName: customName && count > 1 ? `${customName} ${index + 1}` : customName
      };
      blueprint = generateNpcBlueprint(perNpcOptions, random);
      if (!usedNames.has(blueprint.name)) break;
    }
    usedNames.add(blueprint.name);
    blueprint.groupType = groupType.label;
    blueprint.groupMemberRole = groupType.memberRoles[index % groupType.memberRoles.length] ?? "Member";
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
