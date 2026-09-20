import { MODULE_ID, SETTINGS } from "./constants.mjs";
import { logger } from "./logger.mjs";
import { readClipboardText, writeClipboardText } from "./utils/clipboard.mjs";

export const FILTER_CATEGORIES = Object.freeze({
  roles: { labelKey: "filters.categories.roles", placeholderKey: "filters.placeholders.roles" },
  races: { labelKey: "filters.categories.races", placeholderKey: "filters.placeholders.races" },
  namingStyles: { labelKey: "filters.categories.namingStyles", placeholderKey: "filters.placeholders.namingStyles" },
  habitats: { labelKey: "filters.categories.habitats", placeholderKey: "filters.placeholders.habitats" },
  groupTypes: { labelKey: "filters.categories.groupTypes", placeholderKey: "filters.placeholders.groupTypes" },
  folders: { labelKey: "filters.categories.folders", placeholderKey: "filters.placeholders.folders" }
});

const MATCH_FIELDS = ["id", "label", "display", "description", "searchText"];
const BaseApplicationV2 = globalThis.foundry?.applications?.api?.ApplicationV2 ?? class {};

export function defaultFilterConfiguration() {
  return Object.fromEntries(Object.keys(FILTER_CATEGORIES).map((key) => [key, {
    exactAllow: "",
    exactDeny: "",
    containsAllow: "",
    containsDeny: "",
    prefixAllow: "",
    prefixDeny: "",
    suffixAllow: "",
    suffixDeny: "",
    regexAllow: "",
    regexDeny: "",
    caseSensitive: false,
    normalizeDiacritics: true,
    trimWhitespace: true
  }]));
}

function normalizeText(value, settings) {
  let text = String(value ?? "");
  if (settings.trimWhitespace !== false) text = text.trim();
  if (settings.normalizeDiacritics !== false) text = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  if (!settings.caseSensitive) text = text.toLocaleLowerCase();
  return text;
}

function splitPatterns(value) {
  return String(value ?? "")
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function compileRegexList(value, settings) {
  const flags = settings.caseSensitive ? "u" : "iu";
  const regexes = [];
  for (const source of splitPatterns(value)) {
    try {
      regexes.push(new RegExp(source, flags));
    } catch (error) {
      logger.debug("Ignoring invalid filter regex", { source, error: error?.message ?? String(error) });
    }
  }
  return regexes;
}

function candidateTexts(item, settings) {
  return MATCH_FIELDS
    .map((field) => normalizeText(item?.[field] ?? "", settings))
    .filter(Boolean);
}

function anyMatch(patterns, texts, predicate) {
  return patterns.some((pattern) => texts.some((text) => predicate(pattern, text)));
}

function allowMatched(config, texts) {
  const exactAllow = splitPatterns(config.exactAllow).map((entry) => normalizeText(entry, config));
  const containsAllow = splitPatterns(config.containsAllow).map((entry) => normalizeText(entry, config));
  const prefixAllow = splitPatterns(config.prefixAllow).map((entry) => normalizeText(entry, config));
  const suffixAllow = splitPatterns(config.suffixAllow).map((entry) => normalizeText(entry, config));
  const regexAllow = compileRegexList(config.regexAllow, config);
  const hasAllow = exactAllow.length || containsAllow.length || prefixAllow.length || suffixAllow.length || regexAllow.length;
  if (!hasAllow) return true;
  return anyMatch(exactAllow, texts, (pattern, text) => text === pattern)
    || anyMatch(containsAllow, texts, (pattern, text) => text.includes(pattern))
    || anyMatch(prefixAllow, texts, (pattern, text) => text.startsWith(pattern))
    || anyMatch(suffixAllow, texts, (pattern, text) => text.endsWith(pattern))
    || regexAllow.some((regex) => texts.some((text) => regex.test(text)));
}

function denyMatched(config, texts) {
  const exactDeny = splitPatterns(config.exactDeny).map((entry) => normalizeText(entry, config));
  const containsDeny = splitPatterns(config.containsDeny).map((entry) => normalizeText(entry, config));
  const prefixDeny = splitPatterns(config.prefixDeny).map((entry) => normalizeText(entry, config));
  const suffixDeny = splitPatterns(config.suffixDeny).map((entry) => normalizeText(entry, config));
  const regexDeny = compileRegexList(config.regexDeny, config);
  return anyMatch(exactDeny, texts, (pattern, text) => text === pattern)
    || anyMatch(containsDeny, texts, (pattern, text) => text.includes(pattern))
    || anyMatch(prefixDeny, texts, (pattern, text) => text.startsWith(pattern))
    || anyMatch(suffixDeny, texts, (pattern, text) => text.endsWith(pattern))
    || regexDeny.some((regex) => texts.some((text) => regex.test(text)));
}

export function parseFilterSettings(raw) {
  const defaults = defaultFilterConfiguration();
  if (!raw) return defaults;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return defaults;
    const merged = defaultFilterConfiguration();
    for (const key of Object.keys(FILTER_CATEGORIES)) {
      if (parsed[key] && typeof parsed[key] === "object") merged[key] = { ...merged[key], ...parsed[key] };
    }
    return merged;
  } catch {
    return defaults;
  }
}

