import { buildAiPrompt } from "../ai/prompt-builder.mjs";
import { parseAndNormalizeNpcJson } from "../ai/npc-json.mjs";
import { DEFAULT_OPTIONS, MODULE_ID, SETTINGS, TIER_STYLES } from "../constants.mjs";
import {
  CR_VALUES,
  COMBAT_READINESS,
  FAMILY_STRUCTURES,
  GROUP_COHESION,
  GROUP_HIERARCHY,
  GROUP_TYPES,
  GROUP_TYPE_GROUPS,
  HABITATS,
  HABITAT_GROUPS,
  INTERNAL_CONFLICT,
  NAME_STYLES,
  NAMING_GROUPS,
  RACES,
  RACE_COMPOSITION_MODES,
  RACE_DISTRIBUTIONS,
  RACE_GROUPS,
  RELATIONSHIP_DENSITY,
  ROLES,
  ROLE_COMBAT_PROFILES,
  ROLE_COMPOSITION_MODES,
  ROLE_GROUPS,
  ROLE_VARIANTS,
  TIERS,
  WEALTH_LEVELS,
  formatChallengeRating
} from "../generator/data.mjs";
import { normalizeGroupRaceIds, normalizeGroupRoleIds, resolveTierProfile } from "../generator/npc-generator.mjs";
import { getCatalogGroups, getGroupTypes, getHabitats, getNamingStyles, getRaces, getRoles } from "../extensions/registry.mjs";
import { applyStringFilters } from "../filters.mjs";
import { logger } from "../logger.mjs";
import { loadLastOptions, loadWindowState, saveLastOptions, saveWindowState } from "../settings.mjs";
import { createImportedNpcActors, createNpcActors } from "../services/actor-service.mjs";
import { escapeAttribute } from "../utils/html.mjs";
import { openActorReviewStack } from "./actor-review.mjs";
import { hierarchicalMultiPickerMarkup, mountHierarchicalMultiPicker } from "./hierarchical-multi-picker.mjs";
import { hierarchicalPickerMarkup, mountHierarchicalPicker } from "./hierarchical-picker.mjs";
import { openNpcHelp } from "./npc-help.mjs";

function localize(key) {
  return game.i18n.localize(`${MODULE_ID}.${key}`);
}

function configuredLabel(config) {
  return config?.labelKey ? localize(config.labelKey) : (config?.label ?? "");
}

function choiceChips(name, entries, selected, { className = "" } = {}) {
  return Object.entries(entries).map(([value, config]) => `
    <label class="runyth-npc-button__choice ${escapeAttribute(className)}">
      <input type="radio" name="${escapeAttribute(name)}" value="${escapeAttribute(value)}"${value === selected ? " checked" : ""}>
      <span>${escapeAttribute(configuredLabel(config))}</span>
    </label>
  `).join("");
}

function groupedConfigItems(entries, groups, groupKeyPrefix) {
  const items = [];
  for (const group of groups) {
    const members = Object.entries(entries)
      .filter(([, config]) => config.group === group)
      .sort((left, right) => configuredLabel(left[1]).localeCompare(configuredLabel(right[1])));
    if (!members.length) continue;
    items.push({ kind: "group", id: `group:${group}`, label: localize(`${groupKeyPrefix}.${group}`), depth: 0 });
    for (const [id, config] of members) {
      items.push({
        kind: "option",
        id,
        label: configuredLabel(config),
        display: configuredLabel(config),
        description: config.descriptionKey ? localize(config.descriptionKey) : "",
        depth: 1
      });
    }
  }
  return items;
}

function rolePickerItems() {
  const roles = getRoles();
  return applyStringFilters("roles", groupedConfigItems(roles, getCatalogGroups(roles, ROLE_GROUPS), "roleGroups"));
}

function racePickerItems() {
  const races = getRaces();
  const entries = Object.fromEntries(Object.entries(races).filter(([key]) => key !== "custom"));
  return applyStringFilters("races", groupedConfigItems(entries, getCatalogGroups(entries, RACE_GROUPS), "raceGroups"));
}

function namingPickerItems() {
  const namingStyles = getNamingStyles();
  return applyStringFilters("namingStyles", groupedConfigItems(namingStyles, getCatalogGroups(namingStyles, NAMING_GROUPS), "namingGroups"));
}

function habitatPickerItems() {
  const habitats = getHabitats();
  return applyStringFilters("habitats", groupedConfigItems(habitats, getCatalogGroups(habitats, HABITAT_GROUPS), "habitatGroups"));
}

function groupTypePickerItems() {
  const groupTypes = getGroupTypes();
  return applyStringFilters("groupTypes", groupedConfigItems(groupTypes, getCatalogGroups(groupTypes, GROUP_TYPE_GROUPS), "groupTypeGroups"));
}

function namedTierPickerItems() {
  return [
    { kind: "group", id: "group:named", label: localize("tierGroups.named"), depth: 0 },
    ...Object.entries(TIERS).map(([id, config]) => ({
      kind: "option",
      id,
      label: configuredLabel(config),
      display: configuredLabel(config),
      description: `CR ${formatChallengeRating(config.cr)}`,
      depth: 1
    }))
  ];
}

function crTierPickerItems() {
  const groups = [
    { id: "fractional", label: localize("tierGroups.fractional"), match: (cr) => cr < 1 },
    { id: "low", label: localize("tierGroups.cr1to10"), match: (cr) => cr >= 1 && cr <= 10 },
    { id: "mid", label: localize("tierGroups.cr11to20"), match: (cr) => cr >= 11 && cr <= 20 },
    { id: "high", label: localize("tierGroups.cr21to30"), match: (cr) => cr >= 21 && cr <= 30 }
  ];
  const items = [];
  for (const group of groups) {
    items.push({ kind: "group", id: `group:${group.id}`, label: group.label, depth: 0 });
    for (const cr of CR_VALUES.filter(group.match)) {
      const label = `CR ${formatChallengeRating(cr)}`;
      items.push({ kind: "option", id: String(cr), label, display: label, depth: 1 });
    }
  }
  return items;
}

function actorFolders() {
  return Array.from(game.folders ?? []).filter((folder) => folder.type === "Actor");
}

function folderParentId(folder) {
  if (!folder?.folder) return null;
  return typeof folder.folder === "object" ? folder.folder.id : folder.folder;
}

