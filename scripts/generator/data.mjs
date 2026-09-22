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

// Built-in standard 2024 Player's Handbook race catalog. The UI intentionally
// uses the user's preferred "Race" wording while the rules source uses Species.
export const RACES = Object.freeze({
  human: { label: "Human", labelKey: "races.human", group: "phb2024", size: "med", speed: 30 },
  aasimar: { label: "Aasimar", labelKey: "races.aasimar", group: "phb2024", size: "med", speed: 30 },
  dragonborn: { label: "Dragonborn", labelKey: "races.dragonborn", group: "phb2024", size: "med", speed: 30 },
  dwarf: { label: "Dwarf", labelKey: "races.dwarf", group: "phb2024", size: "med", speed: 30 },
  elf: { label: "Elf", labelKey: "races.elf", group: "phb2024", size: "med", speed: 30 },
  gnome: { label: "Gnome", labelKey: "races.gnome", group: "phb2024", size: "sm", speed: 30 },
  goliath: { label: "Goliath", labelKey: "races.goliath", group: "phb2024", size: "med", speed: 35 },
  halfling: { label: "Halfling", labelKey: "races.halfling", group: "phb2024", size: "sm", speed: 30 },
  orc: { label: "Orc", labelKey: "races.orc", group: "phb2024", size: "med", speed: 30 },
  tiefling: { label: "Tiefling", labelKey: "races.tiefling", group: "phb2024", size: "med", speed: 30 },
  custom: { label: "Custom", labelKey: "races.custom", group: "custom", size: "med", speed: 30 }
});

// Compatibility alias for internal code and public consumers from earlier MVP releases.
export const SPECIES = RACES;
export const RACE_GROUPS = Object.freeze(["phb2024"]);

export const NAME_STYLES = Object.freeze({
  central: {
    label: "Central",
    labelKey: "naming.central",
    descriptionKey: "namingDescriptions.central",
    group: "regional",
    aiGuidance: "settled inland names with a natural mix of soft and firm consonants; surnames should feel inherited, occupational, topographic, or old-town rather than mechanically fantasy-compounded",
    given: ["Aren", "Bren", "Calia", "Daro", "Elian", "Fenna", "Garen", "Hessa", "Iven", "Jora", "Kelan", "Lysa", "Maren", "Nella", "Orin", "Pera", "Rovan", "Sella", "Tarin", "Vera", "Aldren", "Mira", "Tomas", "Elira", "Corven", "Nadia"],
    family: ["Alder", "Bell", "Crest", "Danner", "Eld", "Farrow", "Grain", "Holt", "Ives", "Kerr", "Lorn", "Morrow", "Nash", "Pell", "Rusk", "Sayer", "Tarn", "Vale", "Wren", "Halden", "Voss", "Mercer", "Deyne", "Kester"],
    examples: [
      "Aldren Voss", "Mira Halden", "Elian Mercer", "Fenna Danner", "Tomas Vale", "Calia Morrow",
      "Iven Kester", "Nadia Pell", "Rovan Sayer", "Lysa Bell", "Corven Farrow", "Jora Wren"
    ]
  },
  coastal: {
    label: "Coastal",
    labelKey: "naming.coastal",
    descriptionKey: "namingDescriptions.coastal",
    group: "regional",
    aiGuidance: "port, fishing, island, and sea-trade names with open vowels and fluid rhythms; surnames may evoke navigation, vessels, tides, shoreline work, or old harbor families without becoming parody pirate names",
    given: ["Alda", "Bero", "Corin", "Dessa", "Eren", "Faro", "Gilda", "Harin", "Iria", "Joren", "Kessa", "Liro", "Mira", "Nero", "Ossa", "Rian", "Sora", "Tessa", "Varen", "Maela", "Orro", "Selka", "Tavian", "Ivena"],
    family: ["Brine", "Cove", "Dale", "Firth", "Gull", "Harbor", "Keel", "Mast", "Nett", "Reef", "Salt", "Shoal", "Tide", "Wake", "Yard", "Marrow", "Vane", "Sound", "Rook", "Dory"],
    examples: [
      "Maela Vane", "Joren Firth", "Selka Nett", "Tavian Wake", "Iria Sound", "Corin Rook",
      "Dessa Keel", "Varen Marrow", "Ossa Tide", "Bero Shoal", "Tessa Cove", "Liro Dory"
    ]
  },
  highland: {
    label: "Highland",
    labelKey: "naming.highland",
    descriptionKey: "namingDescriptions.highland",
    group: "regional",
    aiGuidance: "upland and mountain-settlement names with sturdy consonants, clipped rhythms, and old lineage or landscape surnames; names should feel lived-in, not like random strings of hard consonants",
    given: ["Ardan", "Brina", "Cael", "Dorna", "Edrin", "Fara", "Garr", "Hedra", "Ilda", "Korr", "Marda", "Nerin", "Orla", "Rann", "Siva", "Torren", "Vara", "Brenna", "Davor", "Eira", "Hakon", "Merren"],
    family: ["Ashfell", "Blackridge", "Coldwater", "Deepwell", "Greyrock", "Highmere", "Ironfield", "Redstone", "Storme", "Thorn", "Westhill", "Brae", "Dunrock", "Fellward", "Kern", "Muir"],
    examples: [
      "Brenna Muir", "Torren Ashfell", "Eira Brae", "Davor Kern", "Orla Fellward", "Hakon Dunrock",
      "Marda Greyrock", "Nerin Highmere", "Siva Redstone", "Ardan Thorn", "Hedra Coldwater", "Merren Westhill"
    ]
  },
  frontier: {
    label: "Frontier",
    labelKey: "naming.frontier",
    descriptionKey: "namingDescriptions.frontier",
    group: "regional",
    aiGuidance: "practical farm, trade, borderland, and new-settlement names; surnames often come from occupations, holdings, landmarks, nicknames, or recently established family names",
    given: ["Bram", "Cora", "Dain", "Etta", "Flint", "Greta", "Hale", "Joss", "Kitt", "Mara", "Noll", "Perrin", "Rhea", "Silas", "Toma", "Willa", "Ada", "Cole", "Emmet", "Nessa", "Ruth", "Tobin"],
    family: ["Barrow", "Cutler", "Ditch", "Field", "Grove", "Hearth", "Miller", "Reed", "Sawyer", "Stone", "Thatcher", "Wick", "Cobb", "Fletcher", "Pike", "Roper", "Tanner", "Webb"],
    examples: [
      "Mara Reed", "Tobin Fletcher", "Greta Tanner", "Silas Cobb", "Cora Barrow", "Emmet Sawyer",
      "Rhea Wick", "Bram Miller", "Nessa Roper", "Cole Pike", "Willa Hearth", "Dain Thatcher"
    ]
  }
});

