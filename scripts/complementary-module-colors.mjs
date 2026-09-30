import { MODULE_ID, SETTINGS } from "./constants.mjs";
import { getComplementaryCatalogModules, getUnattributedCatalogEntries } from "./extensions/registry.mjs";
import { escapeAttribute } from "./utils/html.mjs";

const BaseApplicationV2 = globalThis.foundry?.applications?.api?.ApplicationV2 ?? class {};
const DEFAULT_COLORS = Object.freeze([
  "#5b8cff",
  "#da7a1a",
  "#2f9d6a",
  "#8b5cf6",
  "#be3f6b",
  "#0f8a8a",
  "#d94633",
  "#2563eb",
  "#7c3aed",
  "#15803d"
]);

function localize(key, fallback = "") {
  const full = `${MODULE_ID}.${key}`;
  const localized = globalThis.game?.i18n?.localize?.(full);
  return localized && localized !== full ? localized : fallback;
}

function stableHash(text) {
  let hash = 2166136261;
  for (const char of String(text ?? "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeHexColor(value, fallback = "") {
  const text = String(value ?? "").trim();
  if (/^#[0-9a-f]{6}$/i.test(text)) return text.toLowerCase();
  return fallback;
}

export function defaultComplementaryModuleColor(moduleId) {
  if (!moduleId) return "#5b8cff";
  return DEFAULT_COLORS[stableHash(moduleId) % DEFAULT_COLORS.length];
}

export function parseComplementaryModuleColors(raw) {
  if (!raw) return {};
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const normalized = {};
    for (const [moduleId, color] of Object.entries(parsed)) {
      const key = String(moduleId ?? "").trim();
      if (!key) continue;
      const normalizedColor = normalizeHexColor(color);
      if (normalizedColor) normalized[key] = normalizedColor;
    }
    return normalized;
  } catch {
    return {};
  }
}

export function loadComplementaryModuleColors() {
  return parseComplementaryModuleColors(globalThis.game?.settings?.get?.(MODULE_ID, SETTINGS.COMPLEMENTARY_MODULE_COLORS));
}

export async function saveComplementaryModuleColors(colors) {
  await game.settings.set(MODULE_ID, SETTINGS.COMPLEMENTARY_MODULE_COLORS, JSON.stringify(parseComplementaryModuleColors(colors)));
}

export function resolveComplementaryModuleColor(moduleId, settings = loadComplementaryModuleColors()) {
  const key = String(moduleId ?? "").trim();
  if (!key) return "";
  return normalizeHexColor(settings[key], defaultComplementaryModuleColor(key));
}

function configuredModuleTitle(moduleId, fallback = "") {
  const module = globalThis.game?.modules?.get?.(moduleId);
  return String(module?.title ?? fallback ?? moduleId).trim() || moduleId;
}

function collectionValues(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value instanceof Set) return [...value];
  if (value instanceof Map) return [...value.values()];
  if (typeof value.values === "function") {
    try { return [...value.values()]; } catch { /* fall through */ }
  }
  if (typeof value[Symbol.iterator] === "function" && typeof value !== "string") {
    try { return [...value]; } catch { /* fall through */ }
  }
  if (typeof value === "object") return Object.values(value);
  return [];
}

function relationshipEntries(module) {
  const relationships = module?.relationships ?? module?.metadata?.relationships ?? module?.manifest?.relationships ?? {};
  return [
    ...collectionValues(relationships?.requires),
    ...collectionValues(relationships?.recommends)
  ];
}

function relationshipId(entry) {
  if (typeof entry === "string") return entry;
  return String(entry?.id ?? entry?.moduleId ?? entry?.module ?? "").trim();
}

export function getComplementaryDependencyCandidates() {
  return collectionValues(globalThis.game?.modules)
    .filter((module) => module?.id && module.id !== MODULE_ID)
    .filter((module) => relationshipEntries(module).some((entry) => relationshipId(entry) === MODULE_ID))
    .map((module) => ({
      moduleId: module.id,
      title: String(module.title ?? module.id),
      active: Boolean(module.active ?? module.enabled)
    }))
    .sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: "base" }));
}

function modulesForConfiguration() {
  const registered = getComplementaryCatalogModules();
  const colors = loadComplementaryModuleColors();
  const map = new Map();
  for (const entry of registered) map.set(entry.moduleId, { ...entry, source: "registry" });
  for (const moduleId of Object.keys(colors)) {
    if (map.has(moduleId)) continue;
    map.set(moduleId, {
      moduleId,
      title: configuredModuleTitle(moduleId, moduleId),
      counts: {},
      totalEntries: 0,
      source: "saved"
    });
  }
  return [...map.values()].sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: "base" }));
}

