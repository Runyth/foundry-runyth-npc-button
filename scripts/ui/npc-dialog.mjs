import { DEFAULT_OPTIONS, MODULE_ID, SETTINGS } from "../constants.mjs";
import { NAME_STYLES, ROLES, SPECIES, TIERS } from "../generator/data.mjs";
import { logger } from "../logger.mjs";
import { loadLastOptions, saveLastOptions } from "../settings.mjs";
import { createNpcActors } from "../services/actor-service.mjs";
import { escapeAttribute } from "../utils/html.mjs";

function localize(key) {
  return game.i18n.localize(`${MODULE_ID}.${key}`);
}

function optionList(entries, selected) {
  return Object.entries(entries)
    .map(([value, config]) => {
      const label = config.labelKey ? localize(config.labelKey) : config.label;
      return `<option value="${escapeAttribute(value)}"${value === selected ? " selected" : ""}>${escapeAttribute(label)}</option>`;
    })
    .join("");
}

function folderOptions(selected) {
  const folders = Array.from(game.folders ?? [])
    .filter((folder) => folder.type === "Actor")
    .sort((left, right) => left.name.localeCompare(right.name));

  const root = `<option value=""${selected ? "" : " selected"}>${escapeAttribute(localize("ui.defaultFolder"))}</option>`;
  const options = folders.map((folder) => (
    `<option value="${escapeAttribute(folder.id)}"${folder.id === selected ? " selected" : ""}>${escapeAttribute(folder.name)}</option>`
  ));
  return [root, ...options].join("");
}

function readForm(form) {
  const elements = form.elements;
  return {
    count: elements.count.valueAsNumber,
    role: elements.role.value,
    tier: elements.tier.value,
    species: elements.species.value,
    namingStyle: elements.namingStyle.value,
    customName: elements.customName.value.trim(),
    customSpecies: elements.customSpecies.value.trim(),
    seed: elements.seed.value.trim(),
    folderId: elements.folderId.value,
    newFolderName: elements.newFolderName.value.trim(),
    openLastActor: elements.openLastActor.checked
  };
}

function dialogContent(options) {
  const maxBatch = Number(game.settings.get(MODULE_ID, SETTINGS.MAX_BATCH)) || 25;
  return `
    <div class="runyth-npc-button__dialog">
      <p class="runyth-npc-button__intro">${escapeAttribute(localize("ui.intro"))}</p>
      <div class="runyth-npc-button__grid">
        <label class="form-group">
          <span>${escapeAttribute(localize("ui.count"))}</span>
          <input type="number" name="count" min="1" max="${maxBatch}" step="1" value="${escapeAttribute(options.count)}">
        </label>
        <label class="form-group">
          <span>${escapeAttribute(localize("ui.role"))}</span>
          <select name="role">${optionList(ROLES, options.role)}</select>
        </label>
        <label class="form-group">
          <span>${escapeAttribute(localize("ui.tier"))}</span>
          <select name="tier">${optionList(TIERS, options.tier)}</select>
        </label>
        <label class="form-group">
          <span>${escapeAttribute(localize("ui.species"))}</span>
          <select name="species">${optionList(SPECIES, options.species)}</select>
        </label>
        <label class="form-group">
          <span>${escapeAttribute(localize("ui.customSpecies"))}</span>
          <input type="text" name="customSpecies" maxlength="80" value="${escapeAttribute(options.customSpecies)}" placeholder="${escapeAttribute(localize("ui.customSpeciesPlaceholder"))}">
        </label>
        <label class="form-group">
          <span>${escapeAttribute(localize("ui.namingStyle"))}</span>
          <select name="namingStyle">${optionList(NAME_STYLES, options.namingStyle)}</select>
        </label>
        <label class="form-group runyth-npc-button__wide">
          <span>${escapeAttribute(localize("ui.customName"))}</span>
          <input type="text" name="customName" maxlength="100" value="" placeholder="${escapeAttribute(localize("ui.customNamePlaceholder"))}">
        </label>
        <label class="form-group runyth-npc-button__wide">
          <span>${escapeAttribute(localize("ui.seed"))}</span>
          <input type="text" name="seed" maxlength="120" value="" placeholder="${escapeAttribute(localize("ui.seedPlaceholder"))}">
          <small>${escapeAttribute(localize("ui.seedHint"))}</small>
        </label>
      </div>
      <fieldset class="runyth-npc-button__fieldset">
        <legend>${escapeAttribute(localize("ui.destination"))}</legend>
        <div class="runyth-npc-button__grid">
          <label class="form-group">
            <span>${escapeAttribute(localize("ui.folder"))}</span>
            <select name="folderId">${folderOptions(options.folderId)}</select>
          </label>
          <label class="form-group">
            <span>${escapeAttribute(localize("ui.newFolder"))}</span>
            <input type="text" name="newFolderName" maxlength="100" value="" placeholder="${escapeAttribute(localize("ui.newFolderPlaceholder"))}">
          </label>
        </div>
      </fieldset>
      <label class="runyth-npc-button__checkbox">
        <input type="checkbox" name="openLastActor"${options.openLastActor ? " checked" : ""}>
        <span>${escapeAttribute(localize("ui.openLastActor"))}</span>
      </label>
    </div>
  `;
}

export async function openNpcDialog() {
  if (!game.user?.isGM) {
    ui.notifications.warn(localize("notifications.gmOnly"));
    return [];
  }

  const remembered = loadLastOptions();
  const options = { ...DEFAULT_OPTIONS, ...remembered };
  const DialogV2 = foundry.applications.api.DialogV2;

  const result = await DialogV2.wait({
    window: {
      title: localize("ui.dialogTitle")
    },
    content: dialogContent(options),
    modal: true,
    buttons: [
      {
        action: "create",
        label: `${MODULE_ID}.ui.create`,
        icon: "fa-solid fa-user-plus",
        default: true,
        callback: async (_event, button) => readForm(button.form)
      },
      {
        action: "cancel",
        label: `${MODULE_ID}.ui.cancel`,
        icon: "fa-solid fa-xmark"
      }
    ]
  });

  if (!result || result === "cancel") return [];

  try {
    await saveLastOptions(result);
    const actors = await createNpcActors(result);
    if (!actors.length) {
      ui.notifications.warn(localize("notifications.noneCreated"));
      return [];
    }

    ui.notifications.info(game.i18n.format(`${MODULE_ID}.notifications.created`, { count: actors.length }));
    if (result.openLastActor) actors.at(-1)?.sheet?.render(true);
    return actors;
  } catch (error) {
    logger.error("NPC generation failed.", error);
    ui.notifications.error(game.i18n.format(`${MODULE_ID}.notifications.failed`, { message: error?.message ?? String(error) }));
    return [];
  }
}
