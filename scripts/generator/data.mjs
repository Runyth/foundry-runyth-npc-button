export const ROLES = Object.freeze({
  civilian: {
    label: "Civilian",
    labelKey: "roles.civilian",
    ac: 10,
    hpBase: 5,
    biases: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  },
  guard: {
    label: "Guard",
    labelKey: "roles.guard",
    ac: 13,
    hpBase: 10,
    biases: { str: 2, dex: 0, con: 2, int: -1, wis: 1, cha: 0 }
  },
  scout: {
    label: "Scout",
    labelKey: "roles.scout",
    ac: 12,
    hpBase: 8,
    biases: { str: 0, dex: 3, con: 1, int: 0, wis: 2, cha: 0 }
  },
  bruiser: {
    label: "Bruiser",
    labelKey: "roles.bruiser",
    ac: 12,
    hpBase: 14,
    biases: { str: 3, dex: -1, con: 3, int: -1, wis: 0, cha: 0 }
  },
  specialist: {
    label: "Specialist",
    labelKey: "roles.specialist",
    ac: 11,
    hpBase: 8,
    biases: { str: -1, dex: 2, con: 0, int: 2, wis: 2, cha: 1 }
  },
  leader: {
    label: "Leader",
    labelKey: "roles.leader",
    ac: 13,
    hpBase: 12,
    biases: { str: 1, dex: 0, con: 2, int: 1, wis: 2, cha: 3 }
  }
});

export const TIERS = Object.freeze({
  ordinary: { label: "Ordinary", labelKey: "tiers.ordinary", cr: 0, acBonus: 0, hpMultiplier: 0.7, abilityBonus: -1 },
  trained: { label: "Trained", labelKey: "tiers.trained", cr: 0.125, acBonus: 1, hpMultiplier: 1.0, abilityBonus: 0 },
  veteran: { label: "Veteran", labelKey: "tiers.veteran", cr: 0.5, acBonus: 2, hpMultiplier: 1.8, abilityBonus: 1 },
  elite: { label: "Elite", labelKey: "tiers.elite", cr: 2, acBonus: 3, hpMultiplier: 3.0, abilityBonus: 2 },
  champion: { label: "Champion", labelKey: "tiers.champion", cr: 5, acBonus: 4, hpMultiplier: 5.0, abilityBonus: 3 }
});

export const SPECIES = Object.freeze({
  human: { label: "Human", labelKey: "species.human", size: "med", speed: 30 },
  elf: { label: "Elf", labelKey: "species.elf", size: "med", speed: 30 },
  dwarf: { label: "Dwarf", labelKey: "species.dwarf", size: "med", speed: 25 },
  halfling: { label: "Halfling", labelKey: "species.halfling", size: "sm", speed: 30 },
  orc: { label: "Orc", labelKey: "species.orc", size: "med", speed: 30 },
  goblin: { label: "Goblin", labelKey: "species.goblin", size: "sm", speed: 30 },
  custom: { label: "Custom", labelKey: "species.custom", size: "med", speed: 30 }
});

export const NAME_STYLES = Object.freeze({
  central: {
    label: "Central",
    labelKey: "naming.central",
    given: ["Aren", "Bren", "Calia", "Daro", "Elian", "Fenna", "Garen", "Hessa", "Iven", "Jora", "Kelan", "Lysa", "Maren", "Nella", "Orin", "Pera", "Rovan", "Sella", "Tarin", "Vera"],
    family: ["Alder", "Bell", "Crest", "Danner", "Eld", "Farrow", "Grain", "Holt", "Ives", "Kerr", "Lorn", "Morrow", "Nash", "Pell", "Rusk", "Sayer", "Tarn", "Vale", "Wren"]
  },
  coastal: {
    label: "Coastal",
    labelKey: "naming.coastal",
    given: ["Alda", "Bero", "Corin", "Dessa", "Eren", "Faro", "Gilda", "Harin", "Iria", "Joren", "Kessa", "Liro", "Mira", "Nero", "Ossa", "Rian", "Sora", "Tessa", "Varen"],
    family: ["Brine", "Cove", "Dale", "Firth", "Gull", "Harbor", "Keel", "Mast", "Nett", "Reef", "Salt", "Shoal", "Tide", "Wake", "Yard"]
  },
  highland: {
    label: "Highland",
    labelKey: "naming.highland",
    given: ["Ardan", "Brina", "Cael", "Dorna", "Edrin", "Fara", "Garr", "Hedra", "Ilda", "Korr", "Marda", "Nerin", "Orla", "Rann", "Siva", "Torren", "Vara"],
    family: ["Ashfell", "Blackridge", "Coldwater", "Deepwell", "Greyrock", "Highmere", "Ironfield", "Redstone", "Storme", "Thorn", "Westhill"]
  },
  frontier: {
    label: "Frontier",
    labelKey: "naming.frontier",
    given: ["Bram", "Cora", "Dain", "Etta", "Flint", "Greta", "Hale", "Joss", "Kitt", "Mara", "Noll", "Perrin", "Rhea", "Silas", "Toma", "Willa"],
    family: ["Barrow", "Cutler", "Ditch", "Field", "Grove", "Hearth", "Miller", "Reed", "Sawyer", "Stone", "Thatcher", "Wick"]
  }
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