export const NAMING_GROUPS = Object.freeze(["regional"]);

export const HABITATS = Object.freeze({
  forestVillage: { label: "Forest Village", labelKey: "habitats.forestVillage", group: "settled", prompt: "a normal temperate forest village with nearby fields, woodland paths, timber buildings, wells, workshops, and local trade" },
  farmingHamlet: { label: "Farming Hamlet", labelKey: "habitats.farmingHamlet", group: "settled", prompt: "a small agricultural hamlet surrounded by fields, pasture, barns, and local roads" },
  marketTown: { label: "Market Town", labelKey: "habitats.marketTown", group: "settled", prompt: "a busy regional market town with trades, inns, carts, workshops, and mixed social classes" },
  cityDistrict: { label: "City District", labelKey: "habitats.cityDistrict", group: "settled", prompt: "a dense city district shaped by guilds, tenements, shops, watch patrols, and urban social networks" },
  deepForest: { label: "Deep Forest", labelKey: "habitats.deepForest", group: "wild", prompt: "deep woodland far from major settlements, with isolated tracks, hunters, foresters, shrines, and dangerous wilderness nearby" },
  plains: { label: "Open Plains / Steppe", labelKey: "habitats.plains", group: "wild", prompt: "open plains or steppe where long-distance travel, herding, exposed weather, and mobile communities shape daily life" },
  jungle: { label: "Jungle Region", labelKey: "habitats.jungle", group: "wild", prompt: "a humid jungle region with dense vegetation, rivers, insects, difficult travel, and settlements adapted to heat and rain" },
  desertOasis: { label: "Desert Oasis", labelKey: "habitats.desertOasis", group: "arid", prompt: "a desert oasis settlement where water, shade, caravans, wells, and heat shape wealth and social power" },
  desertRoute: { label: "Desert Caravan Route", labelKey: "habitats.desertRoute", group: "arid", prompt: "a harsh desert caravan route with sparse wells, trade camps, guides, guards, pack animals, and long travel between settlements" },
  badlands: { label: "Badlands", labelKey: "habitats.badlands", group: "arid", prompt: "dry broken badlands with ravines, dust, scarce water, exposed rock, and scattered hard-scrabble settlements" },
  riverlands: { label: "Riverlands", labelKey: "habitats.riverlands", group: "water", prompt: "a settled river region built around ferries, mills, fishing, barges, floodplains, and river trade" },
  wetlands: { label: "Marsh / Wetlands", labelKey: "habitats.wetlands", group: "water", prompt: "marshes and wetlands with raised paths, boats, reeds, fishing, damp weather, and difficult overland travel" },
  lakeside: { label: "Lakeside Region", labelKey: "habitats.lakeside", group: "water", prompt: "a lakeside region with fishing, ferries, lakeshore farms, boat travel, and communities facing seasonal weather" },
  coast: { label: "Coastal Region", labelKey: "habitats.coast", group: "water", prompt: "a coastal region of beaches, cliffs, fishing settlements, salt air, storms, and maritime trade" },
  portCity: { label: "Port City", labelKey: "habitats.portCity", group: "water", prompt: "a busy port city with docks, warehouses, sailors, merchants, foreigners, customs officials, and waterfront crime" },
  island: { label: "Island", labelKey: "habitats.island", group: "water", prompt: "an island community where boats, limited land, fishing, local kinship, imported goods, and isolation matter" },
  foothills: { label: "Mountain Foothills", labelKey: "habitats.foothills", group: "rugged", prompt: "foothills below a mountain range with mines, shepherding, steep roads, forests, stonework, and isolated valleys" },
  mountains: { label: "Mountain Region", labelKey: "habitats.mountains", group: "rugged", prompt: "a high mountain region with steep passes, rock, snow, mines, fortifications, hardy livestock, and difficult travel" },
  highPlateau: { label: "High Plateau", labelKey: "habitats.highPlateau", group: "rugged", prompt: "a windswept high plateau with sparse settlements, exposed travel, grazing, cold nights, and long sightlines" },
  tundra: { label: "Tundra / Far North", labelKey: "habitats.tundra", group: "cold", prompt: "a cold tundra or far-northern region with short growing seasons, scarce timber, hunting, preserved food, and severe weather" },
  underground: { label: "Underground Settlement", labelKey: "habitats.underground", group: "unusual", prompt: "an underground settlement shaped by caverns, mines, artificial light, ventilation, narrow routes, and subterranean trade" },
  ruinedFrontier: { label: "Ruined Frontier", labelKey: "habitats.ruinedFrontier", group: "unusual", prompt: "a frontier of abandoned forts, ruined settlements, scavenged stone, uncertain authority, and dangerous old roads" }
});

