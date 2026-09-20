import { MODULE_ID, SETTINGS } from "./constants.mjs";
import { logger } from "./logger.mjs";

export const FILTER_CATEGORIES = Object.freeze({
  roles: { labelKey: "filters.categories.roles", placeholderKey: "filters.placeholders.roles" },
  races: { labelKey: "filters.categories.races", placeholderKey: "filters.placeholders.races" },
  namingStyles: { labelKey: "filters.categories.namingStyles", placeholderKey: "filters.placeholders.namingStyles" },
  habitats: { labelKey: "filters.categories.habitats", placeholderKey: "filters.placeholders.habitats" },
  groupTypes: { labelKey: "filters.categories.groupTypes", placeholderKey: "filters.placeholders.groupTypes" },
  folders: { labelKey: "filters.categories.folders", placeholderKey: "filters.placeholders.folders" }
});

const MATCH_FIELDS = ["id", "label", "display", "description", "searchText"];
const BaseFormApplication = globalThis.FormApplication ?? class {};

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

export function filterSummary(config) {
  const parts = [];
  for (const [label, key] of [["allow exact", "exactAllow"], ["deny exact", "exactDeny"], ["allow contains", "containsAllow"], ["deny contains", "containsDeny"], ["allow prefix", "prefixAllow"], ["deny prefix", "prefixDeny"], ["allow suffix", "suffixAllow"], ["deny suffix", "suffixDeny"], ["allow regex", "regexAllow"], ["deny regex", "regexDeny"]]) {
    if (String(config?.[key] ?? "").trim()) parts.push(label);
  }
  return parts.join(", ");
}

export class FilterSettingsForm extends BaseFormApplication {
  static get defaultOptions() {
    if (!globalThis.foundry?.utils?.mergeObject) return {};
    return foundry.utils.mergeObject(super.defaultOptions ?? {}, {
      id: "runyth-npc-button-filter-settings",
      title: game.i18n.localize(`${MODULE_ID}.filters.title`),
      classes: ["runyth-npc-button", "runyth-npc-button--filters"],
      width: 920,
      height: 800,
      resizable: true,
      closeOnSubmit: true
    });
  }

  getData() {
    const settings = loadFilterSettings();
    return {
      categories: Object.entries(FILTER_CATEGORIES).map(([id, meta]) => ({
        id,
        label: game.i18n.localize(`${MODULE_ID}.${meta.labelKey}`),
        placeholder: game.i18n.localize(`${MODULE_ID}.${meta.placeholderKey}`),
        value: settings[id]
      }))
    };
  }

  async _updateObject(_event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    const next = defaultFilterConfiguration();
    for (const category of Object.keys(FILTER_CATEGORIES)) {
      next[category] = { ...next[category], ...(expanded.filters?.[category] ?? {}) };
    }
    await saveFilterSettings(next);
    ui.notifications.info(game.i18n.localize(`${MODULE_ID}.notifications.filtersSaved`));
  }

  async _renderInner() {
    const { categories } = this.getData();
    const wrapper = document.createElement("form");
    wrapper.className = "runyth-npc-button__filters-form";
    wrapper.innerHTML = `
      <p class="notes">${game.i18n.localize(`${MODULE_ID}.filters.intro`)}</p>
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
    `;
    return wrapper;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on("submit", (event) => {
      event.preventDefault();
      const formData = new FormDataExtended(html[0]).object;
      void this._updateObject(event, formData).then(() => this.close());
    });
  }
}
