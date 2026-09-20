import {
  CR_VALUES,
  DRIVES,
  IMPRESSIONS,
  NAME_STYLES,
  RACES,
  ROLES,
  TELLS,
  TIERS,
  WEALTH_LEVELS,
  formatChallengeRating
} from "./data.mjs";
import { TIER_STYLES } from "../constants.mjs";

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

function interpolate(left, right, ratio) {
  return left + ((right - left) * ratio);
}

/**
 * Convert an exact CR choice into the coarse numeric knobs used by the local
 * MVP generator. CR itself remains exact; only the generated supporting stats
 * are interpolated between practical anchors.
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

function generatedName(style, random) {
  return `${pick(style.given, random)} ${pick(style.family, random)}`;
}

function buildBiography({ role, tier, race, wealth, impression, drive, tell }) {
  return [
    `<p><strong>Role:</strong> ${escapeHtml(role.label)} (${escapeHtml(tier.label)})</p>`,
    `<p><strong>Race:</strong> ${escapeHtml(race.label)}</p>`,
    `<p><strong>Wealth:</strong> ${escapeHtml(wealth.label)}</p>`,
    `<p><strong>First impression:</strong> ${escapeHtml(impression)}.</p>`,
    `<p><strong>Drive:</strong> ${escapeHtml(drive)}.</p>`,
    `<p><strong>Tell:</strong> ${escapeHtml(tell)}.</p>`
  ].join("");
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
  const generated = generatedName(style, random);
  const suppliedName = titleCase(options.customName ?? "");
  const name = suppliedName || generated;

  return {
    name,
    role: role.label,
    tier: tier.label,
    race: race.label,
    // Compatibility field retained for external consumers from earlier MVP releases.
    species: race.label,
    wealth: wealth.label,
    cr: tier.cr,
    ac: clamp(role.ac + tier.acBonus, 8, 30),
    hp,
    speed: race.speed,
    size: race.size,
    abilities: scores,
    impression: pick(IMPRESSIONS, random),
    drive: pick(DRIVES, random),
    tell: pick(TELLS, random)
  };
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
          value: buildBiography({
            role: { label: blueprint.role },
            tier: { label: blueprint.tier },
            race: { label: blueprint.race },
            wealth: { label: blueprint.wealth },
            impression: blueprint.impression,
            drive: blueprint.drive,
            tell: blueprint.tell
          }),
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
        wealth: blueprint.wealth
      }
    }
  };
}

export function generateNpcBatch(options = {}) {
  const count = clamp(Number(options.count) || 1, 1, 100);
  const baseSeed = String(options.seed ?? "").trim();
  const random = baseSeed ? createSeededRandom(baseSeed) : Math.random;
  const customName = String(options.customName ?? "").trim();
  const blueprints = [];
  const usedNames = new Set();

  for (let index = 0; index < count; index += 1) {
    let blueprint;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const perNpcOptions = {
        ...options,
        customName: customName && count > 1 ? `${customName} ${index + 1}` : customName
      };
      blueprint = generateNpcBlueprint(perNpcOptions, random);
      if (!usedNames.has(blueprint.name)) break;
    }
    usedNames.add(blueprint.name);
    blueprints.push(blueprint);
  }

  return blueprints;
}
