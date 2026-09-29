import { MODULE_ID, SETTINGS } from "./constants.mjs";
import { getComplementaryCatalogModules } from "./extensions/registry.mjs";
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
    const colors = loadComplementaryModuleColors();
    const template = document.createElement("template");
    template.innerHTML = `
      <div class="runyth-npc-button__complementary-colors-form">
        <p class="notes">${escapeAttribute(localize("complementaryColors.intro", "Set a highlight color for entries contributed by complementary modules. Items from the same module share one color across pickers and filter lists."))}</p>
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
          : `<p>${escapeAttribute(localize("complementaryColors.empty", "No complementary module catalog entries are currently registered."))}</p>`}
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
