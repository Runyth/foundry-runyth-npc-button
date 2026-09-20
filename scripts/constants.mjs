export const MODULE_ID = "runyth-npc-button";
export const MODULE_TITLE = "Runyth NPC Button";
export const MODULE_VERSION = "0.1.0";

export const SETTINGS = Object.freeze({
  DEBUG: "debugLogging",
  DEFAULT_FOLDER: "defaultFolderName",
  MAX_BATCH: "maxBatchSize",
  LAST_OPTIONS: "lastOptions"
});

export const DEFAULT_OPTIONS = Object.freeze({
  count: 1,
  role: "guard",
  tier: "trained",
  species: "human",
  namingStyle: "central",
  customName: "",
  customSpecies: "",
  seed: "",
  folderId: "",
  newFolderName: "",
  openLastActor: true
});
