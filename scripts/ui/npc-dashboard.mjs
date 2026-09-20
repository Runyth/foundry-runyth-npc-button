import { buildAiPrompt } from "../ai/prompt-builder.mjs";
import { parseAndNormalizeNpcJson } from "../ai/npc-json.mjs";
import { DEFAULT_OPTIONS, MODULE_ID, SETTINGS } from "../constants.mjs";
import { NAME_STYLES, ROLES, SPECIES, TIERS } from "../generator/data.mjs";
import { logger } from "../logger.mjs";
import { loadLastOptions, loadWindowState, saveLastOptions, saveWindowState } from "../settings.mjs";
import { createImportedNpcActors, createNpcActors } from "../services/actor-service.mjs";
import { escapeAttribute } from "../utils/html.mjs";
import { openNpcHelp } from "./npc-help.mjs";

function localize(key) {
  return game.i18n.localize(`${MODULE_ID}.${key}`);
}

function configuredLabel(config) {
  return config.labelKey ? localize(config.labelKey) : config.label;
}

function choiceChips(name, entries, selected) {
  return Object.entries(entries).map(([value, config]) => `
    <label class="runyth-npc-button__choice">
      <input type="radio" name="${escapeAttribute(name)}" value="${escapeAttribute(value)}"${value === selected ? " checked" : ""}>
      <span>${escapeAttribute(configuredLabel(config))}</span>
    </label>
  `).join("");
}

function speciesDisplay(options) {
  if (options.species === "custom") return String(options.customSpecies ?? "");
  const config = SPECIES[options.species] ?? SPECIES.human;
  return configuredLabel(config);
}

function resolveSpeciesInput(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return { species: "human", customSpecies: "" };
  const lower = trimmed.toLocaleLowerCase();
  for (const [key, config] of Object.entries(SPECIES)) {
    if (key === "custom") continue;
    const labels = [key, config.label, configuredLabel(config)].map((entry) => String(entry).toLocaleLowerCase());
    if (labels.includes(lower)) return { species: key, customSpecies: "" };
  }
  return { species: "custom", customSpecies: trimmed || "Humanoid" };
}

