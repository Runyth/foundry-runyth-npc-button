// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import { MODULE_ID, SETTINGS, TIER_STYLES } from "./constants.mjs";
import { ComplementaryModuleColorsForm } from "./complementary-module-colors.mjs";
import { FilterSettingsForm, defaultFilterConfiguration } from "./filters.mjs";

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

  game.settings.register(MODULE_ID, SETTINGS.IGNORE_IMPORT_COUNT_MISMATCH, {
    name: `${MODULE_ID}.settings.ignoreImportCountMismatch.name`,
    hint: `${MODULE_ID}.settings.ignoreImportCountMismatch.hint`,
    scope: "world",
    config: true,
    restricted: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, SETTINGS.TIER_STYLE, {
    name: `${MODULE_ID}.settings.tierStyle.name`,
    hint: `${MODULE_ID}.settings.tierStyle.hint`,
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    choices: {
      [TIER_STYLES.NAMED]: game.i18n.localize(`${MODULE_ID}.settings.tierStyle.choices.named`),
      [TIER_STYLES.CR]: game.i18n.localize(`${MODULE_ID}.settings.tierStyle.choices.cr`)
    },
    default: TIER_STYLES.NAMED
  });


  game.settings.registerMenu(MODULE_ID, "filterSettingsMenu", {
    name: `${MODULE_ID}.settings.filters.name`,
    hint: `${MODULE_ID}.settings.filters.hint`,
    label: `${MODULE_ID}.settings.filters.label`,
    icon: "fa-solid fa-filter",
    type: FilterSettingsForm,
    restricted: true
  });

  game.settings.register(MODULE_ID, SETTINGS.FILTERS, {
    name: `${MODULE_ID}.settings.filtersStorage.name`,
    hint: `${MODULE_ID}.settings.filtersStorage.hint`,
    scope: "world",
    config: false,
    restricted: true,
    type: String,
    default: JSON.stringify(defaultFilterConfiguration())
  });

  game.settings.registerMenu(MODULE_ID, "complementaryModuleColorsMenu", {
    name: `${MODULE_ID}.settings.complementaryModuleColors.name`,
    hint: `${MODULE_ID}.settings.complementaryModuleColors.hint`,
    label: `${MODULE_ID}.settings.complementaryModuleColors.label`,
    icon: "fa-solid fa-palette",
    type: ComplementaryModuleColorsForm,
    restricted: true
  });

  game.settings.register(MODULE_ID, SETTINGS.COMPLEMENTARY_MODULE_COLORS, {
    name: `${MODULE_ID}.settings.complementaryModuleColorsStorage.name`,
    hint: `${MODULE_ID}.settings.complementaryModuleColorsStorage.hint`,
    scope: "world",
    config: false,
    restricted: true,
    type: String,
    default: "{}"
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
    cr: options.cr,
    species: options.species,
    namingStyle: options.namingStyle,
    wealth: options.wealth,
    wealthDistribution: options.wealthDistribution,
    combatReadiness: options.combatReadiness,
    weaponVariety: options.weaponVariety,
    genderComposition: options.genderComposition,
    maleCount: options.maleCount,
    femaleCount: options.femaleCount,
    ageRange: options.ageRange,
    ageSpread: options.ageSpread,
    ageMin: options.ageMin,
    ageMax: options.ageMax,
    habitat: options.habitat,
    groupType: options.groupType,
    familyStructure: options.familyStructure,
    groupCohesion: options.groupCohesion,
    groupHierarchy: options.groupHierarchy,
    relationshipDensity: options.relationshipDensity,
    internalConflict: options.internalConflict,
    raceComposition: options.raceComposition,
    groupRaces: options.groupRaces,
    primaryRace: options.primaryRace,
    raceDistribution: options.raceDistribution,
    raceWeights: options.raceWeights,
    raceExactCounts: options.raceExactCounts,
    roleComposition: options.roleComposition,
    groupRoles: options.groupRoles,
    primaryRole: options.primaryRole,
    roleWeights: options.roleWeights,
    groupBrief: options.groupBrief,
    nameFormatPreset: options.nameFormatPreset,
    namePrefix: options.namePrefix,
    nameInfix: options.nameInfix,
    nameSuffix: options.nameSuffix,
    nameLocation: options.nameLocation,
    nicknameMode: options.nicknameMode,
    titleMode: options.titleMode,
    nameTemplate: options.nameTemplate,
    customSpecies: options.customSpecies,
    folderId: options.folderId,
    newFolderName: options.newFolderName,
    useActorRoot: options.useActorRoot,
    openLastActor: options.openLastActor,
    previewImport: options.previewImport
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
