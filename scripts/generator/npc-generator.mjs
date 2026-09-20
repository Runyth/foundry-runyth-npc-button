import { DRIVES, IMPRESSIONS, NAME_STYLES, ROLES, SPECIES, TELLS, TIERS } from "./data.mjs";

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

function resolveSpecies(speciesKey, customSpecies) {
  const configured = SPECIES[speciesKey] ?? SPECIES.human;
  if (speciesKey !== "custom") return configured;

  const label = titleCase(customSpecies) || "Humanoid";
  return { ...configured, label };
}

function buildAbilityScores(role, tier, random) {
  const scores = {};
  for (const ability of ABILITIES) {
    const variance = Math.floor(random() * 5) - 2;
    const roleBias = role.biases[ability] ?? 0;
    scores[ability] = clamp(10 + roleBias + tier.abilityBonus + variance, 6, 20);
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

function buildBiography({ role, tier, species, impression, drive, tell }) {
  return [
    `<p><strong>Role:</strong> ${escapeHtml(role.label)} (${escapeHtml(tier.label)})</p>`,
    `<p><strong>Species:</strong> ${escapeHtml(species.label)}</p>`,
    `<p><strong>First impression:</strong> ${escapeHtml(impression)}.</p>`,
    `<p><strong>Drive:</strong> ${escapeHtml(drive)}.</p>`,
    `<p><strong>Tell:</strong> ${escapeHtml(tell)}.</p>`
  ].join("");
}

export function generateNpcBlueprint(options = {}, random = Math.random) {
  const role = ROLES[options.role] ?? ROLES.guard;
  const tier = TIERS[options.tier] ?? TIERS.trained;
  const species = resolveSpecies(options.species ?? "human", options.customSpecies ?? "");
  const style = NAME_STYLES[options.namingStyle] ?? NAME_STYLES.central;
  const scores = buildAbilityScores(role, tier, random);
  const hitDie = species.size === "sm" ? 6 : 8;
  const hp = buildHitPoints(role, tier, scores.con, hitDie);
  const generated = generatedName(style, random);
  const suppliedName = titleCase(options.customName ?? "");
  const name = suppliedName || generated;

  return {
    name,
    role: role.label,
    tier: tier.label,
    species: species.label,
    cr: tier.cr,
    ac: clamp(role.ac + tier.acBonus, 8, 22),
    hp,
    speed: species.speed,
    size: species.size,
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
          subtype: blueprint.species,
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
        tier: blueprint.tier
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