function unattributedSummary(entries) {
  const labels = {
    races: localize("complementaryColors.kinds.races", "Races"),
    roles: localize("complementaryColors.kinds.roles", "Roles"),
    namingStyles: localize("complementaryColors.kinds.namingStyles", "Naming styles"),
    habitats: localize("complementaryColors.kinds.habitats", "Habitats"),
    groupTypes: localize("complementaryColors.kinds.groupTypes", "Group types")
  };
  const counts = new Map();
  for (const entry of entries) counts.set(entry.kind, (counts.get(entry.kind) ?? 0) + 1);
  return [...counts.entries()].map(([kind, count]) => `${labels[kind] ?? kind}: ${count}`).join(" • ");
}

function contributionSummary(entry) {
  const labels = {
    races: localize("complementaryColors.kinds.races", "Races"),
    roles: localize("complementaryColors.kinds.roles", "Roles"),
    namingStyles: localize("complementaryColors.kinds.namingStyles", "Naming styles"),
    habitats: localize("complementaryColors.kinds.habitats", "Habitats"),
    groupTypes: localize("complementaryColors.kinds.groupTypes", "Group types")
  };
  const parts = Object.entries(entry?.counts ?? {})
    .filter(([, count]) => Number(count) > 0)
    .map(([kind, count]) => `${labels[kind] ?? kind}: ${count}`);
  if (!parts.length) return localize("complementaryColors.savedOnly", "Saved color only; no active contributions currently registered.");
  return parts.join(" • ");
}

function formStateFromDom(form) {
  const state = {};
  for (const input of form?.querySelectorAll?.("[data-complementary-module-color]") ?? []) {
    const moduleId = String(input.dataset.moduleId ?? "").trim();
    if (!moduleId) continue;
    const color = normalizeHexColor(input.value, defaultComplementaryModuleColor(moduleId));
    state[moduleId] = color;
  }
  return state;
}

function applyPreview(container, input) {
  if (!container || !input) return;
  container.style.setProperty("--rnb-module-color-preview", normalizeHexColor(input.value, defaultComplementaryModuleColor(input.dataset.moduleId)));
}