export function loadFilterSettings() {
  return parseFilterSettings(game.settings.get(MODULE_ID, SETTINGS.FILTERS));
}

export async function saveFilterSettings(settings) {
  await game.settings.set(MODULE_ID, SETTINGS.FILTERS, JSON.stringify(parseFilterSettings(settings)));
}

export function applyStringFilters(category, items = [], settings = loadFilterSettings()) {
  const config = settings?.[category] ?? defaultFilterConfiguration()[category];
  const visible = [];
  let pendingGroup = null;
  let groupHasEntries = false;

  function flushGroup() {
    if (pendingGroup && groupHasEntries) visible.push(pendingGroup);
    pendingGroup = null;
    groupHasEntries = false;
  }

  for (const item of items) {
    if (item?.kind === "group") {
      flushGroup();
      pendingGroup = item;
      continue;
    }
    if (String(item?.id ?? "").startsWith("@")) {
      if (pendingGroup && !groupHasEntries) {
        visible.push(pendingGroup);
        pendingGroup = null;
      }
      visible.push(item);
      continue;
    }
    const texts = candidateTexts(item, config);
    const matched = allowMatched(config, texts) && !denyMatched(config, texts);
    if (!matched) continue;
    if (pendingGroup && !groupHasEntries) {
      visible.push(pendingGroup);
      pendingGroup = null;
    }
    groupHasEntries = true;
    visible.push(item);
  }

  flushGroup();
  return visible;
}


export const FILTER_PROFILE_FORMAT = "runyth-npc-button-filter-profile";
export const FILTER_PROFILE_VERSION = 1;

export function buildFilterProfile(settings = loadFilterSettings()) {
  return {
    format: FILTER_PROFILE_FORMAT,
    version: FILTER_PROFILE_VERSION,
    filters: parseFilterSettings(settings)
  };
}