export const HABITAT_GROUPS = Object.freeze(["settled", "wild", "arid", "water", "rugged", "cold", "unusual"]);

export const GROUP_TYPES = Object.freeze({
  independent: {
    label: "Independent NPCs",
    labelKey: "groupTypes.independent",
    group: "individual",
    minCount: 1,
    suggestedSizes: [1, 3, 5, 10],
    prompt: "Generate distinct individuals. They may know one another when that is natural, but they do not need to form one organized group.",
    memberRoles: ["Individual"],
    roleCycle: []
  },
  family: {
    label: "Family Household",
    labelKey: "groupTypes.family",
    group: "household",
    minCount: 2,
    suggestedSizes: [3, 4, 5, 6, 8],
    prompt: "Generate one believable family household with explicit kinship, responsibilities, shared history, affection and friction. Every family member needs a small personal quirk, a clear place in the household, and at least one relationship detail tied to another generated relative.",
    memberRoles: ["Household head", "Partner or co-head", "Elder relative", "Adult child", "Younger relative", "Cousin or sibling", "In-law", "Dependent relative"],
    roleCycle: ["civilian", "artisan", "merchant", "civilian", "scholar", "specialist"]
  },
  nobleHousehold: {
    label: "Noble Household",
    labelKey: "groupTypes.nobleHousehold",
    group: "household",
    minCount: 3,
    suggestedSizes: [4, 6, 8, 10, 12],
    prompt: "Generate a noble household mixing relatives, retainers, attendants, and trusted staff. Status, inheritance, obligations, private loyalties, and household reputation should create useful relationships and secrets.",
    memberRoles: ["Household lord or lady", "Heir", "Close relative", "Steward", "House guard", "Attendant", "Tutor or chaplain", "Retainer"],
    roleCycle: ["noble", "noble", "leader", "specialist", "guard", "civilian", "scholar", "soldier"]
  },
  guardPatrol: {
    label: "Guard Patrol",
    labelKey: "groupTypes.guardPatrol",
    group: "security",
    minCount: 2,
    suggestedSizes: [2, 4, 6, 8, 10],
    prompt: "Generate a functioning guard patrol with a chain of responsibility, professional habits, small rivalries, watch routines, shared incidents, and varied experience levels.",
    memberRoles: ["Patrol leader", "Senior guard", "Shieldmate", "Lookout", "Rookie", "Relief guard"],
    roleCycle: ["leader", "guard", "guard", "scout", "guard", "soldier"]
  },
  watchShift: {
    label: "Town Watch Shift",
    labelKey: "groupTypes.watchShift",
    group: "security",
    minCount: 3,
    suggestedSizes: [4, 6, 8, 10, 12],
    prompt: "Generate one town-watch shift with officers, gate or street assignments, familiar local problems, grudges, favors owed, and differing attitudes toward enforcement.",
    memberRoles: ["Watch officer", "Desk sergeant", "Street guard", "Gate guard", "Runner", "Investigator", "Rookie"],
    roleCycle: ["leader", "guard", "guard", "soldier", "scout", "specialist", "guard"]
  },
  militia: {
    label: "Local Militia",
    labelKey: "groupTypes.militia",
    group: "security",
    minCount: 3,
    suggestedSizes: [5, 8, 10, 15, 20],
    prompt: "Generate a local militia whose members have civilian lives as well as emergency martial duties. Include uneven training, local kinship, practical equipment, and reasons they joined.",
    memberRoles: ["Militia captain", "Veteran", "Spearman", "Archer", "Quartermaster", "Volunteer", "Messenger"],
    roleCycle: ["leader", "soldier", "guard", "scout", "artisan", "civilian", "scout"]
  },
  mercenaryBand: {
    label: "Mercenary Band",
    labelKey: "groupTypes.mercenaryBand",
    group: "security",
    minCount: 3,
    suggestedSizes: [4, 6, 8, 12, 20],
    prompt: "Generate a paid fighting band with contract concerns, chain of command, specialties, past campaigns, pay disputes, professional pride, and differing appetite for risk.",
    memberRoles: ["Captain", "Second", "Veteran", "Scout", "Heavy", "Crossbowman", "Quartermaster", "Camp specialist"],
    roleCycle: ["leader", "soldier", "soldier", "scout", "bruiser", "guard", "specialist", "artisan"]
  },
  orcRaiders: {
    label: "Orc Raider Band",
    labelKey: "groupTypes.orcRaiders",
    group: "outlaw",
    minCount: 3,
    suggestedSizes: [4, 6, 8, 12, 20],
    prompt: "Generate a coherent raider band rather than interchangeable enemies. Give members differing jobs, loyalties, motives for raiding, disputes over risk and loot, and useful personal history. The default thematic race is Orc unless the user chooses mixed races.",
    memberRoles: ["Raid leader", "Second", "Bruiser", "Skirmisher", "Lookout", "Loot-bearer", "Tracker", "Camp hand"],
    roleCycle: ["leader", "soldier", "bruiser", "scout", "scout", "civilian", "specialist", "artisan"]
  },
  banditCrew: {
    label: "Bandit Crew",
    labelKey: "groupTypes.banditCrew",
    group: "outlaw",
    minCount: 3,
    suggestedSizes: [4, 6, 8, 10, 15],
    prompt: "Generate a bandit crew with reasons for outlawry, preferred targets, a practical division of labor, internal trust problems, and specific ties to roads, settlements, or victims.",
    memberRoles: ["Boss", "Second", "Ambusher", "Lookout", "Enforcer", "Fence contact", "Camp keeper"],
    roleCycle: ["leader", "guard", "scout", "scout", "bruiser", "merchant", "civilian"]
  },
  criminalCell: {
    label: "Criminal Cell",
    labelKey: "groupTypes.criminalCell",
    group: "outlaw",
    minCount: 3,
    suggestedSizes: [3, 5, 6, 8, 10],
    prompt: "Generate a small criminal cell with compartmentalized jobs, contacts, suspicion, blackmail material, financial pressure, and operational habits.",
    memberRoles: ["Coordinator", "Fixer", "Lookout", "Muscle", "Smuggler", "Forger", "Fence"],
    roleCycle: ["leader", "specialist", "scout", "bruiser", "merchant", "specialist", "merchant"]
  },
  caravan: {
    label: "Caravan",
    labelKey: "groupTypes.caravan",
    group: "travelWork",
    minCount: 3,
    suggestedSizes: [5, 8, 10, 15, 20],
    prompt: "Generate a traveling caravan with merchants, drivers, guards, specialists, passengers, practical cargo concerns, road relationships, debts, and destination goals.",
    memberRoles: ["Caravan master", "Merchant", "Driver", "Guard", "Scout", "Drover", "Cook or repairer", "Passenger"],
    roleCycle: ["leader", "merchant", "civilian", "guard", "scout", "artisan", "specialist", "civilian"]
  },
  guildCrew: {
    label: "Guild Work Crew",
    labelKey: "groupTypes.guildCrew",
    group: "travelWork",
    minCount: 3,
    suggestedSizes: [3, 5, 6, 8, 10],
    prompt: "Generate a professional guild crew with different levels of seniority, tools, work habits, apprenticeships, workplace gossip, and responsibility for a concrete job.",
    memberRoles: ["Master", "Journeyman", "Specialist", "Apprentice", "Laborer", "Clerk"],
    roleCycle: ["leader", "artisan", "specialist", "artisan", "civilian", "scholar"]
  },
  shipCrew: {
    label: "Ship Crew",
    labelKey: "groupTypes.shipCrew",
    group: "travelWork",
    minCount: 3,
    suggestedSizes: [5, 8, 10, 15, 20],
    prompt: "Generate a working ship crew with rank, watches, practical seamanship jobs, shared voyages, port connections, superstitions, and disputes over duty or profit.",
    memberRoles: ["Captain", "Mate", "Navigator", "Boatswain", "Sailor", "Marine", "Cook", "Shipwright"],
    roleCycle: ["leader", "soldier", "specialist", "artisan", "civilian", "guard", "civilian", "artisan"]
  },
  huntingParty: {
    label: "Hunting Party",
    labelKey: "groupTypes.huntingParty",
    group: "travelWork",
    minCount: 2,
    suggestedSizes: [3, 4, 5, 6, 8],
    prompt: "Generate a hunting party with trackers, shooters, handlers, camp duties, knowledge of local terrain, differing reasons for the hunt, and shared wilderness incidents.",
    memberRoles: ["Hunt leader", "Tracker", "Archer", "Handler", "Camp hand", "Local guide"],
    roleCycle: ["leader", "scout", "scout", "specialist", "civilian", "specialist"]
  },
  expedition: {
    label: "Expedition Team",
    labelKey: "groupTypes.expedition",
    group: "travelWork",
    minCount: 3,
    suggestedSizes: [4, 6, 8, 10, 12],
    prompt: "Generate an expedition with leadership, guides, specialists, guards, labor, supplies, a clear objective, competing priorities, and risks that create relationship pressure.",
    memberRoles: ["Expedition leader", "Guide", "Scholar", "Guard", "Specialist", "Porter", "Scout"],
    roleCycle: ["leader", "scout", "scholar", "guard", "specialist", "civilian", "scout"]
  },
  templeHousehold: {
    label: "Temple Household",
    labelKey: "groupTypes.templeHousehold",
    group: "community",
    minCount: 3,
    suggestedSizes: [4, 6, 8, 10, 12],
    prompt: "Generate a temple household with clergy, lay helpers, caretakers, petitioners or guards, internal doctrine or duty disagreements, and ties to the surrounding community.",
    memberRoles: ["Senior priest", "Acolyte", "Caretaker", "Lay helper", "Temple guard", "Scribe", "Petitioner"],
    roleCycle: ["leader", "acolyte", "civilian", "civilian", "guard", "scholar", "civilian"]
  },
  villageCouncil: {
    label: "Village Council",
    labelKey: "groupTypes.villageCouncil",
    group: "community",
    minCount: 3,
    suggestedSizes: [3, 5, 6, 7, 9],
    prompt: "Generate a village council with different local constituencies, practical responsibilities, old relationships, competing priorities, and private knowledge about the settlement.",
    memberRoles: ["Headman or mayor", "Elder", "Guild voice", "Farmer representative", "Temple voice", "Watch voice", "Clerk"],
    roleCycle: ["leader", "civilian", "artisan", "civilian", "acolyte", "guard", "scholar"]
  },
  pilgrims: {
    label: "Pilgrim Company",
    labelKey: "groupTypes.pilgrims",
    group: "community",
    minCount: 3,
    suggestedSizes: [4, 6, 8, 10, 15],
    prompt: "Generate a pilgrim company with different reasons for traveling, practical travel roles, faith or doubt, mutual aid, tensions, and stories accumulated on the road.",
    memberRoles: ["Pilgrim guide", "Devout pilgrim", "Doubter", "Caretaker", "Guard", "Elder traveler", "Young traveler"],
    roleCycle: ["leader", "acolyte", "civilian", "civilian", "guard", "civilian", "civilian"]
  },
  refugeeParty: {
    label: "Refugee Party",
    labelKey: "groupTypes.refugeeParty",
    group: "community",
    minCount: 3,
    suggestedSizes: [5, 8, 10, 15, 20],
    prompt: "Generate displaced people with varied former occupations, family or neighbor ties, scarce possessions, immediate practical needs, grief or hope, and differing plans for what comes next.",
    memberRoles: ["Informal organizer", "Parent or carer", "Craftsperson", "Former guard", "Healer", "Laborer", "Elder", "Young adult"],
    roleCycle: ["leader", "civilian", "artisan", "guard", "specialist", "civilian", "civilian", "civilian"]
  }
});