function actorFolderPickerItems() {
  const folders = actorFolders();
  const byParent = new Map();
  for (const folder of folders) {
    const parentId = folderParentId(folder);
    const siblings = byParent.get(parentId) ?? [];
    siblings.push(folder);
    byParent.set(parentId, siblings);
  }
  for (const siblings of byParent.values()) siblings.sort((a, b) => a.name.localeCompare(b.name));

  const defaultFolder = String(game.settings.get(MODULE_ID, SETTINGS.DEFAULT_FOLDER) ?? "").trim();
  const items = [
    { kind: "group", id: "group:destination", label: localize("folderGroups.destination"), depth: 0 },
    {
      kind: "option",
      id: "@default",
      label: localize("ui.configuredDefault"),
      display: defaultFolder ? game.i18n.format(`${MODULE_ID}.ui.configuredDefaultNamed`, { name: defaultFolder }) : localize("ui.configuredDefaultRoot"),
      description: defaultFolder || localize("ui.actorsRoot"),
      depth: 1
    },
    { kind: "option", id: "@root", label: localize("ui.actorsRoot"), display: localize("ui.actorsRoot"), depth: 1 }
  ];

  if (!folders.length) return items;
  items.push({ kind: "group", id: "group:folders", label: localize("folderGroups.existing"), depth: 0 });

  const visited = new Set();
  function walk(folder, depth, path) {
    if (!folder || visited.has(folder.id)) return;
    visited.add(folder.id);
    const fullPath = [...path, folder.name];
    items.push({
      kind: "option",
      id: `folder:${folder.id}`,
      label: folder.name,
      display: fullPath.join(" / "),
      description: fullPath.join(" / "),
      searchText: fullPath.join(" "),
      depth
    });
    for (const child of byParent.get(folder.id) ?? []) walk(child, depth + 1, fullPath);
  }

  for (const root of byParent.get(null) ?? []) walk(root, 1, []);
  for (const folder of folders) if (!visited.has(folder.id)) walk(folder, 1, []);
  return applyStringFilters("folders", items);
}

function raceSelectionValue(options) {
  return options.species === "custom" ? `custom:${String(options.customSpecies ?? "")}` : (options.species ?? "human");
}

function raceSelectionDisplay(options) {
  const races = getRaces();
  if (options.species === "custom") return String(options.customSpecies ?? "") || localize("ui.customRace");
  return configuredLabel(races[options.species] ?? races.human ?? RACES.human);
}

function resolveRaceSelection(value) {
  const selected = String(value ?? "human");
  if (selected.startsWith("custom:")) {
    const customSpecies = selected.slice("custom:".length).trim() || "Humanoid";
    return { species: "custom", customSpecies };
  }
  const races = getRaces();
  return { species: races[selected] ? selected : "human", customSpecies: "" };
}

function raceLabelFromSelectionId(value) {
  const selected = String(value ?? "human");
  if (selected.startsWith("custom:")) return selected.slice(7).trim() || localize("ui.customRace");
  const races = getRaces();
  return configuredLabel(races[selected] ?? races.human ?? RACES.human);
}

function habitatSelectionValue(options) {
  const habitat = String(options.habitat ?? DEFAULT_OPTIONS.habitat);
  const habitats = getHabitats();
  return habitats[habitat] || habitat.startsWith("custom:") ? habitat : DEFAULT_OPTIONS.habitat;
}

function habitatSelectionDisplay(options) {
  const value = habitatSelectionValue(options);
  const habitats = getHabitats();
  if (value.startsWith("custom:")) return value.slice(7).trim() || configuredLabel(habitats.forestVillage ?? HABITATS.forestVillage);
  return configuredLabel(habitats[value] ?? habitats.forestVillage ?? HABITATS.forestVillage);
}

function destinationSelectionValue(options) {
  if (options.useActorRoot) return "@root";
  if (options.newFolderName) return `new:${String(options.newFolderName)}`;
  if (options.folderId) return `folder:${options.folderId}`;
  return "@default";
}

function destinationSelectionDisplay(options) {
  if (options.useActorRoot) return localize("ui.actorsRoot");
  if (options.newFolderName) return String(options.newFolderName);
  if (options.folderId) {
    return actorFolderPickerItems().find((entry) => entry.id === `folder:${options.folderId}`)?.display ?? localize("ui.destinationMissing");
  }
  return actorFolderPickerItems().find((entry) => entry.id === "@default")?.display ?? localize("ui.configuredDefault");
}

function resolveDestinationSelection(value) {
  const selected = String(value ?? "@default");
  if (selected === "@root") return { folderId: "", newFolderName: "", useActorRoot: true };
  if (selected.startsWith("folder:")) return { folderId: selected.slice(7), newFolderName: "", useActorRoot: false };
  if (selected.startsWith("new:")) return { folderId: "", newFolderName: selected.slice(4).trim(), useActorRoot: false };
  return { folderId: "", newFolderName: "", useActorRoot: false };
}

function tierPicker(options, tierStyle) {
  if (tierStyle === TIER_STYLES.CR) {
    const cr = CR_VALUES.includes(Number(options.cr)) ? Number(options.cr) : DEFAULT_OPTIONS.cr;
    const label = `CR ${formatChallengeRating(cr)}`;
    return hierarchicalPickerMarkup({
      id: "runyth-npc-button-tier-picker",
      name: "cr",
      label: localize("ui.challengeRating"),
      hint: localize("ui.challengeRatingHint"),
      value: String(cr),
      display: label,
      placeholder: label
    });
  }
  const tier = TIERS[options.tier] ? options.tier : DEFAULT_OPTIONS.tier;
  return hierarchicalPickerMarkup({
    id: "runyth-npc-button-tier-picker",
    name: "tier",
    label: localize("ui.tier"),
    hint: localize("ui.tierHint"),
    value: tier,
    display: configuredLabel(TIERS[tier]),
    placeholder: configuredLabel(TIERS[DEFAULT_OPTIONS.tier])
  });
}

function suggestedSizesMarkup(groupType, maxBatch) {
  const groupTypes = getGroupTypes();
  const config = groupTypes[groupType] ?? groupTypes.independent ?? GROUP_TYPES.independent;
  return config.suggestedSizes
    .filter((value) => value <= maxBatch)
    .map((value) => `<button type="button" data-group-count="${value}">${value}</button>`)
    .join("");
}

function effectiveRaceComposition(options) {
  const value = String(options.raceComposition ?? DEFAULT_OPTIONS.raceComposition);
  if (value === "mixed") return String(options.raceDistribution ?? "balanced");
  return RACE_COMPOSITION_MODES[value] ? value : DEFAULT_OPTIONS.raceComposition;
}

function effectiveRoleComposition(options) {
  const value = String(options.roleComposition ?? DEFAULT_OPTIONS.roleComposition);
  return ROLE_COMPOSITION_MODES[value] ? value : DEFAULT_OPTIONS.roleComposition;
}