export class ComplementaryModuleColorsForm extends BaseApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "runyth-npc-button-complementary-module-colors",
    classes: ["runyth-npc-button", "runyth-npc-button--complementary-colors"],
    tag: "form",
    form: {
      closeOnSubmit: true,
      submitOnChange: false,
      handler: async function(_event, form) {
        await saveComplementaryModuleColors(formStateFromDom(form));
        ui.notifications.info(game.i18n.localize(`${MODULE_ID}.notifications.complementaryColorsSaved`));
      }
    },
    window: {
      title: `${MODULE_ID}.complementaryColors.title`,
      icon: "fa-solid fa-palette",
      resizable: true,
      minimizable: true
    },
    position: {
      width: 720,
      height: 640
    }
  };

  #abortController = null;

  async _renderHTML() {
    const modules = modulesForConfiguration();
    const registeredIds = new Set(modules.filter((entry) => entry.source === "registry").map((entry) => entry.moduleId));
    const unattributed = getUnattributedCatalogEntries();
    const dependencyCandidates = getComplementaryDependencyCandidates().filter((entry) => !registeredIds.has(entry.moduleId));
    const colors = loadComplementaryModuleColors();
    const template = document.createElement("template");
    template.innerHTML = `
      <div class="runyth-npc-button__complementary-colors-form">
        <p class="notes">${escapeAttribute(localize("complementaryColors.intro", "Set a highlight color for entries contributed by complementary modules. Items from the same module share one color across pickers and filter lists."))}</p>
        ${unattributed.length ? `
          <section class="runyth-npc-button__integration-status runyth-npc-button__integration-status--warning">
            <h2>${escapeAttribute(localize("complementaryColors.unattributedTitle", "Catalog extensions detected without source-module metadata"))}</h2>
            <p>${escapeAttribute(localize("complementaryColors.unattributedBody", "These entries are registered and usable, but NPC Button cannot color-group them because their registering module did not identify itself with sourceModuleId. This normally means the complementary module needs a compatibility patch."))}</p>
            <p><strong>${escapeAttribute(unattributedSummary(unattributed))}</strong></p>
          </section>` : ""}
        ${dependencyCandidates.length ? `
          <section class="runyth-npc-button__integration-status">
            <h2>${escapeAttribute(localize("complementaryColors.dependenciesTitle", "Detected complementary-module dependencies"))}</h2>
            <p>${escapeAttribute(localize("complementaryColors.dependenciesBody", "These installed modules declare Runyth NPC Button as a dependency or recommendation, but no color-attributed catalog entries from them are currently registered."))}</p>
            <ul>${dependencyCandidates.map((entry) => `<li><strong>${escapeAttribute(entry.title)}</strong> <code>${escapeAttribute(entry.moduleId)}</code> — ${escapeAttribute(entry.active ? localize("complementaryColors.statusEnabled", "enabled") : localize("complementaryColors.statusDisabled", "disabled"))}</li>`).join("")}</ul>
          </section>` : ""}
        ${modules.length
          ? `<div class="runyth-npc-button__complementary-colors-grid">
              ${modules.map((entry) => {
                const color = resolveComplementaryModuleColor(entry.moduleId, colors);
                return `
                  <section class="runyth-npc-button__complementary-colors-card" style="--rnb-module-color-preview:${escapeAttribute(color)};">
                    <div class="runyth-npc-button__complementary-colors-head">
                      <div>
                        <h2>${escapeAttribute(entry.title)}</h2>
                        <p class="runyth-npc-button__complementary-colors-id">${escapeAttribute(entry.moduleId)}</p>
                      </div>
                      <span class="runyth-npc-button__complementary-colors-swatch" aria-hidden="true"></span>
                    </div>
                    <p class="runyth-npc-button__complementary-colors-summary">${escapeAttribute(contributionSummary(entry))}</p>
                    <div class="runyth-npc-button__complementary-colors-controls">
                      <label>
                        <span>${escapeAttribute(localize("complementaryColors.colorLabel", "Highlight color"))}</span>
                        <input type="color" name="complementaryModuleColors.${escapeAttribute(entry.moduleId)}" value="${escapeAttribute(color)}" data-complementary-module-color data-module-id="${escapeAttribute(entry.moduleId)}">
                      </label>
                      <button type="button" data-reset-module-color="${escapeAttribute(entry.moduleId)}">${escapeAttribute(localize("complementaryColors.resetOne", "Reset"))}</button>
                    </div>
                  </section>
                `;
              }).join("")}
            </div>`
          : (!unattributed.length && !dependencyCandidates.length
            ? `<section class="runyth-npc-button__integration-status"><h2>${escapeAttribute(localize("complementaryColors.emptyTitle", "No complementary catalog integration detected"))}</h2><p>${escapeAttribute(localize("complementaryColors.empty", "Installing or enabling a complementary module alone is not enough for color grouping. It must register catalog entries through the NPC Button extension API and identify their source module."))}</p></section>`
            : "")}
        <footer class="sheet-footer flexrow">
          <button type="button" data-action="reset-all-module-colors"><i class="fa-solid fa-rotate-left"></i> ${escapeAttribute(localize("complementaryColors.resetAll", "Reset all to defaults"))}</button>
          <button type="submit"><i class="fa-solid fa-floppy-disk"></i> ${escapeAttribute(globalThis.game?.i18n?.localize?.("SETTINGS.Save") ?? "Save")}</button>
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

    form.querySelector('[data-action="reset-all-module-colors"]')?.addEventListener("click", () => {
      for (const input of form.querySelectorAll("[data-complementary-module-color]")) {
        input.value = defaultComplementaryModuleColor(input.dataset.moduleId);
        applyPreview(input.closest(".runyth-npc-button__complementary-colors-card"), input);
      }
    }, { signal });

    for (const input of form.querySelectorAll("[data-complementary-module-color]")) {
      const card = input.closest(".runyth-npc-button__complementary-colors-card");
      applyPreview(card, input);
      input.addEventListener("input", () => applyPreview(card, input), { signal });
    }

    for (const button of form.querySelectorAll("[data-reset-module-color]")) {
      button.addEventListener("click", () => {
        const moduleId = button.dataset.resetModuleColor;
        const input = form.querySelector(`[data-complementary-module-color][data-module-id="${CSS.escape(moduleId)}"]`);
        if (!input) return;
        input.value = defaultComplementaryModuleColor(moduleId);
        applyPreview(input.closest(".runyth-npc-button__complementary-colors-card"), input);
      }, { signal });
    }
  }
}