export const GROUP_TYPE_GROUPS = Object.freeze(["individual", "household", "security", "outlaw", "travelWork", "community"]);

export const FAMILY_STRUCTURES = Object.freeze({
  household: { label: "Single household", labelKey: "familyStructures.household" },
  multiGeneration: { label: "Multi-generational", labelKey: "familyStructures.multiGeneration" },
  extendedKin: { label: "Extended kin", labelKey: "familyStructures.extendedKin" },
  siblings: { label: "Siblings / cousins", labelKey: "familyStructures.siblings" },
  blended: { label: "Blended household", labelKey: "familyStructures.blended" }
});

export const GROUP_COHESION = Object.freeze({
  close: { label: "Close-knit", labelKey: "groupCohesion.close", prompt: "close-knit: members normally protect one another and share information freely" },
  functional: { label: "Functional", labelKey: "groupCohesion.functional", prompt: "functional: cooperation is reliable but emotional closeness varies" },
  strained: { label: "Strained", labelKey: "groupCohesion.strained", prompt: "strained: the group still operates, but grudges and unresolved pressure are visible" },
  fractured: { label: "Fractured", labelKey: "groupCohesion.fractured", prompt: "fractured: factions, mistrust, or a recent break threaten the group's continued unity" }
});

export const GROUP_HIERARCHY = Object.freeze({
  egalitarian: { label: "Egalitarian", labelKey: "groupHierarchy.egalitarian", prompt: "egalitarian or consensus-driven" },
  informal: { label: "Informal leader", labelKey: "groupHierarchy.informal", prompt: "an informal leader exists, but influence depends on trust and circumstance" },
  clear: { label: "Clear chain", labelKey: "groupHierarchy.clear", prompt: "a clear chain of responsibility exists" },
  rigid: { label: "Rigid hierarchy", labelKey: "groupHierarchy.rigid", prompt: "rank is rigid and materially affects behavior, privilege, and risk" }
});