function dashboardContent(options, tierStyle) {
  const maxBatch = Number(game.settings.get(MODULE_ID, SETTINGS.MAX_BATCH)) || 25;
  const quickCounts = [1, 3, 5, 10].filter((value) => value <= maxBatch);
  const groupTypes = getGroupTypes();
  const groupType = groupTypes[options.groupType] ? options.groupType : DEFAULT_OPTIONS.groupType;
  const raceComposition = effectiveRaceComposition(options);
  const groupRaces = normalizeGroupRaceIds({ ...options, raceComposition, groupRaces: options.groupRaces ?? DEFAULT_OPTIONS.groupRaces });
  const roleComposition = effectiveRoleComposition(options);
  const groupRoles = normalizeGroupRoleIds({ ...options, groupRoles: options.groupRoles ?? [options.role ?? DEFAULT_OPTIONS.role] });

  return `
    <form class="runyth-npc-button__dashboard" autocomplete="off">
      <section class="runyth-npc-button__section">
        <div class="runyth-npc-button__section-heading">
          <div>
            <h2>${escapeAttribute(localize("ui.generationTitle"))}</h2>
            <p>${escapeAttribute(localize("ui.intro"))}</p>
          </div>
        </div>

        <div class="runyth-npc-button__field runyth-npc-button__field--count">
          <div class="runyth-npc-button__label-row">
            <label for="runyth-npc-button-count">${escapeAttribute(localize("ui.count"))}</label>
            <small id="runyth-npc-button-count-hint">${escapeAttribute(game.i18n.format(`${MODULE_ID}.ui.countRange`, { max: maxBatch }))}</small>
          </div>
          <div class="runyth-npc-button__count-control">
            <input id="runyth-npc-button-count" type="number" name="count" min="1" max="${maxBatch}" step="1" inputmode="numeric" aria-describedby="runyth-npc-button-count-hint" value="${escapeAttribute(options.count)}">
            <div class="runyth-npc-button__quick-counts" aria-label="${escapeAttribute(localize("ui.quickCounts"))}">
              ${quickCounts.map((value) => `<button type="button" data-count="${value}" aria-pressed="${Number(options.count) === value ? "true" : "false"}"${Number(options.count) === value ? " class=\"active\"" : ""}>${value}</button>`).join("")}
            </div>
          </div>
        </div>

        <div class="runyth-npc-button__grid">
          ${hierarchicalPickerMarkup({
            id: "runyth-npc-button-group-type-picker",
            name: "groupType",
            label: localize("ui.groupType"),
            hint: localize("ui.groupTypeHint"),
            value: groupType,
            display: configuredLabel((getGroupTypes()[groupType] ?? GROUP_TYPES[groupType])),
            placeholder: configuredLabel((getGroupTypes().independent ?? GROUP_TYPES.independent))
          })}
          ${hierarchicalPickerMarkup({
            id: "runyth-npc-button-habitat-picker",
            name: "habitat",
            label: localize("ui.habitat"),
            hint: localize("ui.habitatHint"),
            value: habitatSelectionValue(options),
            display: habitatSelectionDisplay(options),
            placeholder: configuredLabel(getHabitats().forestVillage ?? HABITATS.forestVillage)
          })}
        </div>

        ${hierarchicalPickerMarkup({
          id: "runyth-npc-button-role-picker",
          name: "role",
          label: localize("ui.role"),
          hint: localize("ui.roleHint"),
          value: (getRoles()[options.role] ? options.role : DEFAULT_OPTIONS.role),
          display: configuredLabel(getRoles()[options.role] ?? getRoles()[DEFAULT_OPTIONS.role] ?? ROLES[DEFAULT_OPTIONS.role]),
          placeholder: configuredLabel(getRoles()[DEFAULT_OPTIONS.role] ?? ROLES[DEFAULT_OPTIONS.role])
        })}

        ${tierPicker(options, tierStyle)}

        <div class="runyth-npc-button__grid">
          ${hierarchicalPickerMarkup({
            id: "runyth-npc-button-race-picker",
            name: "raceSelection",
            label: localize("ui.race"),
            hint: localize("ui.raceHint"),
            value: raceSelectionValue(options),
            display: raceSelectionDisplay(options),
            placeholder: configuredLabel(getRaces().human ?? RACES.human)
          })}
          ${hierarchicalPickerMarkup({
            id: "runyth-npc-button-naming-picker",
            name: "namingStyle",
            label: localize("ui.namingStyle"),
            hint: localize("ui.namingStyleHint"),
            value: (getNamingStyles()[options.namingStyle] ? options.namingStyle : DEFAULT_OPTIONS.namingStyle),
            display: configuredLabel(getNamingStyles()[options.namingStyle] ?? getNamingStyles()[DEFAULT_OPTIONS.namingStyle] ?? NAME_STYLES[DEFAULT_OPTIONS.namingStyle]),
            placeholder: configuredLabel(getNamingStyles()[DEFAULT_OPTIONS.namingStyle] ?? NAME_STYLES[DEFAULT_OPTIONS.namingStyle])
          })}
        </div>

        <fieldset class="runyth-npc-button__field runyth-npc-button__field--full">
          <legend>${escapeAttribute(localize("ui.wealth"))}</legend>
          <small>${escapeAttribute(localize("ui.wealthHint"))}</small>
          <div class="runyth-npc-button__choices runyth-npc-button__choices--wealth">${choiceChips("wealth", WEALTH_LEVELS, options.wealth)}</div>
        </fieldset>

        <fieldset class="runyth-npc-button__field runyth-npc-button__field--full">
          <legend>${escapeAttribute(localize("ui.combatReadiness"))}</legend>
          <small>${escapeAttribute(localize("ui.combatReadinessHint"))}</small>
          <div class="runyth-npc-button__choices runyth-npc-button__choices--five">${choiceChips("combatReadiness", COMBAT_READINESS, options.combatReadiness ?? DEFAULT_OPTIONS.combatReadiness)}</div>
        </fieldset>

        <div class="runyth-npc-button__grid">
          <div class="runyth-npc-button__field">
            <label for="runyth-npc-button-name">${escapeAttribute(localize("ui.customName"))}</label>
            <input id="runyth-npc-button-name" type="text" name="customName" maxlength="100" value="" placeholder="${escapeAttribute(localize("ui.customNamePlaceholder"))}">
          </div>
          <div class="runyth-npc-button__field">
            <label for="runyth-npc-button-seed">${escapeAttribute(localize("ui.seed"))}</label>
            <input id="runyth-npc-button-seed" type="text" name="seed" maxlength="120" aria-describedby="runyth-npc-button-seed-hint" value="" placeholder="${escapeAttribute(localize("ui.seedPlaceholder"))}">
            <small id="runyth-npc-button-seed-hint">${escapeAttribute(localize("ui.seedHint"))}</small>
          </div>
        </div>
      </section>

      <section class="runyth-npc-button__section runyth-npc-button__section--composition">
        <div class="runyth-npc-button__section-heading">
          <div>
            <h2><i class="fa-solid fa-chart-pie" aria-hidden="true"></i> ${escapeAttribute(localize("ui.compositionTitle"))}</h2>
            <p>${escapeAttribute(localize("ui.compositionIntro"))}</p>
          </div>
        </div>

        <fieldset class="runyth-npc-button__field">
          <legend>${escapeAttribute(localize("ui.raceComposition"))}</legend>
          <small>${escapeAttribute(localize("ui.raceCompositionHint"))}</small>
          <div class="runyth-npc-button__choices runyth-npc-button__choices--composition">${choiceChips("raceComposition", Object.fromEntries(Object.entries(RACE_COMPOSITION_MODES).filter(([id]) => id !== "mixed")), raceComposition)}</div>
        </fieldset>

        <div data-mixed-race-settings${raceComposition === "single" ? " hidden" : ""}>
          ${hierarchicalMultiPickerMarkup({
            id: "runyth-npc-button-group-races-picker",
            name: "groupRaces",
            label: localize("ui.possibleRaces"),
            hint: localize("ui.possibleRacesHint"),
            values: groupRaces,
            placeholder: localize("ui.choosePossibleRaces")
          })}
          <div class="runyth-npc-button__weights" data-race-weights${raceComposition === "weighted" ? "" : " hidden"}>
            <div class="runyth-npc-button__label-row"><strong>${escapeAttribute(localize("ui.raceWeights"))}</strong><small>${escapeAttribute(localize("ui.raceWeightsHint"))}</small></div>
            <div data-race-weight-list></div>
          </div>
        </div>

        <fieldset class="runyth-npc-button__field">
          <legend>${escapeAttribute(localize("ui.roleComposition"))}</legend>
          <small>${escapeAttribute(localize("ui.roleCompositionHint"))}</small>
          <div class="runyth-npc-button__choices runyth-npc-button__choices--composition">${choiceChips("roleComposition", ROLE_COMPOSITION_MODES, roleComposition)}</div>
        </fieldset>

        <div data-mixed-role-settings${["balanced", "primary", "dominant", "weighted"].includes(roleComposition) ? "" : " hidden"}>
          ${hierarchicalMultiPickerMarkup({
            id: "runyth-npc-button-group-roles-picker",
            name: "groupRoles",
            label: localize("ui.possibleRoles"),
            hint: localize("ui.possibleRolesHint"),
            values: groupRoles,
            placeholder: localize("ui.choosePossibleRoles")
          })}
          <div class="runyth-npc-button__weights" data-role-weights${roleComposition === "weighted" ? "" : " hidden"}>
            <div class="runyth-npc-button__label-row"><strong>${escapeAttribute(localize("ui.roleWeights"))}</strong><small>${escapeAttribute(localize("ui.roleWeightsHint"))}</small></div>
            <div data-role-weight-list></div>
          </div>
        </div>
      </section>

      <section class="runyth-npc-button__section runyth-npc-button__section--group" data-group-config${groupType === "independent" ? " hidden" : ""}>
        <div class="runyth-npc-button__section-heading">
          <div>
            <h2><i class="fa-solid fa-people-group" aria-hidden="true"></i> ${escapeAttribute(localize("ui.groupConfigurationTitle"))}</h2>
            <p>${escapeAttribute(localize("ui.groupConfigurationIntro"))}</p>
          </div>
        </div>

        <div class="runyth-npc-button__field">
          <div class="runyth-npc-button__label-row">
            <label>${escapeAttribute(localize("ui.suggestedGroupSizes"))}</label>
            <small>${escapeAttribute(localize("ui.suggestedGroupSizesHint"))}</small>
          </div>
          <div class="runyth-npc-button__quick-counts" data-group-size-presets>${suggestedSizesMarkup(groupType, maxBatch)}</div>
        </div>

        <fieldset class="runyth-npc-button__field" data-family-settings${groupType === "family" ? "" : " hidden"}>
          <legend>${escapeAttribute(localize("ui.familyStructure"))}</legend>
          <div class="runyth-npc-button__choices runyth-npc-button__choices--five">${choiceChips("familyStructure", FAMILY_STRUCTURES, options.familyStructure ?? DEFAULT_OPTIONS.familyStructure)}</div>
        </fieldset>

        <details class="runyth-npc-button__advanced" open>
          <summary>${escapeAttribute(localize("ui.advancedGroupSettings"))}</summary>
          <div class="runyth-npc-button__advanced-body">
            <fieldset class="runyth-npc-button__field">
              <legend>${escapeAttribute(localize("ui.groupCohesion"))}</legend>
              <div class="runyth-npc-button__choices">${choiceChips("groupCohesion", GROUP_COHESION, options.groupCohesion ?? DEFAULT_OPTIONS.groupCohesion)}</div>
            </fieldset>
            <fieldset class="runyth-npc-button__field">
              <legend>${escapeAttribute(localize("ui.groupHierarchy"))}</legend>
              <div class="runyth-npc-button__choices">${choiceChips("groupHierarchy", GROUP_HIERARCHY, options.groupHierarchy ?? DEFAULT_OPTIONS.groupHierarchy)}</div>
            </fieldset>
            <fieldset class="runyth-npc-button__field">
              <legend>${escapeAttribute(localize("ui.relationshipDensity"))}</legend>
              <div class="runyth-npc-button__choices runyth-npc-button__choices--three">${choiceChips("relationshipDensity", RELATIONSHIP_DENSITY, options.relationshipDensity ?? DEFAULT_OPTIONS.relationshipDensity)}</div>
            </fieldset>
            <fieldset class="runyth-npc-button__field">
              <legend>${escapeAttribute(localize("ui.internalConflict"))}</legend>
              <div class="runyth-npc-button__choices">${choiceChips("internalConflict", INTERNAL_CONFLICT, options.internalConflict ?? DEFAULT_OPTIONS.internalConflict)}</div>
            </fieldset>

            <div class="runyth-npc-button__field">
              <label for="runyth-npc-button-group-brief">${escapeAttribute(localize("ui.groupBrief"))}</label>
              <textarea id="runyth-npc-button-group-brief" name="groupBrief" rows="3" maxlength="1200" placeholder="${escapeAttribute(localize("ui.groupBriefPlaceholder"))}">${escapeAttribute(options.groupBrief ?? "")}</textarea>
              <small>${escapeAttribute(localize("ui.groupBriefHint"))}</small>
            </div>
          </div>
        </details>
      </section>

      <section class="runyth-npc-button__section">
        <div class="runyth-npc-button__section-heading">
          <div>
            <h2>${escapeAttribute(localize("ui.destination"))}</h2>
            <p>${escapeAttribute(localize("ui.destinationIntro"))}</p>
          </div>
        </div>
        ${hierarchicalPickerMarkup({
          id: "runyth-npc-button-folder-picker",
          name: "destinationSelection",
          label: localize("ui.destinationFolder"),
          hint: localize("ui.destinationHint"),
          value: destinationSelectionValue(options),
          display: destinationSelectionDisplay(options),
          placeholder: localize("ui.configuredDefault")
        })}
        <label class="runyth-npc-button__toggle">
          <input type="checkbox" name="openLastActor"${options.openLastActor ? " checked" : ""}>
          <span><strong>${escapeAttribute(localize("ui.openLastActor"))}</strong><small>${escapeAttribute(localize("ui.openLastActorHint"))}</small></span>
        </label>
      </section>

      <section class="runyth-npc-button__section runyth-npc-button__section--ai">
        <div class="runyth-npc-button__section-heading">
          <div>
            <h2><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> ${escapeAttribute(localize("ui.aiTitle"))}</h2>
            <p>${escapeAttribute(localize("ui.aiIntro"))}</p>
          </div>
        </div>
        <label class="runyth-npc-button__toggle">
          <input type="checkbox" name="singleAiObject"${options.singleAiObject && Number(options.count) === 1 ? " checked" : ""}${Number(options.count) === 1 ? "" : " disabled"}>
          <span><strong>${escapeAttribute(localize("ui.singleAiObject"))}</strong><small>${escapeAttribute(localize("ui.singleAiObjectHint"))}</small></span>
        </label>
        <div class="runyth-npc-button__button-row">
          <button type="button" data-action="copy-prompt"><i class="fa-regular fa-copy" aria-hidden="true"></i>${escapeAttribute(localize("ui.copyPrompt"))}</button>
          <button type="button" data-action="import-npc"><i class="fa-solid fa-file-import" aria-hidden="true"></i>${escapeAttribute(localize("ui.importNpc"))}</button>
        </div>
        <details class="runyth-npc-button__fallback">
          <summary>${escapeAttribute(localize("ui.manualPaste"))}</summary>
          <label for="runyth-npc-button-ai-payload">${escapeAttribute(localize("ui.manualPasteLabel"))}</label>
          <textarea id="runyth-npc-button-ai-payload" name="aiPayload" rows="7" spellcheck="false" placeholder="${escapeAttribute(localize("ui.manualPastePlaceholder"))}"></textarea>
        </details>
      </section>

      <footer class="runyth-npc-button__footer">
        <span class="runyth-npc-button__status" role="status" aria-live="polite"></span>
        <button type="button" class="runyth-npc-button__primary" data-action="create-local"><i class="fa-solid fa-user-plus" aria-hidden="true"></i>${escapeAttribute(localize("ui.createLocally"))}</button>
      </footer>
    </form>
  `;
}

