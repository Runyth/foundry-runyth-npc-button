export const ROLES = Object.freeze({
  civilian: {
    label: "Civilian",
    labelKey: "roles.civilian",
    group: "everyday",
    ac: 10,
    hpBase: 5,
    biases: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    aiEquipmentHint: "ordinary clothing, a small purse, and one or two benign everyday possessions appropriate to their work or routine"
  },
  artisan: {
    label: "Artisan",
    labelKey: "roles.artisan",
    group: "everyday",
    ac: 10,
    hpBase: 6,
    biases: { str: 1, dex: 1, con: 1, int: 1, wis: 0, cha: 0 },
    aiEquipmentHint: "ordinary clothing, practical tools appropriate to a trade, a small purse, and a mundane work-related keepsake or supply"
  },
  merchant: {
    label: "Merchant",
    labelKey: "roles.merchant",
    group: "everyday",
    ac: 10,
    hpBase: 6,
    biases: { str: -1, dex: 0, con: 0, int: 2, wis: 1, cha: 2 },
    aiEquipmentHint: "ordinary or fine clothing according to wealth, a purse, a ledger or notes, and a few portable trade-related possessions"
  },
  acolyte: {
    label: "Acolyte",
    labelKey: "roles.acolyte",
    group: "learned",
    ac: 10,
    hpBase: 7,
    biases: { str: 0, dex: 0, con: 0, int: 1, wis: 3, cha: 1 },
    aiEquipmentHint: "a holy symbol or analogous devotional object, modest religious or ceremonial possessions, and a simple weapon only if appropriate"
  },
  scholar: {
    label: "Scholar",
    labelKey: "roles.scholar",
    group: "learned",
    ac: 10,
    hpBase: 6,
    biases: { str: -1, dex: 0, con: -1, int: 3, wis: 2, cha: 0 },
    aiEquipmentHint: "writing materials, notes or books, a small purse, and practical scholarly tools or curiosities"
  },
  specialist: {
    label: "Specialist",
    labelKey: "roles.specialist",
    group: "learned",
    ac: 11,
    hpBase: 8,
    biases: { str: -1, dex: 2, con: 0, int: 2, wis: 2, cha: 1 },
    aiEquipmentHint: "tools and portable equipment directly related to the NPC's specialty, plus a backup mundane implement and personal possessions"
  },
  guard: {
    label: "Guard",
    labelKey: "roles.guard",
    group: "martial",
    ac: 13,
    hpBase: 10,
    biases: { str: 2, dex: 0, con: 2, int: -1, wis: 1, cha: 0 },
    aiEquipmentHint: "a practical guard weapon, appropriate armor or shield, a whistle or signal item, and a small amount of personal gear"
  },
  scout: {
    label: "Scout",
    labelKey: "roles.scout",
    group: "martial",
    ac: 12,
    hpBase: 8,
    biases: { str: 0, dex: 3, con: 1, int: 0, wis: 2, cha: 0 },
    aiEquipmentHint: "a light ranged or finesse weapon, ammunition where relevant, a knife or utility blade, travel gear, and navigation or observation items"
  },
  bruiser: {
    label: "Bruiser",
    labelKey: "roles.bruiser",
    group: "martial",
    ac: 12,
    hpBase: 14,
    biases: { str: 3, dex: -1, con: 3, int: -1, wis: 0, cha: 0 },
    aiEquipmentHint: "a heavy or simple close-combat weapon, tough practical clothing or armor, and a few rugged personal possessions"
  },
  soldier: {
    label: "Soldier",
    labelKey: "roles.soldier",
    group: "martial",
    ac: 14,
    hpBase: 12,
    biases: { str: 2, dex: 1, con: 2, int: 0, wis: 1, cha: 0 },
    aiEquipmentHint: "a military weapon, appropriate armor, possibly a shield, and disciplined field gear suitable for the NPC's wealth and station"
  },
  leader: {
    label: "Leader",
    labelKey: "roles.leader",
    group: "authority",
    ac: 13,
    hpBase: 12,
    biases: { str: 1, dex: 0, con: 2, int: 1, wis: 2, cha: 3 },
    aiEquipmentHint: "good-quality practical equipment, a recognizable badge or sign of authority, a purse, and one possession connected to current responsibilities"
  },
  noble: {
    label: "Noble",
    labelKey: "roles.noble",
    group: "authority",
    ac: 11,
    hpBase: 8,
    biases: { str: 0, dex: 1, con: 0, int: 2, wis: 1, cha: 3 },
    aiEquipmentHint: "fine clothing or accessories, a signet or equivalent status object, a well-stocked purse, and tasteful personal possessions appropriate to status"
  }
});

export const ROLE_GROUPS = Object.freeze(["everyday", "learned", "martial", "authority"]);

export const TIERS = Object.freeze({
  ordinary: { label: "Ordinary", labelKey: "tiers.ordinary", cr: 0, acBonus: 0, hpMultiplier: 0.7, abilityBonus: -1 },
  trained: { label: "Trained", labelKey: "tiers.trained", cr: 0.125, acBonus: 1, hpMultiplier: 1.0, abilityBonus: 0 },
  veteran: { label: "Veteran", labelKey: "tiers.veteran", cr: 0.5, acBonus: 2, hpMultiplier: 1.8, abilityBonus: 1 },
  elite: { label: "Elite", labelKey: "tiers.elite", cr: 2, acBonus: 3, hpMultiplier: 3.0, abilityBonus: 2 },
  champion: { label: "Champion", labelKey: "tiers.champion", cr: 5, acBonus: 4, hpMultiplier: 5.0, abilityBonus: 3 }
});