export const RELATIONSHIP_DENSITY = Object.freeze({
  light: { label: "Light", labelKey: "relationshipDensity.light", prompt: "light: give each NPC one or two useful ties without making the group melodramatic" },
  rich: { label: "Rich", labelKey: "relationshipDensity.rich", prompt: "rich: give each NPC multiple concrete interpersonal ties and at least one piece of shared history" },
  tangled: { label: "Tangled", labelKey: "relationshipDensity.tangled", prompt: "tangled: interlock loyalties, resentments, debts, affection, secrets, and misunderstandings across the group while keeping them coherent" }
});

export const INTERNAL_CONFLICT = Object.freeze({
  none: { label: "Minimal", labelKey: "internalConflict.none", prompt: "minimal internal conflict; disagreements exist but are not central" },
  low: { label: "Low", labelKey: "internalConflict.low", prompt: "low internal conflict with one or two mild recurring disagreements" },
  medium: { label: "Moderate", labelKey: "internalConflict.medium", prompt: "moderate internal conflict with at least one consequential unresolved dispute" },
  high: { label: "High", labelKey: "internalConflict.high", prompt: "high internal conflict with serious competing interests, but avoid making every member openly hostile" }
});



export const ROLE_VARIANTS = Object.freeze({
  civilian: ["Farmer", "Laborer", "Servant", "Fisher", "Carter", "Tenant", "Inn regular", "Townsperson"],
  artisan: ["Baker", "Blacksmith", "Carpenter", "Mason", "Tailor", "Cobbler", "Cooper", "Potter"],
  merchant: ["Market trader", "Traveling peddler", "Cloth merchant", "Grain factor", "Spice seller", "Livestock dealer", "Money changer", "Wholesaler", "Broker"],
  acolyte: ["Shrine attendant", "Temple novice", "Almoner", "Cantor", "Sacristan", "Pilgrim guide", "Healer-acolyte", "Archive novice"],
  scholar: ["Historian", "Jurist", "Scribe", "Natural philosopher", "Tutor", "Cartographer", "Archivist", "Accountant"],
  specialist: ["Apothecary", "Engineer", "Locksmith", "Surgeon", "Translator", "Surveyor", "Courier", "Investigator"],
  guard: ["Gate guard", "Street patrol", "Watchman", "Jailer", "Caravan guard", "Warehouse guard", "Bodyguard", "Tower sentry"],
  scout: ["Tracker", "Outrider", "Wilderness guide", "Skirmisher", "Pathfinder", "Hunter", "Messenger", "Lookout"],
  bruiser: ["Bouncer", "Dock enforcer", "Pit fighter", "Caravan muscle", "Gang heavy", "Labor foreman", "Wrestler", "Debt collector"],
  soldier: ["Spearman", "Swordsman", "Crossbowman", "Pikeman", "Infantry veteran", "Sergeant", "Sapper", "Cavalryman"],
  leader: ["Watch captain", "Foreman", "Caravan master", "Village head", "Guild officer", "Militia captain", "Ship officer", "Household steward"],
  noble: ["Landed knight", "Courtier", "Minor lord", "Heir", "Estate holder", "Envoy", "Patron", "House retainer"]
});