function parseJsonArray(value, fallback = []) {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? parsed.map(String) : fallback;
  } catch {
    return fallback;
  }
}

function readRaceWeights(form, groupRaces) {
  const weights = {};
  for (const raceId of groupRaces) weights[raceId] = 1;
  for (const input of form.querySelectorAll("[data-race-weight]")) {
    const id = input.dataset.raceId;
    if (!id || !groupRaces.includes(id)) continue;
    weights[id] = Math.max(0, Math.min(1000, Number(input.value) || 0));
  }
  return weights;
}

function readRoleWeights(form, groupRoles) {
  const weights = {};
  for (const roleId of groupRoles) weights[roleId] = 1;
  for (const input of form.querySelectorAll("[data-role-weight]")) {
    const id = input.dataset.roleId;
    if (!id || !groupRoles.includes(id)) continue;
    weights[id] = Math.max(0, Math.min(1000, Number(input.value) || 0));
  }
  return weights;
}

function readForm(form) {
  const elements = form.elements;
  const remembered = loadLastOptions();
  const maxBatch = Number(game.settings.get(MODULE_ID, SETTINGS.MAX_BATCH)) || 25;
  const tierStyle = game.settings.get(MODULE_ID, SETTINGS.TIER_STYLE) || TIER_STYLES.NAMED;
  const rawCount = Math.trunc(Number(elements.count.valueAsNumber) || 1);
  const count = Math.min(Math.max(1, rawCount), maxBatch);
  elements.count.value = String(count);
  const race = resolveRaceSelection(elements.raceSelection.value);
  const destination = resolveDestinationSelection(elements.destinationSelection.value);
  const tier = tierStyle === TIER_STYLES.NAMED ? elements.tier.value : (remembered.tier ?? DEFAULT_OPTIONS.tier);
  const cr = tierStyle === TIER_STYLES.CR ? Number(elements.cr.value) : Number(remembered.cr ?? DEFAULT_OPTIONS.cr);
  const rawGroupRaces = parseJsonArray(elements.groupRaces?.value, [raceSelectionValue(race)]);
  const primaryRace = race.species === "custom" ? `custom:${race.customSpecies}` : race.species;
  const groupRaces = normalizeGroupRaceIds({ species: race.species, customSpecies: race.customSpecies, groupRaces: rawGroupRaces });
  const rawGroupRoles = parseJsonArray(elements.groupRoles?.value, [elements.role.value]);
  const groupRoles = normalizeGroupRoleIds({ role: elements.role.value, groupRoles: rawGroupRoles });
  const primaryRole = elements.role.value;

  return {
    count,
    role: elements.role.value,
    tierStyle,
    tier,
    cr,
    species: race.species,
    namingStyle: elements.namingStyle.value,
    wealth: elements.wealth.value,
    combatReadiness: elements.combatReadiness?.value ?? DEFAULT_OPTIONS.combatReadiness,
    habitat: elements.habitat.value,
    groupType: elements.groupType.value,
    familyStructure: elements.familyStructure?.value ?? DEFAULT_OPTIONS.familyStructure,
    groupCohesion: elements.groupCohesion?.value ?? DEFAULT_OPTIONS.groupCohesion,
    groupHierarchy: elements.groupHierarchy?.value ?? DEFAULT_OPTIONS.groupHierarchy,
    relationshipDensity: elements.relationshipDensity?.value ?? DEFAULT_OPTIONS.relationshipDensity,
    internalConflict: elements.internalConflict?.value ?? DEFAULT_OPTIONS.internalConflict,
    raceComposition: elements.raceComposition?.value ?? DEFAULT_OPTIONS.raceComposition,
    groupRaces,
    primaryRace,
    raceDistribution: elements.raceComposition?.value ?? DEFAULT_OPTIONS.raceDistribution,
    raceWeights: readRaceWeights(form, groupRaces),
    roleComposition: elements.roleComposition?.value ?? DEFAULT_OPTIONS.roleComposition,
    groupRoles,
    primaryRole,
    roleWeights: readRoleWeights(form, groupRoles),
    groupBrief: elements.groupBrief?.value.trim() ?? "",
    customName: elements.customName.value.trim(),
    customSpecies: race.customSpecies,
    seed: elements.seed.value.trim(),
    folderId: destination.folderId,
    newFolderName: destination.newFolderName,
    useActorRoot: destination.useActorRoot,
    openLastActor: elements.openLastActor.checked,
    singleAiObject: count === 1 && elements.singleAiObject.checked,
    aiPayload: elements.aiPayload.value.trim()
  };
}