export const CR_VALUES = Object.freeze([
  0, 0.125, 0.25, 0.5,
  ...Array.from({ length: 30 }, (_, index) => index + 1)
]);

export function formatChallengeRating(value) {
  const cr = Number(value);
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}

export const RACES = Object.freeze({
  human: { label: "Human", labelKey: "races.human", group: "common", size: "med", speed: 30 },
  elf: { label: "Elf", labelKey: "races.elf", group: "common", size: "med", speed: 30 },
  dwarf: { label: "Dwarf", labelKey: "races.dwarf", group: "common", size: "med", speed: 30 },
  halfling: { label: "Halfling", labelKey: "races.halfling", group: "common", size: "sm", speed: 30 },
  orc: { label: "Orc", labelKey: "races.orc", group: "common", size: "med", speed: 30 },
  goblin: { label: "Goblin", labelKey: "races.goblin", group: "other", size: "sm", speed: 30 },
  custom: { label: "Custom", labelKey: "races.custom", group: "custom", size: "med", speed: 30 }
});

// Compatibility alias for internal code and public consumers from earlier MVP releases.
export const SPECIES = RACES;
export const RACE_GROUPS = Object.freeze(["common", "other"]);

export const NAME_STYLES = Object.freeze({
  central: {
    label: "Central",
    labelKey: "naming.central",
    descriptionKey: "namingDescriptions.central",
    group: "regional",
    given: ["Aren", "Bren", "Calia", "Daro", "Elian", "Fenna", "Garen", "Hessa", "Iven", "Jora", "Kelan", "Lysa", "Maren", "Nella", "Orin", "Pera", "Rovan", "Sella", "Tarin", "Vera"],
    family: ["Alder", "Bell", "Crest", "Danner", "Eld", "Farrow", "Grain", "Holt", "Ives", "Kerr", "Lorn", "Morrow", "Nash", "Pell", "Rusk", "Sayer", "Tarn", "Vale", "Wren"]
  },
  coastal: {
    label: "Coastal",
    labelKey: "naming.coastal",
    descriptionKey: "namingDescriptions.coastal",
    group: "regional",
    given: ["Alda", "Bero", "Corin", "Dessa", "Eren", "Faro", "Gilda", "Harin", "Iria", "Joren", "Kessa", "Liro", "Mira", "Nero", "Ossa", "Rian", "Sora", "Tessa", "Varen"],
    family: ["Brine", "Cove", "Dale", "Firth", "Gull", "Harbor", "Keel", "Mast", "Nett", "Reef", "Salt", "Shoal", "Tide", "Wake", "Yard"]
  },
  highland: {
    label: "Highland",
    labelKey: "naming.highland",
    descriptionKey: "namingDescriptions.highland",
    group: "regional",
    given: ["Ardan", "Brina", "Cael", "Dorna", "Edrin", "Fara", "Garr", "Hedra", "Ilda", "Korr", "Marda", "Nerin", "Orla", "Rann", "Siva", "Torren", "Vara"],
    family: ["Ashfell", "Blackridge", "Coldwater", "Deepwell", "Greyrock", "Highmere", "Ironfield", "Redstone", "Storme", "Thorn", "Westhill"]
  },
  frontier: {
    label: "Frontier",
    labelKey: "naming.frontier",
    descriptionKey: "namingDescriptions.frontier",
    group: "regional",
    given: ["Bram", "Cora", "Dain", "Etta", "Flint", "Greta", "Hale", "Joss", "Kitt", "Mara", "Noll", "Perrin", "Rhea", "Silas", "Toma", "Willa"],
    family: ["Barrow", "Cutler", "Ditch", "Field", "Grove", "Hearth", "Miller", "Reed", "Sawyer", "Stone", "Thatcher", "Wick"]
  }
});

export const NAMING_GROUPS = Object.freeze(["regional"]);

export const WEALTH_LEVELS = Object.freeze({
  poor: { label: "Poor", labelKey: "wealth.poor", prompt: "poor: very little cash, patched or inexpensive possessions, only essential gear" },
  average: { label: "Average", labelKey: "wealth.average", prompt: "average: ordinary practical possessions and a modest amount of everyday spending money" },
  wellOff: { label: "Well-Off", labelKey: "wealth.wellOff", prompt: "well-off: visibly better-quality possessions, spare money, and a few comfort or status items" },
  elite: { label: "Elite", labelKey: "wealth.elite", prompt: "elite: expensive or high-status possessions, substantial readily carried funds, and premium-quality personal gear" }
});

export const IMPRESSIONS = Object.freeze([
  "measured and observant",
  "plain-spoken and difficult to distract",
  "quick to smile, but slow to trust",
  "formal even in casual conversation",
  "restless and constantly scanning the room",
  "soft-spoken with an unexpectedly firm stare",
  "practical, clipped, and impatient with ceremony",
  "careful with every word and every promise"
]);

export const DRIVES = Object.freeze([
  "keep a vulnerable relative out of trouble",
  "earn enough coin to leave this district behind",
  "prove that a recent failure was not their fault",
  "protect a reputation built over many years",
  "find the person who owes them a serious debt",
  "secure a safer future before taking another risk",
  "learn who has been quietly undermining their work",
  "finish one last obligation before disappearing"
]);

export const TELLS = Object.freeze([
  "counts exits before sitting down",
  "touches a worn ring when thinking",
  "repeats the final word of difficult questions",
  "keeps their hands visible whenever possible",
  "checks the room whenever a door opens",
  "straightens nearby objects without noticing",
  "avoids using names until trust is established",
  "lowers their voice whenever money is mentioned"
]);