export const ROLE_COMPOSITION_MODES = Object.freeze({
  single: { label: "Single role", labelKey: "roleComposition.single", prompt: "use the selected primary role for every NPC" },
  variants: { label: "Role variants", labelKey: "roleComposition.variants", prompt: "keep the selected primary role, but distribute distinct practical subtypes or professions as evenly as possible" },
  groupPreset: { label: "Group-appropriate roles", labelKey: "roleComposition.groupPreset", prompt: "use the selected group archetype's natural internal division of responsibilities" },
  balanced: { label: "Balanced mixed roles", labelKey: "roleComposition.balanced", prompt: "distribute the allowed roles roughly evenly" },
  primary: { label: "Primary-role majority", labelKey: "roleComposition.primary", prompt: "target 70% primary role and spread the remaining 30% across the other allowed roles" },
  dominant: { label: "Strong primary-role majority", labelKey: "roleComposition.dominant", prompt: "target 85% primary role and spread the remaining 15% across the other allowed roles" },
  weighted: { label: "Custom role weights", labelKey: "roleComposition.weighted", prompt: "follow the supplied relative role weights as closely as the exact group size allows" }
});

export const COMBAT_READINESS = Object.freeze({
  weaponless: { label: "Weaponless", labelKey: "combatReadiness.weaponless", level: 0, prompt: "always weaponless: no weapons or armor; ordinary clothing and occupational tools only" },
  minimal: { label: "Minimal", labelKey: "combatReadiness.minimal", level: 1, prompt: "minimal role-relative readiness: noncombatants remain effectively unarmed except natural work tools; guards, raiders, soldiers, and similarly violent roles carry at least one simple role-appropriate weapon" },
  standard: { label: "Standard", labelKey: "combatReadiness.standard", level: 2, prompt: "normal role-appropriate readiness: use only weapons and armor a person in this exact role would plausibly carry during ordinary duties" },
  prepared: { label: "Prepared", labelKey: "combatReadiness.prepared", level: 3, prompt: "above-normal but believable preparedness: add a backup weapon, protective gear, or better equipment only when the role plausibly permits it" },
  armed: { label: "Highly Prepared", labelKey: "combatReadiness.armed", level: 4, prompt: "maximum realistic preparedness for the role: several sensible combat options for martial roles, but strict occupational ceilings for civilians and professionals; never turn a noncombatant profession into a fantasy warrior" }
});