function promptOptions(options) {
  const style = getNamingStyles()[options.namingStyle] ?? getNamingStyles().central ?? NAME_STYLES.central;
  const race = options.species === "custom"
    ? options.customSpecies
    : configuredLabel(getRaces()[options.species] ?? getRaces().human ?? RACES.human);
  const role = getRoles()[options.role] ?? getRoles().guard ?? ROLES.guard;
  const roleComposition = ROLE_COMPOSITION_MODES[options.roleComposition] ?? ROLE_COMPOSITION_MODES.groupPreset;
  const combatReadiness = COMBAT_READINESS[options.combatReadiness] ?? COMBAT_READINESS.standard;
  const combatProfile = role.combatProfile ?? ROLE_COMBAT_PROFILES[options.role] ?? ROLE_COMBAT_PROFILES.civilian;
  const wealth = WEALTH_LEVELS[options.wealth] ?? WEALTH_LEVELS.average;
  const tierProfile = resolveTierProfile(options);
  const habitatValue = String(options.habitat ?? DEFAULT_OPTIONS.habitat);
  const habitat = habitatValue.startsWith("custom:")
    ? { label: habitatValue.slice(7).trim() || configuredLabel(getHabitats().forestVillage ?? HABITATS.forestVillage), prompt: "use the custom habitat literally and adapt daily life, possessions, travel, and social assumptions to it" }
    : (getHabitats()[habitatValue] ?? getHabitats().forestVillage ?? HABITATS.forestVillage);
  const groupType = getGroupTypes()[options.groupType] ?? getGroupTypes().independent ?? GROUP_TYPES.independent;
  const groupRaceIds = normalizeGroupRaceIds(options);
  const groupRaceLabels = groupRaceIds.map(raceLabelFromSelectionId);
  const weightSummary = groupRaceIds.map((id) => `${raceLabelFromSelectionId(id)}=${Number(options.raceWeights?.[id]) || 0}`).join(", ");
  const groupRoleIds = normalizeGroupRoleIds(options);
  const groupRoleLabels = groupRoleIds.map((id) => configuredLabel(getRoles()[id] ?? { label: id }));
  const roleWeightSummary = groupRoleIds.map((id) => `${configuredLabel(getRoles()[id] ?? { label: id })}=${Number(options.roleWeights?.[id]) || 0}`).join(", ");

  return {
    ...options,
    roleLabel: configuredLabel(role),
    roleEquipmentHint: role.aiEquipmentHint,
    roleVariants: role.variants ?? ROLE_VARIANTS[options.role] ?? [],
    roleCompositionLabel: configuredLabel(roleComposition),
    roleCompositionPrompt: roleComposition.prompt,
    groupRoleLabels,
    roleWeightSummary,
    combatReadinessLabel: configuredLabel(combatReadiness),
    combatReadinessPrompt: combatReadiness.prompt,
    roleCombatGuidance: combatProfile.guidance,
    tierLabel: options.tierStyle === TIER_STYLES.CR ? tierProfile.label : configuredLabel(TIERS[options.tier] ?? TIERS.trained),
    raceLabel: race,
    wealthLabel: configuredLabel(wealth),
    wealthPrompt: wealth.prompt,
    namingStyleLabel: configuredLabel(style),
    namingStyleGuidance: style.aiGuidance,
    namingExamples: style.examples,
    habitatLabel: configuredLabel(habitat),
    habitatPrompt: habitat.prompt,
    groupTypeLabel: configuredLabel(groupType),
    groupTypePrompt: groupType.prompt,
    familyStructureLabel: configuredLabel(FAMILY_STRUCTURES[options.familyStructure] ?? FAMILY_STRUCTURES.household),
    groupCohesionLabel: configuredLabel(GROUP_COHESION[options.groupCohesion] ?? GROUP_COHESION.functional),
    groupCohesionPrompt: (GROUP_COHESION[options.groupCohesion] ?? GROUP_COHESION.functional).prompt,
    groupHierarchyLabel: configuredLabel(GROUP_HIERARCHY[options.groupHierarchy] ?? GROUP_HIERARCHY.informal),
    groupHierarchyPrompt: (GROUP_HIERARCHY[options.groupHierarchy] ?? GROUP_HIERARCHY.informal).prompt,
    relationshipDensityLabel: configuredLabel(RELATIONSHIP_DENSITY[options.relationshipDensity] ?? RELATIONSHIP_DENSITY.rich),
    relationshipDensityPrompt: (RELATIONSHIP_DENSITY[options.relationshipDensity] ?? RELATIONSHIP_DENSITY.rich).prompt,
    internalConflictLabel: configuredLabel(INTERNAL_CONFLICT[options.internalConflict] ?? INTERNAL_CONFLICT.low),
    internalConflictPrompt: (INTERNAL_CONFLICT[options.internalConflict] ?? INTERNAL_CONFLICT.low).prompt,
    raceCompositionLabel: configuredLabel(RACE_COMPOSITION_MODES[options.raceComposition] ?? RACE_COMPOSITION_MODES.single),
    raceCompositionPrompt: (RACE_COMPOSITION_MODES[options.raceComposition] ?? RACE_COMPOSITION_MODES.single).prompt,
    groupRaceLabels,
    primaryRaceLabel: race,
    raceDistributionLabel: configuredLabel(RACE_DISTRIBUTIONS[options.raceDistribution] ?? RACE_DISTRIBUTIONS.balanced),
    raceDistributionPrompt: (RACE_DISTRIBUTIONS[options.raceDistribution] ?? RACE_DISTRIBUTIONS.balanced).prompt,
    raceWeightSummary: weightSummary
  };
}

