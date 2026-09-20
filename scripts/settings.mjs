import { MODULE_ID, SETTINGS } from "./constants.mjs";

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTINGS.DEBUG, {
    name: `${MODULE_ID}.settings.debug.name`,
    hint: `${MODULE_ID}.settings.debug.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, SETTINGS.DEFAULT_FOLDER, {
    name: `${MODULE_ID}.settings.defaultFolder.name`,
    hint: `${MODULE_ID}.settings.defaultFolder.hint`,
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    default: "Runyth NPCs"
  });

  game.settings.register(MODULE_ID, SETTINGS.MAX_BATCH, {
    name: `${MODULE_ID}.settings.maxBatch.name`,
    hint: `${MODULE_ID}.settings.maxBatch.hint`,
    scope: "world",
    config: true,
    restricted: true,
    type: Number,
    default: 25,
    range: {
      min: 1,
      max: 100,
      step: 1
    }
  });

  game.settings.register(MODULE_ID, SETTINGS.LAST_OPTIONS, {
    scope: "client",
    config: false,
    type: String,
    default: ""
  });

  game.settings.register(MODULE_ID, SETTINGS.WINDOW_STATE, {
    scope: "client",
    config: false,
    type: String,
    default: ""
  });
}

function parseJsonSetting(setting) {
  const raw = game.settings.get(MODULE_ID, setting);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function loadLastOptions() {
  return parseJsonSetting(SETTINGS.LAST_OPTIONS);
}

export async function saveLastOptions(options) {
  const safeOptions = {
    count: options.count,
    role: options.role,
    tier: options.tier,
    species: options.species,
    namingStyle: options.namingStyle,
    customSpecies: options.customSpecies,
    folderId: options.folderId,
    newFolderName: options.newFolderName,
    openLastActor: options.openLastActor,
    singleAiObject: options.singleAiObject
  };
  await game.settings.set(MODULE_ID, SETTINGS.LAST_OPTIONS, JSON.stringify(safeOptions));
}

export function loadWindowState() {
  const state = parseJsonSetting(SETTINGS.WINDOW_STATE);
  const numericKeys = ["left", "top", "width", "height"];
  return Object.fromEntries(
    numericKeys
      .filter((key) => Number.isFinite(Number(state[key])))
      .map((key) => [key, Number(state[key])])
  );
}

export async function saveWindowState(position) {
  const state = {};
  for (const key of ["left", "top", "width", "height"]) {
    const value = Number(position?.[key]);
    if (Number.isFinite(value)) state[key] = Math.round(value);
  }
  await game.settings.set(MODULE_ID, SETTINGS.WINDOW_STATE, JSON.stringify(state));
}
