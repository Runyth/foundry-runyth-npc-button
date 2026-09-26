export const MODULE_ID = "runyth-npc-button";
export const MODULE_TITLE = "Runyth NPC Button";
export const MODULE_VERSION = "0.3.1";

export const SETTINGS = Object.freeze({
  DEBUG: "debugLogging",
  DEFAULT_FOLDER: "defaultFolderName",
  MAX_BATCH: "maxBatchSize",
  TIER_STYLE: "tierStyle",
  LAST_OPTIONS: "lastOptions",
  WINDOW_STATE: "dashboardWindowState",
  FILTERS: "stringFilters",
  IGNORE_IMPORT_COUNT_MISMATCH: "ignoreImportCountMismatch"
});

export const TIER_STYLES = Object.freeze({
  NAMED: "named",
  CR: "cr"
});

export const DEFAULT_OPTIONS = Object.freeze({
  count: 1,
  role: "guard",
  tier: "trained",
  cr: 0.125,
  species: "human",
  namingStyle: "central",
  wealth: "average",
  wealthDistribution: "mixed",
  habitat: "forestVillage",
  groupType: "independent",
  familyStructure: "household",
  groupCohesion: "functional",
  groupHierarchy: "informal",
  relationshipDensity: "rich",
  internalConflict: "low",
  raceComposition: "single",
  groupRaces: ["human"],
  primaryRace: "human",
  raceDistribution: "balanced",
  raceWeights: { human: 1 },
  raceExactCounts: { human: 1 },
  roleComposition: "groupPreset",
  groupRoles: ["guard"],
  primaryRole: "guard",
  roleWeights: { guard: 1 },
  combatReadiness: "standard",
  weaponVariety: "mixed",
  genderComposition: "random",
  maleCount: 1,
  femaleCount: 0,
  groupBrief: "",
  customName: "",
  customSpecies: "",
  seed: "",
  folderId: "",
  newFolderName: "",
  useActorRoot: false,
  openLastActor: true,
  previewImport: false
});