async function copyPlainText(text) {
  if (game.clipboard?.copyPlainText) {
    await game.clipboard.copyPlainText(text);
    return;
  }
  if (!navigator.clipboard?.writeText) throw new Error(localize("errors.clipboardWrite"));
  await navigator.clipboard.writeText(text);
}

async function readClipboardText() {
  if (!navigator.clipboard?.readText) throw new Error(localize("errors.clipboardRead"));
  return navigator.clipboard.readText();
}

function safeWindowState(state) {
  const hasSavedState = ["left", "top", "width", "height"].some((key) => Number.isFinite(Number(state?.[key])));
  if (!hasSavedState) return {};

  const margin = 12;
  const viewportWidth = Math.max(320, document.documentElement.clientWidth || window.innerWidth || 1280);
  const viewportHeight = Math.max(320, document.documentElement.clientHeight || window.innerHeight || 720);
  const maxWidth = Math.max(320, viewportWidth - (margin * 2));
  const maxHeight = Math.max(320, viewportHeight - (margin * 2));
  const width = Math.min(Math.max(560, Number(state.width) || 860), maxWidth);
  const height = Math.min(Math.max(440, Number(state.height) || 860), maxHeight);
  const maxLeft = Math.max(margin, viewportWidth - width - margin);
  const maxTop = Math.max(margin, viewportHeight - height - margin);
  const left = Math.min(Math.max(margin, Number(state.left) || margin), maxLeft);
  const top = Math.min(Math.max(margin, Number(state.top) || margin), maxTop);
  return { left, top, width, height };
}