export function parseFilterProfile(raw) {
  if (typeof raw === "string" && raw.length > 1_000_000) throw new Error("Filter profile is too large.");
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Filter profile must be a JSON object.");
  if (parsed.format !== FILTER_PROFILE_FORMAT) throw new Error("This is not a Runyth NPC Button filter profile.");
  if (Number(parsed.version) !== FILTER_PROFILE_VERSION) throw new Error(`Unsupported filter profile version: ${parsed.version}.`);
  if (!parsed.filters || typeof parsed.filters !== "object" || Array.isArray(parsed.filters)) throw new Error("Filter profile is missing its filters object.");
  return parseFilterSettings(parsed.filters);
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function filterSummary(config) {
  const parts = [];
  for (const [label, key] of [["allow exact", "exactAllow"], ["deny exact", "exactDeny"], ["allow contains", "containsAllow"], ["deny contains", "containsDeny"], ["allow prefix", "prefixAllow"], ["deny prefix", "prefixDeny"], ["allow suffix", "suffixAllow"], ["deny suffix", "suffixDeny"], ["allow regex", "regexAllow"], ["deny regex", "regexDeny"]]) {
    if (String(config?.[key] ?? "").trim()) parts.push(label);
  }
  return parts.join(", ");
}

export function settingsFromForm(form) {
  const next = defaultFilterConfiguration();
  const stringKeys = ["exactAllow", "exactDeny", "containsAllow", "containsDeny", "prefixAllow", "prefixDeny", "suffixAllow", "suffixDeny", "regexAllow", "regexDeny"];
  for (const category of Object.keys(FILTER_CATEGORIES)) {
    for (const key of stringKeys) {
      const control = form?.querySelector?.(`[name="filters.${category}.${key}"]`);
      next[category][key] = String(control?.value ?? "");
    }
    for (const key of ["caseSensitive", "normalizeDiacritics", "trimWhitespace"]) {
      const control = form?.querySelector?.(`[name="filters.${category}.${key}"]`);
      next[category][key] = Boolean(control?.checked);
    }
  }
  return next;
}

export class FilterSettingsForm extends BaseApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "runyth-npc-button-filter-settings",
    classes: ["runyth-npc-button", "runyth-npc-button--filters"],
    tag: "form",
    form: {
      closeOnSubmit: true,
      submitOnChange: false,
      handler: async function(_event, form) {
        await saveFilterSettings(settingsFromForm(form));
        ui.notifications.info(game.i18n.localize(`${MODULE_ID}.notifications.filtersSaved`));
      }
    },
    window: {
      title: `${MODULE_ID}.filters.title`,
      icon: "fa-solid fa-filter",
      resizable: true,
      minimizable: true
    },
    position: {
      width: 920,
      height: 800
    }
  };

  #abortController = null;

  async _renderHTML() {
    const settings = loadFilterSettings();
    const categories = Object.entries(FILTER_CATEGORIES).map(([id, meta]) => ({
      id,
      label: game.i18n.localize(`${MODULE_ID}.${meta.labelKey}`),
      placeholder: game.i18n.localize(`${MODULE_ID}.${meta.placeholderKey}`),
      value: settings[id]
    }));
    const template = document.createElement("template");
    template.innerHTML = `
      <div class="runyth-npc-button__filters-form">
        <p class="notes">${game.i18n.localize(`${MODULE_ID}.filters.intro`)}</p>
        <div class="runyth-npc-button__filter-profile-toolbar">
          <button type="button" data-action="export-filter-file"><i class="fa-solid fa-file-export"></i> ${game.i18n.localize(`${MODULE_ID}.filters.actions.exportFile`)}</button>
          <button type="button" data-action="copy-filter-json"><i class="fa-regular fa-copy"></i> ${game.i18n.localize(`${MODULE_ID}.filters.actions.copyJson`)}</button>
          <button type="button" data-action="import-filter-file"><i class="fa-solid fa-file-import"></i> ${game.i18n.localize(`${MODULE_ID}.filters.actions.importFile`)}</button>
          <button type="button" data-action="import-filter-clipboard"><i class="fa-solid fa-clipboard"></i> ${game.i18n.localize(`${MODULE_ID}.filters.actions.importClipboard`)}</button>
          <input type="file" accept="application/json,.json" data-filter-profile-file hidden>
        </div>
        ${categories.map((category) => `
          <fieldset class="runyth-npc-button__filters-fieldset">
            <legend>${category.label}</legend>
            <p class="notes">${category.placeholder}</p>
            <div class="runyth-npc-button__filters-grid">
              ${["exactAllow","exactDeny","containsAllow","containsDeny","prefixAllow","prefixDeny","suffixAllow","suffixDeny","regexAllow","regexDeny"].map((key) => `
                <label>
                  <span>${game.i18n.localize(`${MODULE_ID}.filters.fields.${key}`)}</span>
                  <textarea name="filters.${category.id}.${key}" rows="2">${foundry.utils.escapeHTML(String(category.value[key] ?? ""))}</textarea>
                </label>
              `).join("")}
            </div>
            <div class="form-group">
              <label><input type="checkbox" name="filters.${category.id}.caseSensitive" ${category.value.caseSensitive ? "checked" : ""}> ${game.i18n.localize(`${MODULE_ID}.filters.fields.caseSensitive`)}</label>
              <label><input type="checkbox" name="filters.${category.id}.normalizeDiacritics" ${category.value.normalizeDiacritics ? "checked" : ""}> ${game.i18n.localize(`${MODULE_ID}.filters.fields.normalizeDiacritics`)}</label>
              <label><input type="checkbox" name="filters.${category.id}.trimWhitespace" ${category.value.trimWhitespace ? "checked" : ""}> ${game.i18n.localize(`${MODULE_ID}.filters.fields.trimWhitespace`)}</label>
            </div>
          </fieldset>
        `).join("")}
        <footer class="sheet-footer flexrow">
          <button type="submit"><i class="fa-solid fa-floppy-disk"></i> ${game.i18n.localize("SETTINGS.Save")}</button>
        </footer>
      </div>
    `;
    return template.content;
  }

  _replaceHTML(result, content) {
    content.replaceChildren(result);
  }

  async _onRender(context, options) {
    await super._onRender?.(context, options);
    this.#abortController?.abort();
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;
    const form = this.form ?? (this.element?.tagName === "FORM" ? this.element : null);
    if (!form) return;

    form.querySelector('[data-action="export-filter-file"]')?.addEventListener("click", () => {
      const profile = JSON.stringify(buildFilterProfile(settingsFromForm(form)), null, 2);
      downloadTextFile("runyth-npc-button-filters.json", `${profile}\n`);
      ui.notifications.info(game.i18n.localize(`${MODULE_ID}.notifications.filtersExported`));
    }, { signal });

    form.querySelector('[data-action="copy-filter-json"]')?.addEventListener("click", () => {
      const profile = `${JSON.stringify(buildFilterProfile(settingsFromForm(form)), null, 2)}\n`;
      void writeClipboardText(profile)
        .then(() => ui.notifications.info(game.i18n.localize(`${MODULE_ID}.notifications.filtersCopied`)))
        .catch((error) => ui.notifications.error(error?.message ?? String(error)));
    }, { signal });

    const fileInput = form.querySelector("[data-filter-profile-file]");
    form.querySelector('[data-action="import-filter-file"]')?.addEventListener("click", () => fileInput?.click(), { signal });
    fileInput?.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (file.size > 1_000_000) {
        ui.notifications.error(game.i18n.localize(`${MODULE_ID}.notifications.filterProfileTooLarge`));
        fileInput.value = "";
        return;
      }
      void file.text()
        .then((raw) => parseFilterProfile(raw))
        .then((settings) => saveFilterSettings(settings))
        .then(() => {
          ui.notifications.info(game.i18n.localize(`${MODULE_ID}.notifications.filtersImported`));
          return this.render({ force: true });
        })
        .catch((error) => ui.notifications.error(`${game.i18n.localize(`${MODULE_ID}.notifications.filterImportFailed`)}: ${error?.message ?? String(error)}`))
        .finally(() => { fileInput.value = ""; });
    }, { signal });

    form.querySelector('[data-action="import-filter-clipboard"]')?.addEventListener("click", () => {
      void readClipboardText()
        .then((raw) => parseFilterProfile(raw))
        .then((settings) => saveFilterSettings(settings))
        .then(() => {
          ui.notifications.info(game.i18n.localize(`${MODULE_ID}.notifications.filtersImported`));
          return this.render({ force: true });
        })
        .catch((error) => ui.notifications.error(`${game.i18n.localize(`${MODULE_ID}.notifications.filterImportFailed`)}: ${error?.message ?? String(error)}`));
    }, { signal });
  }

  async _preClose(options) {
    this.#abortController?.abort();
    await super._preClose?.(options);
  }
}