export const WEAPON_VARIETY = Object.freeze({
  meleeOnly: { label: "Melee only", labelKey: "weaponVariety.meleeOnly", prompt: "use melee-capable weapons only; do not add dedicated ranged weapons" },
  meleePreferred: { label: "Melee preference", labelKey: "weaponVariety.meleePreferred", prompt: "strongly prefer melee weapons, allowing a ranged backup only when the role and readiness make it sensible" },
  mixed: { label: "Mixed", labelKey: "weaponVariety.mixed", prompt: "use a natural mix of melee and ranged options when the role plausibly supports both" },
  rangedPreferred: { label: "Ranged preference", labelKey: "weaponVariety.rangedPreferred", prompt: "strongly prefer ranged weapons, allowing a melee backup only when the role and readiness make it sensible" },
  rangedOnly: { label: "Ranged only", labelKey: "weaponVariety.rangedOnly", prompt: "use dedicated ranged weapons only; if the role has no realistic ranged weapon, leave the NPC weaponless rather than inventing an implausible weapon" }
});

export const WEAPON_CATEGORIES = Object.freeze({
  Dagger: "melee",
  "Light Hammer": "melee",
  Quarterstaff: "melee",
  Mace: "melee",
  Spear: "melee",
  Longsword: "melee",
  Shortsword: "melee",
  Club: "melee",
  Greatclub: "melee",
  Handaxe: "melee",
  Rapier: "melee",
  Shortbow: "ranged",
  "Light Crossbow": "ranged"
});

export const ROLE_COMBAT_PROFILES = Object.freeze({
  civilian: { weaponAt: 3, armorAt: 99, weapons: ["Dagger"], armor: [], guidance: "ordinary civilians rarely carry dedicated weapons; at high readiness a small knife or similarly discreet self-defense implement is the ceiling" },
  artisan: { weaponAt: 1, armorAt: 99, weapons: ["Dagger", "Light Hammer"], armor: [], guidance: "work tools may double as emergency weapons; a baker, carpenter, or smith should look like their trade first and a combatant second" },
  merchant: { weaponAt: 3, armorAt: 99, weapons: ["Dagger", "Light Crossbow"], armor: [], guidance: "merchants normally avoid obvious weapons; richer or travel-exposed merchants may carry a dagger or compact defensive weapon, but heavy martial gear is inappropriate" },
  acolyte: { weaponAt: 1, armorAt: 3, weapons: ["Quarterstaff", "Mace"], armor: ["Leather Armor"], guidance: "devotional staff, mace, or similarly traditional simple weapon may be appropriate; armor should remain modest unless the faith or duty explicitly justifies it" },
  scholar: { weaponAt: 3, armorAt: 99, weapons: ["Dagger", "Quarterstaff"], armor: [], guidance: "scholars, jurists, scribes, and tutors should normally be unarmed; even at maximum readiness keep weapons discreet and plausible, such as a long knife or walking staff" },
  specialist: { weaponAt: 2, armorAt: 4, weapons: ["Dagger", "Light Crossbow"], armor: ["Leather Armor"], guidance: "specialists may carry compact defensive gear when their work exposes them to danger, but tools remain more important than weapons" },
  guard: { weaponAt: 1, armorAt: 2, weapons: ["Spear", "Light Crossbow", "Longsword"], armor: ["Leather Armor", "Chain Shirt", "Shield"], guidance: "guards are expected to be armed; readiness changes backup weapons, armor quality, and duty equipment rather than whether they are combatants at all" },
  scout: { weaponAt: 1, armorAt: 2, weapons: ["Shortbow", "Shortsword", "Dagger"], armor: ["Leather Armor"], guidance: "scouts favor light, portable weapons and armor that preserve mobility and stealth" },
  bruiser: { weaponAt: 1, armorAt: 3, weapons: ["Club", "Greatclub", "Handaxe"], armor: ["Hide Armor"], guidance: "bruisers favor simple, intimidating close-combat tools; heavy military equipment is inappropriate unless another role explicitly supports it" },
  soldier: { weaponAt: 1, armorAt: 2, weapons: ["Spear", "Longsword", "Light Crossbow"], armor: ["Scale Mail", "Chain Mail", "Shield"], guidance: "soldiers are professionally armed and armored; readiness controls quality, backups, and breadth of loadout" },
  leader: { weaponAt: 1, armorAt: 2, weapons: ["Longsword", "Dagger", "Light Crossbow"], armor: ["Chain Shirt", "Shield"], guidance: "martial or security leaders carry equipment suited to their command context, while civic leaders should stay near the lower end unless danger is explicit" },
  noble: { weaponAt: 2, armorAt: 4, weapons: ["Dagger", "Rapier"], armor: ["Leather Armor"], guidance: "nobles may carry socially acceptable sidearms; even at high readiness avoid battlefield gear unless the NPC is explicitly a martial noble" }
});