class NpcDashboardApplication extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "runyth-npc-button-dashboard",
    classes: ["runyth-npc-button", "runyth-npc-button--dashboard"],
    window: {
      title: `${MODULE_ID}.ui.dialogTitle`,
      icon: "fa-solid fa-user-plus",
      resizable: true,
      minimizable: true
    },
    position: {
      width: 860,
      height: 860
    }
  };

  #abortController = null;
  #savePositionTimer = null;
  #racePickerController = null;
  #groupRacePickerController = null;
  #groupRolePickerController = null;

  constructor(options = {}) {
    const rememberedPosition = safeWindowState(loadWindowState());
    super({
      ...options,
      position: {
        ...rememberedPosition,
        ...(options.position ?? {})
      }
    });
  }

  async _renderHTML() {
    const remembered = loadLastOptions();
    const options = { ...DEFAULT_OPTIONS, ...remembered };
    const tierStyle = game.settings.get(MODULE_ID, SETTINGS.TIER_STYLE) || TIER_STYLES.NAMED;
    const template = document.createElement("template");
    template.innerHTML = dashboardContent(options, tierStyle);
    return template.content;
  }

  _replaceHTML(result, content) {
    content.replaceChildren(result);
  }

  _onPosition(position) {
    super._onPosition(position);
    clearTimeout(this.#savePositionTimer);
    this.#savePositionTimer = window.setTimeout(() => {
      void saveWindowState(position).catch((error) => logger.debug("Could not save dashboard window state", error));
    }, 250);
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#abortController?.abort();
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;
    const form = this.element.querySelector("form");
    if (!form) return;

    this.#injectHelpButton(signal);
    this.#mountPickers(form, signal);

    for (const button of form.querySelectorAll("[data-count]")) {
      button.addEventListener("click", () => {
        form.elements.count.value = button.dataset.count;
        form.elements.count.dispatchEvent(new Event("input", { bubbles: true }));
      }, { signal });
    }

    form.elements.count.addEventListener("input", () => this.#syncCountControls(form), { signal });
    form.elements.count.addEventListener("change", () => {
      const maxBatch = Number(game.settings.get(MODULE_ID, SETTINGS.MAX_BATCH)) || 25;
      const value = Math.min(Math.max(1, Math.trunc(Number(form.elements.count.valueAsNumber) || 1)), maxBatch);
      form.elements.count.value = String(value);
      this.#syncCountControls(form);
    }, { signal });

    form.elements.groupType.addEventListener("change", () => this.#syncGroupControls(form, { adjustCount: true }), { signal });
    form.elements.raceSelection.addEventListener("change", () => {
      const primary = String(form.elements.raceSelection.value || "human");
      const values = this.#groupRacePickerController?.getValues() ?? [];
      if (!values.includes(primary)) this.#groupRacePickerController?.setValues([primary, ...values]);
      this.#renderRaceWeights(form);
    }, { signal });
    form.elements.role.addEventListener("change", () => {
      const primary = String(form.elements.role.value || DEFAULT_OPTIONS.role);
      const values = this.#groupRolePickerController?.getValues() ?? [];
      if (!values.includes(primary)) this.#groupRolePickerController?.setValues([primary, ...values]);
      this.#renderRoleWeights(form);
    }, { signal });
    form.elements.raceComposition.addEventListener("change", () => this.#syncRaceComposition(form), { signal });
    form.elements.groupRaces.addEventListener("change", () => this.#renderRaceWeights(form), { signal });
    form.elements.roleComposition.addEventListener("change", () => this.#syncRoleComposition(form), { signal });
    form.elements.groupRoles.addEventListener("change", () => this.#renderRoleWeights(form), { signal });

    form.querySelector("[data-group-size-presets]").addEventListener("click", (event) => {
      const button = event.target.closest("[data-group-count]");
      if (!button) return;
      form.elements.count.value = button.dataset.groupCount;
      form.elements.count.dispatchEvent(new Event("input", { bubbles: true }));
    }, { signal });

    this.#syncCountControls(form);
    this.#syncGroupControls(form);
    this.#syncRaceComposition(form);
    this.#syncRoleComposition(form);

    form.querySelector('[data-action="create-local"]').addEventListener("click", () => {
      void this.#createLocal(form);
    }, { signal });
    form.querySelector('[data-action="copy-prompt"]').addEventListener("click", () => {
      void this.#copyPrompt(form);
    }, { signal });
    form.querySelector('[data-action="import-npc"]').addEventListener("click", () => {
      void this.#importNpc(form);
    }, { signal });
  }

  async _preClose(options) {
    clearTimeout(this.#savePositionTimer);
    await saveWindowState(this.position).catch((error) => logger.debug("Could not save dashboard window state on close", error));
    await super._preClose(options);
  }

  #mountPickers(form, signal) {
    const common = {
      searchPlaceholder: localize("ui.searchOptions"),
      emptyText: localize("ui.noMatchingOptions")
    };
    mountHierarchicalPicker(form.querySelector('[data-hierarchical-picker="runyth-npc-button-group-type-picker"]'), {
      ...common,
      items: groupTypePickerItems()
    }, signal);
    mountHierarchicalPicker(form.querySelector('[data-hierarchical-picker="runyth-npc-button-habitat-picker"]'), {
      ...common,
      items: habitatPickerItems(),
      allowCustom: true,
      customValueBuilder: (text) => `custom:${text}`,
      customDescription: () => localize("ui.useCustomHabitat")
    }, signal);
    mountHierarchicalPicker(form.querySelector('[data-hierarchical-picker="runyth-npc-button-role-picker"]'), {
      ...common,
      items: rolePickerItems()
    }, signal);

    const tierStyle = game.settings.get(MODULE_ID, SETTINGS.TIER_STYLE) || TIER_STYLES.NAMED;
    mountHierarchicalPicker(form.querySelector('[data-hierarchical-picker="runyth-npc-button-tier-picker"]'), {
      ...common,
      items: tierStyle === TIER_STYLES.CR ? crTierPickerItems() : namedTierPickerItems()
    }, signal);

    this.#racePickerController = mountHierarchicalPicker(form.querySelector('[data-hierarchical-picker="runyth-npc-button-race-picker"]'), {
      ...common,
      items: racePickerItems(),
      allowCustom: true,
      customValueBuilder: (text) => `custom:${text}`,
      customDescription: () => localize("ui.useCustomRace")
    }, signal);

    mountHierarchicalPicker(form.querySelector('[data-hierarchical-picker="runyth-npc-button-naming-picker"]'), {
      ...common,
      items: namingPickerItems()
    }, signal);

    this.#groupRacePickerController = mountHierarchicalMultiPicker(form.querySelector('[data-hierarchical-multi-picker="runyth-npc-button-group-races-picker"]'), {
      ...common,
      items: racePickerItems(),
      allowCustom: true,
      customValueBuilder: (text) => `custom:${text}`,
      customDescription: () => localize("ui.useCustomRace"),
      customGroupLabel: localize("raceGroups.custom"),
      doneText: localize("ui.done"),
      requireOne: true,
      fallbackValue: "human",
      placeholder: localize("ui.choosePossibleRaces")
    }, signal);

    this.#groupRolePickerController = mountHierarchicalMultiPicker(form.querySelector('[data-hierarchical-multi-picker="runyth-npc-button-group-roles-picker"]'), {
      ...common,
      items: rolePickerItems(),
      doneText: localize("ui.done"),
      requireOne: true,
      fallbackValue: DEFAULT_OPTIONS.role,
      placeholder: localize("ui.choosePossibleRoles")
    }, signal);

    mountHierarchicalPicker(form.querySelector('[data-hierarchical-picker="runyth-npc-button-folder-picker"]'), {
      ...common,
      items: actorFolderPickerItems(),
      allowCustom: true,
      customValueBuilder: (text) => `new:${text}`,
      customDescription: () => localize("ui.createRootFolder")
    }, signal);
  }

  #injectHelpButton(signal) {
    const header = this.window?.header;
    if (!header || header.querySelector(`[data-${MODULE_ID}-help]`)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "runyth-npc-button__header-help";
    button.setAttribute(`data-${MODULE_ID}-help`, "true");
    button.title = localize("ui.help");
    button.setAttribute("aria-label", localize("ui.help"));
    button.innerHTML = '<i class="fa-solid fa-circle-question" aria-hidden="true"></i>';
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void openNpcHelp(this);
    }, { signal });
    this.window.close.before(button);
  }

  #syncCountControls(form) {
    const count = Math.trunc(Number(form.elements.count.valueAsNumber) || 1);
    for (const button of form.querySelectorAll("[data-count], [data-group-count]")) {
      const configured = Number(button.dataset.count ?? button.dataset.groupCount);
      const active = configured === count;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    const single = form.elements.singleAiObject;
    single.disabled = count !== 1;
    if (count !== 1) single.checked = false;
  }

  #syncGroupControls(form, { adjustCount = false } = {}) {
    const typeId = String(form.elements.groupType.value || DEFAULT_OPTIONS.groupType);
    const type = getGroupTypes()[typeId] ?? getGroupTypes().independent ?? GROUP_TYPES.independent;
    const groupSection = form.querySelector("[data-group-config]");
    groupSection.hidden = typeId === "independent";
    form.querySelector("[data-family-settings]").hidden = typeId !== "family";

    const maxBatch = Number(game.settings.get(MODULE_ID, SETTINGS.MAX_BATCH)) || 25;
    const sizes = form.querySelector("[data-group-size-presets]");
    sizes.innerHTML = suggestedSizesMarkup(typeId, maxBatch);
    if (adjustCount) {
      const current = Math.trunc(Number(form.elements.count.valueAsNumber) || 1);
      if (current < type.minCount) {
        const target = type.suggestedSizes.find((value) => value >= type.minCount && value <= maxBatch) ?? type.minCount;
        form.elements.count.value = String(Math.min(target, maxBatch));
      }
      if (typeId === "orcRaiders" && form.elements.raceSelection.value === "human") {
        this.#racePickerController?.setValue("orc", configuredLabel(getRaces().orc ?? RACES.orc));
      }
    }
    this.#syncCountControls(form);
  }

  #syncRaceComposition(form) {
    const composition = form.elements.raceComposition.value;
    const mixed = composition !== "single";
    form.querySelector("[data-mixed-race-settings]").hidden = !mixed;
    form.querySelector("[data-race-weights]").hidden = composition !== "weighted";
    if (mixed) this.#renderRaceWeights(form);
  }

  #syncRoleComposition(form) {
    const composition = form.elements.roleComposition.value;
    const mixed = ["balanced", "primary", "dominant", "weighted"].includes(composition);
    form.querySelector("[data-mixed-role-settings]").hidden = !mixed;
    form.querySelector("[data-role-weights]").hidden = composition !== "weighted";
    if (mixed) this.#renderRoleWeights(form);
  }

  #renderRaceWeights(form) {
    const container = form.querySelector("[data-race-weight-list]");
    if (!container) return;
    const selected = parseJsonArray(form.elements.groupRaces.value, ["human"]);
    const remembered = loadLastOptions();
    const current = {};
    for (const input of container.querySelectorAll("[data-race-weight]")) current[input.dataset.raceId] = Number(input.value) || 0;
    const configured = { ...(remembered.raceWeights ?? {}), ...current };
    container.innerHTML = selected.map((raceId) => `
      <label class="runyth-npc-button__weight-row">
        <span>${escapeAttribute(raceLabelFromSelectionId(raceId))}</span>
        <input type="number" min="0" max="1000" step="1" inputmode="numeric" value="${escapeAttribute(configured[raceId] ?? 1)}" data-race-weight data-race-id="${escapeAttribute(raceId)}">
      </label>
    `).join("");
  }

  #renderRoleWeights(form) {
    const container = form.querySelector("[data-role-weight-list]");
    if (!container) return;
    const selected = parseJsonArray(form.elements.groupRoles.value, [DEFAULT_OPTIONS.role]);
    const remembered = loadLastOptions();
    const current = {};
    for (const input of container.querySelectorAll("[data-role-weight]")) current[input.dataset.roleId] = Number(input.value) || 0;
    const configured = { ...(remembered.roleWeights ?? {}), ...current };
    container.innerHTML = selected.map((roleId) => `
      <label class="runyth-npc-button__weight-row">
        <span>${escapeAttribute(configuredLabel(getRoles()[roleId] ?? { label: roleId }))}</span>
        <input type="number" min="0" max="1000" step="1" inputmode="numeric" value="${escapeAttribute(configured[roleId] ?? 1)}" data-role-weight data-role-id="${escapeAttribute(roleId)}">
      </label>
    `).join("");
  }

  #setBusy(form, busy, message = "") {
    for (const control of form.querySelectorAll("button, input, textarea")) {
      if (busy) {
        control.dataset.runythWasDisabled = String(control.disabled);
        control.disabled = true;
      } else {
        control.disabled = control.dataset.runythWasDisabled === "true";
        delete control.dataset.runythWasDisabled;
      }
    }
    form.querySelector(".runyth-npc-button__status").textContent = message;
    if (!busy) {
      this.#syncCountControls(form);
      this.#syncRaceComposition(form);
      this.#syncRoleComposition(form);
    }
  }

  async #createLocal(form) {
    const options = readForm(form);
    this.#setBusy(form, true, localize("ui.creating"));
    try {
      await saveLastOptions(options);
      const actors = await createNpcActors(options);
      if (!actors.length) {
        ui.notifications.warn(localize("notifications.noneCreated"));
        return;
      }
      ui.notifications.info(game.i18n.format(`${MODULE_ID}.notifications.created`, { count: actors.length }));
      if (options.openLastActor) await openActorReviewStack(actors);
    } catch (error) {
      logger.error("NPC generation failed.", error);
      ui.notifications.error(game.i18n.format(`${MODULE_ID}.notifications.failed`, { message: error?.message ?? String(error) }));
    } finally {
      this.#setBusy(form, false);
    }
  }

  async #copyPrompt(form) {
    const options = readForm(form);
    this.#setBusy(form, true, localize("ui.copyingPrompt"));
    try {
      await saveLastOptions(options);
      const prompt = buildAiPrompt(promptOptions(options));
      await copyPlainText(prompt);
      ui.notifications.info(localize("notifications.promptCopied"));
    } catch (error) {
      logger.error("Could not copy AI prompt.", error);
      ui.notifications.error(game.i18n.format(`${MODULE_ID}.notifications.failed`, { message: error?.message ?? String(error) }));
    } finally {
      this.#setBusy(form, false);
    }
  }

  async #importNpc(form) {
    const options = readForm(form);
    this.#setBusy(form, true, localize("ui.importing"));
    try {
      await saveLastOptions(options);
      let text = options.aiPayload;
      if (!text) {
        try {
          text = await readClipboardText();
        } catch (error) {
          const details = form.querySelector(".runyth-npc-button__fallback");
          details.open = true;
          form.elements.aiPayload.focus();
          throw new Error(`${error.message} ${localize("errors.manualPasteFallback")}`);
        }
      }
      const maxBatch = Number(game.settings.get(MODULE_ID, SETTINGS.MAX_BATCH)) || 25;
      const sources = parseAndNormalizeNpcJson(text, {
        expectedCount: options.count,
        maxCount: maxBatch,
        allowSingleObject: options.singleAiObject
      });
      const actors = await createImportedNpcActors(sources, options);
      if (!actors.length) {
        ui.notifications.warn(localize("notifications.noneImported"));
        return;
      }
      ui.notifications.info(game.i18n.format(`${MODULE_ID}.notifications.imported`, { count: actors.length }));
      form.elements.aiPayload.value = "";
      if (options.openLastActor) await openActorReviewStack(actors);
    } catch (error) {
      logger.error("NPC import failed.", error);
      ui.notifications.error(game.i18n.format(`${MODULE_ID}.notifications.importFailed`, { message: error?.message ?? String(error) }));
    } finally {
      this.#setBusy(form, false);
    }
  }
}

let dashboardApplication = null;

export async function openNpcDashboard() {
  if (!game.user?.isGM) {
    ui.notifications.warn(localize("notifications.gmOnly"));
    return null;
  }
  if (!dashboardApplication) dashboardApplication = new NpcDashboardApplication();
  if (!dashboardApplication.rendered) await dashboardApplication.render({ force: true });
  dashboardApplication.bringToFront();
  return dashboardApplication;
}

export const openNpcDialog = openNpcDashboard;