function actorFolders() {
  const folders = Array.from(game.folders ?? []).filter((folder) => folder.type === "Actor");
  const byId = new Map(folders.map((folder) => [folder.id, folder]));

  function parentOf(folder) {
    const parent = folder.folder;
    if (!parent) return null;
    if (typeof parent === "object") return parent;
    return byId.get(parent) ?? null;
  }

  function pathOf(folder) {
    const names = [folder.name];
    const visited = new Set([folder.id]);
    let current = parentOf(folder);
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      names.unshift(current.name);
      current = parentOf(current);
    }
    return names.join(" / ");
  }

  return folders
    .map((folder) => ({ id: folder.id, label: pathOf(folder) }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function destinationDisplay(options) {
  if (options.newFolderName) return String(options.newFolderName);
  if (!options.folderId) return "";
  return actorFolders().find((entry) => entry.id === options.folderId)?.label ?? "";
}

function resolveDestinationInput(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return { folderId: "", newFolderName: "" };
  const match = actorFolders().find((entry) => entry.label.localeCompare(trimmed, undefined, { sensitivity: "accent" }) === 0);
  return match
    ? { folderId: match.id, newFolderName: "" }
    : { folderId: "", newFolderName: trimmed };
}

function dashboardContent(options) {
  const maxBatch = Number(game.settings.get(MODULE_ID, SETTINGS.MAX_BATCH)) || 25;
  const quickCounts = [1, 3, 5, 10].filter((value) => value <= maxBatch);
  const speciesOptions = Object.entries(SPECIES)
    .filter(([key]) => key !== "custom")
    .map(([, config]) => `<option value="${escapeAttribute(configuredLabel(config))}"></option>`)
    .join("");
  const folderOptions = actorFolders()
    .map((entry) => `<option value="${escapeAttribute(entry.label)}"></option>`)
    .join("");
  const defaultFolder = String(game.settings.get(MODULE_ID, SETTINGS.DEFAULT_FOLDER) ?? "").trim();

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

        <fieldset class="runyth-npc-button__field runyth-npc-button__field--full">
          <legend>${escapeAttribute(localize("ui.role"))}</legend>
          <div class="runyth-npc-button__choices">${choiceChips("role", ROLES, options.role)}</div>
        </fieldset>

        <fieldset class="runyth-npc-button__field runyth-npc-button__field--full">
          <legend>${escapeAttribute(localize("ui.tier"))}</legend>
          <div class="runyth-npc-button__choices">${choiceChips("tier", TIERS, options.tier)}</div>
        </fieldset>

        <div class="runyth-npc-button__grid">
          <div class="runyth-npc-button__field">
            <label for="runyth-npc-button-species">${escapeAttribute(localize("ui.species"))}</label>
            <input id="runyth-npc-button-species" type="text" name="speciesInput" list="runyth-npc-button-species-list" maxlength="80" aria-describedby="runyth-npc-button-species-hint" value="${escapeAttribute(speciesDisplay(options))}" placeholder="${escapeAttribute(localize("ui.speciesPlaceholder"))}">
            <datalist id="runyth-npc-button-species-list">${speciesOptions}</datalist>
            <small id="runyth-npc-button-species-hint">${escapeAttribute(localize("ui.speciesHint"))}</small>
          </div>
          <div class="runyth-npc-button__field">
            <label for="runyth-npc-button-name">${escapeAttribute(localize("ui.customName"))}</label>
            <input id="runyth-npc-button-name" type="text" name="customName" maxlength="100" value="" placeholder="${escapeAttribute(localize("ui.customNamePlaceholder"))}">
          </div>
        </div>

        <fieldset class="runyth-npc-button__field runyth-npc-button__field--full">
          <legend>${escapeAttribute(localize("ui.namingStyle"))}</legend>
          <div class="runyth-npc-button__choices runyth-npc-button__choices--naming">${choiceChips("namingStyle", NAME_STYLES, options.namingStyle)}</div>
        </fieldset>

        <div class="runyth-npc-button__field">
          <label for="runyth-npc-button-seed">${escapeAttribute(localize("ui.seed"))}</label>
          <input id="runyth-npc-button-seed" type="text" name="seed" maxlength="120" aria-describedby="runyth-npc-button-seed-hint" value="" placeholder="${escapeAttribute(localize("ui.seedPlaceholder"))}">
          <small id="runyth-npc-button-seed-hint">${escapeAttribute(localize("ui.seedHint"))}</small>
        </div>
      </section>

      <section class="runyth-npc-button__section">
        <div class="runyth-npc-button__section-heading">
          <div>
            <h2>${escapeAttribute(localize("ui.destination"))}</h2>
            <p>${escapeAttribute(localize("ui.destinationIntro"))}</p>
          </div>
        </div>
        <div class="runyth-npc-button__field">
          <label for="runyth-npc-button-destination">${escapeAttribute(localize("ui.destinationFolder"))}</label>
          <input id="runyth-npc-button-destination" type="text" name="destination" list="runyth-npc-button-folder-list" maxlength="160" aria-describedby="runyth-npc-button-destination-hint" value="${escapeAttribute(destinationDisplay(options))}" placeholder="${escapeAttribute(defaultFolder || localize("ui.actorsRoot"))}">
          <datalist id="runyth-npc-button-folder-list">${folderOptions}</datalist>
          <small id="runyth-npc-button-destination-hint">${escapeAttribute(localize("ui.destinationHint"))}</small>
        </div>
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

function readForm(form) {
  const elements = form.elements;
  const maxBatch = Number(game.settings.get(MODULE_ID, SETTINGS.MAX_BATCH)) || 25;
  const rawCount = Math.trunc(Number(elements.count.valueAsNumber) || 1);
  const count = Math.min(Math.max(1, rawCount), maxBatch);
  elements.count.value = String(count);
  const species = resolveSpeciesInput(elements.speciesInput.value);
  const destination = resolveDestinationInput(elements.destination.value);
  return {
    count,
    role: elements.role.value,
    tier: elements.tier.value,
    species: species.species,
    namingStyle: elements.namingStyle.value,
    customName: elements.customName.value.trim(),
    customSpecies: species.customSpecies,
    seed: elements.seed.value.trim(),
    folderId: destination.folderId,
    newFolderName: destination.newFolderName,
    openLastActor: elements.openLastActor.checked,
    singleAiObject: count === 1 && elements.singleAiObject.checked,
    aiPayload: elements.aiPayload.value.trim()
  };
}

function promptOptions(options) {
  const style = NAME_STYLES[options.namingStyle] ?? NAME_STYLES.central;
  const species = options.species === "custom"
    ? options.customSpecies
    : configuredLabel(SPECIES[options.species] ?? SPECIES.human);
  const examples = [
    `${style.given[0]} ${style.family[0]}`,
    `${style.given[1] ?? style.given[0]} ${style.family[1] ?? style.family[0]}`
  ];
  return {
    ...options,
    roleLabel: configuredLabel(ROLES[options.role] ?? ROLES.guard),
    tierLabel: configuredLabel(TIERS[options.tier] ?? TIERS.trained),
    speciesLabel: species,
    namingStyleLabel: configuredLabel(style),
    namingExamples: examples
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
  const width = Math.min(Math.max(480, Number(state.width) || 780), maxWidth);
  const height = Math.min(Math.max(420, Number(state.height) || 760), maxHeight);
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
      width: 780,
      height: 760
    }
  };

  #abortController = null;
  #savePositionTimer = null;

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
    const template = document.createElement("template");
    template.innerHTML = dashboardContent(options);
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

    for (const button of form.querySelectorAll("[data-count]")) {
      button.addEventListener("click", () => {
        const countInput = form.elements.count;
        countInput.value = button.dataset.count;
        countInput.dispatchEvent(new Event("input", { bubbles: true }));
      }, { signal });
    }

    form.elements.count.addEventListener("input", () => this.#syncCountControls(form), { signal });
    form.elements.count.addEventListener("change", () => {
      const maxBatch = Number(game.settings.get(MODULE_ID, SETTINGS.MAX_BATCH)) || 25;
      const value = Math.min(Math.max(1, Math.trunc(Number(form.elements.count.valueAsNumber) || 1)), maxBatch);
      form.elements.count.value = String(value);
      this.#syncCountControls(form);
    }, { signal });
    this.#syncCountControls(form);

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
    for (const button of form.querySelectorAll("[data-count]")) {
      const active = Number(button.dataset.count) === count;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    const single = form.elements.singleAiObject;
    single.disabled = count !== 1;
    if (count !== 1) single.checked = false;
  }

  #setBusy(form, busy, message = "") {
    for (const button of form.querySelectorAll("button")) button.disabled = busy;
    form.elements.count.disabled = busy;
    form.querySelector(".runyth-npc-button__status").textContent = message;
    if (!busy) this.#syncCountControls(form);
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
      if (options.openLastActor) actors.at(-1)?.sheet?.render(true);
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
      if (options.openLastActor) actors.at(-1)?.sheet?.render(true);
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

// Backwards-compatible public API name from v0.1.0.
export const openNpcDialog = openNpcDashboard;