export const RACE_COMPOSITION_MODES = Object.freeze({
  single: { label: "Single race", labelKey: "raceComposition.single", prompt: "all NPCs use the selected primary race" },
  dominant: { label: "Strong primary-race majority", labelKey: "raceComposition.dominant", prompt: "about 80–90% primary race; for a group of ten this typically means roughly eight or nine primary-race members and one or two minorities" },
  primary: { label: "Primary-race majority", labelKey: "raceComposition.primary", prompt: "about 65–75% primary race with the remainder spread among the other allowed races" },
  balanced: { label: "Broadly mixed", labelKey: "raceComposition.balanced", prompt: "roughly equal representation among the allowed races, subject to the exact group size" },
  weighted: { label: "Custom race weights", labelKey: "raceComposition.weighted", prompt: "follow the supplied relative race weights as closely as the exact group size allows" },
  mixed: { label: "Mixed races (legacy)", labelKey: "raceComposition.mixed", prompt: "legacy mixed-race mode retained for saved configurations" }
});

export const RACE_DISTRIBUTIONS = Object.freeze({
  balanced: { label: "Roughly equal", labelKey: "raceDistribution.balanced", prompt: "roughly equal representation among the allowed races, subject to the exact group size" },
  primary: { label: "Primary race", labelKey: "raceDistribution.primary", prompt: "about 65–75% primary race with the remaining members spread among the other allowed races" },
  dominant: { label: "Strong majority", labelKey: "raceDistribution.dominant", prompt: "about 80–90% primary race with the other allowed races appearing only as a small minority" },
  weighted: { label: "Custom weights", labelKey: "raceDistribution.weighted", prompt: "follow the supplied relative race weights as closely as the exact group size allows" }
});

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

export const QUIRKS = Object.freeze([
  "keeps a neat bundle of string for problems that probably do not require string",
  "names tools and animals as though they were coworkers",
  "never sits with their back to an open doorway",
  "collects unusually shaped buttons and remembers where each came from",
  "quietly hums the same four notes while working",
  "cannot resist correcting crooked signs, frames, or table settings",
  "carries a lucky pebble and changes the story of where it came from",
  "writes tiny reminders on scraps that end up in every pocket",
  "always offers food before discussing difficult business",
  "makes dry observations at exactly the wrong moment",
  "remembers faces immediately but routinely forgets names",
  "keeps one obviously repaired possession long after they could replace it"
]);

export const GROUP_RUMOURS = Object.freeze([
  "someone in the group quietly diverted money or supplies during a recent crisis",
  "the group knows more about a local disappearance than they publicly admit",
  "one member is considering leaving and has not told the others",
  "the group received help from a questionable patron and still owes a favor",
  "a public disagreement hides a much older private grievance",
  "one member's reputation rests on an event that happened very differently than people think"
]);

export const GROUP_SECRETS = Object.freeze([
  "the group is protecting one member from the consequences of a past mistake",
  "two members privately made a promise that conflicts with the group's public plan",
  "a valuable possession or document is being hidden from both outsiders and some members",
  "the group once abandoned someone during a dangerous incident and disagrees about whether it was justified",
  "one relationship in the group is closer than the others realize",
  "the group's current objective is partly a cover for a more personal goal"
]);
