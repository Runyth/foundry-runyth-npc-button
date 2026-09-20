export const MODULE_ID = "runyth-npc-button";
export const MODULE_TITLE = "Runyth NPC Button";
export const MODULE_VERSION = "0.1.2";

export const SETTINGS = Object.freeze({
  DEBUG: "debugLogging",
  DEFAULT_FOLDER: "defaultFolderName",
  MAX_BATCH: "maxBatchSize",
  TIER_STYLE: "tierStyle",
  LAST_OPTIONS: "lastOptions",
  WINDOW_STATE: "dashboardWindowState"
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
  customName: "",
  customSpecies: "",
  seed: "",
  folderId: "",
  newFolderName: "",
  useActorRoot: false,
  openLastActor: true,
  singleAiObject: false
});
