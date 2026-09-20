import { MODULE_ID } from "../constants.mjs";
import { normalizeNpcJsonPayload } from "../ai/npc-json.mjs";
import { escapeAttribute } from "../utils/html.mjs";

const BaseApplication = globalThis.foundry?.applications?.api?.ApplicationV2 ?? class {};

function localize(key) {
  return game.i18n.localize(`${MODULE_ID}.${key}`);
}

function deepClone(value) {
  if (globalThis.foundry?.utils?.deepClone) return foundry.utils.deepClone(value);
  if (globalThis.structuredClone) return globalThis.structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function rootEntries(payload) {
  return Array.isArray(payload) ? payload : [payload];
}

function numberValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function setNested(target, path, value) {
  let current = target;
  const parts = path.split(".");
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (!current[key] || typeof current[key] !== "object" || Array.isArray(current[key])) current[key] = {};
    current = current[key];
  }
  current[parts.at(-1)] = value;
}

function valueAt(target, path, fallback = "") {
  let current = target;
  for (const key of path.split(".")) {
    if (!current || typeof current !== "object") return fallback;
    current = current[key];
  }
  return current ?? fallback;
}

export function applyPreviewEdits(entry, edits = {}) {
  const next = deepClone(entry);
  const mappings = {
    name: "name",
    race: "system.details.type.subtype",
    cr: "system.details.cr",
    ac: "system.attributes.ac.flat",
    hp: "system.attributes.hp.value",
    hpMax: "system.attributes.hp.max",
    speed: "system.attributes.movement.walk",
    biography: "system.details.biography.value"
  };
  for (const [key, path] of Object.entries(mappings)) {
    if (!(key in edits)) continue;
    const value = ["cr", "ac", "hp", "hpMax", "speed"].includes(key)
      ? numberValue(edits[key], valueAt(next, path, 0))
      : String(edits[key] ?? "");
    setNested(next, path, value);
  }
  return next;
}

export function validatePreviewPayload(payload, validationOptions = {}) {
  return normalizeNpcJsonPayload(deepClone(payload), validationOptions);
}

function editorMarkup(entry, index, count) {
  return `
    <section class="runyth-npc-button__preview-editor" data-preview-editor>
      <div class="runyth-npc-button__section-heading">
        <div>
          <h2>${escapeAttribute(game.i18n.format(`${MODULE_ID}.preview.npcHeading`, { current: index + 1, count }))}</h2>
          <p>${escapeAttribute(localize("preview.editorHint"))}</p>
        </div>
      </div>
      <div class="runyth-npc-button__grid">
        <div class="runyth-npc-button__field">
          <label>${escapeAttribute(localize("preview.name"))}</label>
          <input type="text" name="previewName" maxlength="120" value="${escapeAttribute(valueAt(entry, "name", ""))}">
        </div>
        <div class="runyth-npc-button__field">
          <label>${escapeAttribute(localize("preview.race"))}</label>
          <input type="text" name="previewRace" maxlength="120" value="${escapeAttribute(valueAt(entry, "system.details.type.subtype", ""))}">
        </div>
      </div>
      <div class="runyth-npc-button__preview-numbers">
        <label><span>${escapeAttribute(localize("preview.cr"))}</span><input type="number" name="previewCr" min="0" max="30" step="0.125" value="${escapeAttribute(valueAt(entry, "system.details.cr", 0))}"></label>
        <label><span>${escapeAttribute(localize("preview.ac"))}</span><input type="number" name="previewAc" min="0" max="50" step="1" value="${escapeAttribute(valueAt(entry, "system.attributes.ac.flat", 10))}"></label>
        <label><span>${escapeAttribute(localize("preview.hp"))}</span><input type="number" name="previewHp" min="0" max="100000" step="1" value="${escapeAttribute(valueAt(entry, "system.attributes.hp.value", 1))}"></label>
        <label><span>${escapeAttribute(localize("preview.hpMax"))}</span><input type="number" name="previewHpMax" min="0" max="100000" step="1" value="${escapeAttribute(valueAt(entry, "system.attributes.hp.max", 1))}"></label>
        <label><span>${escapeAttribute(localize("preview.speed"))}</span><input type="number" name="previewSpeed" min="0" max="1000" step="5" value="${escapeAttribute(valueAt(entry, "system.attributes.movement.walk", 30))}"></label>
      </div>
      <div class="runyth-npc-button__field runyth-npc-button__field--full">
        <label>${escapeAttribute(localize("preview.biography"))}</label>
        <textarea name="previewBiography" rows="12" spellcheck="false">${escapeAttribute(valueAt(entry, "system.details.biography.value", ""))}</textarea>
        <small>${escapeAttribute(localize("preview.biographyHint"))}</small>
      </div>
    </section>
  `;
}

export class NpcImportPreviewApplication extends BaseApplication {
  static DEFAULT_OPTIONS = {
    id: "runyth-npc-button-import-preview",
    classes: ["runyth-npc-button", "runyth-npc-button--preview"],
    window: {
      title: `${MODULE_ID}.preview.title`,
      icon: "fa-solid fa-magnifying-glass",
      resizable: true,
      minimizable: true
    },
    position: {
      width: 980,
      height: 760
    }
  };

  #payload;
  #entries;
  #singleObject;
  #validationOptions;
  #selectedIndex = 0;
  #abortController = null;
  #resolver = null;
  #resolved = false;

  constructor(payload, validationOptions = {}, options = {}) {
    super(options);
    this.#singleObject = !Array.isArray(payload);
    this.#payload = deepClone(payload);
    this.#entries = rootEntries(this.#payload);
    this.#validationOptions = { ...validationOptions };
  }

  waitForResult() {
    return new Promise((resolve) => {
      this.#resolver = resolve;
    });
  }

  #current() {
    return this.#entries[this.#selectedIndex];
  }

  #saveCurrentEditor() {
    const form = this.element?.querySelector?.("form");
    if (!form) return;
    const current = this.#current();
    if (!current) return;
    const edited = applyPreviewEdits(current, {
      name: form.elements.previewName?.value ?? valueAt(current, "name", ""),
      race: form.elements.previewRace?.value ?? valueAt(current, "system.details.type.subtype", ""),
      cr: form.elements.previewCr?.value ?? valueAt(current, "system.details.cr", 0),
      ac: form.elements.previewAc?.value ?? valueAt(current, "system.attributes.ac.flat", 10),
      hp: form.elements.previewHp?.value ?? valueAt(current, "system.attributes.hp.value", 1),
      hpMax: form.elements.previewHpMax?.value ?? valueAt(current, "system.attributes.hp.max", 1),
      speed: form.elements.previewSpeed?.value ?? valueAt(current, "system.attributes.movement.walk", 30),
      biography: form.elements.previewBiography?.value ?? valueAt(current, "system.details.biography.value", "")
    });
    this.#entries[this.#selectedIndex] = edited;
    this.#payload = this.#singleObject ? this.#entries[0] : this.#entries;
  }

  async _renderHTML() {
    const current = this.#current();
    const list = this.#entries.map((entry, index) => `
      <button type="button" class="runyth-npc-button__preview-entry${index === this.#selectedIndex ? " active" : ""}" data-preview-index="${index}" aria-pressed="${index === this.#selectedIndex}">
        <span>${escapeAttribute(String(entry?.name ?? game.i18n.format(`${MODULE_ID}.preview.unnamedNpc`, { number: index + 1 })))}</span>
        <small>${escapeAttribute(String(valueAt(entry, "system.details.type.subtype", "")))}</small>
      </button>
    `).join("");
    const template = document.createElement("template");
    template.innerHTML = `
      <form class="runyth-npc-button__preview-layout">
        <aside class="runyth-npc-button__preview-list" aria-label="${escapeAttribute(localize("preview.npcList"))}">${list}</aside>
        <div class="runyth-npc-button__preview-main">
          ${editorMarkup(current, this.#selectedIndex, this.#entries.length)}
          <div class="runyth-npc-button__preview-status" role="status" aria-live="polite"></div>
          <footer class="runyth-npc-button__preview-footer">
            <button type="button" data-preview-action="cancel"><i class="fa-solid fa-xmark"></i>${escapeAttribute(localize("preview.cancel"))}</button>
            <button type="button" class="runyth-npc-button__primary" data-preview-action="confirm"><i class="fa-solid fa-file-import"></i>${escapeAttribute(localize("preview.confirm"))}</button>
          </footer>
        </div>
      </form>
    `;
    return template.content;
  }

  _replaceHTML(result, content) {
    content.replaceChildren(result);
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#abortController?.abort();
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;

    for (const button of this.element.querySelectorAll("[data-preview-index]")) {
      button.addEventListener("click", () => {
        this.#saveCurrentEditor();
        this.#selectedIndex = Number(button.dataset.previewIndex) || 0;
        void this.render({ force: true });
      }, { signal });
    }

    this.element.querySelector('[data-preview-action="cancel"]')?.addEventListener("click", () => {
      void this.#finish(null);
    }, { signal });

    const confirm = () => {
      this.#saveCurrentEditor();
      const status = this.element.querySelector(".runyth-npc-button__preview-status");
      try {
        validatePreviewPayload(this.#payload, this.#validationOptions);
        if (status) status.textContent = localize("preview.valid");
        void this.#finish(deepClone(this.#payload));
      } catch (error) {
        if (status) status.textContent = game.i18n.format(`${MODULE_ID}.preview.invalid`, { message: error?.message ?? String(error) });
      }
    };

    this.element.querySelector('[data-preview-action="confirm"]')?.addEventListener("click", confirm, { signal });
    this.element.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      confirm();
    }, { signal });
  }

  async #finish(value) {
    if (this.#resolved) return;
    this.#resolved = true;
    this.#resolver?.(value);
    await this.close();
  }

  async _preClose(options) {
    this.#abortController?.abort();
    if (!this.#resolved) {
      this.#resolved = true;
      this.#resolver?.(null);
    }
    await super._preClose(options);
  }
}

export async function openNpcImportPreview(payload, validationOptions = {}) {
  const app = new NpcImportPreviewApplication(payload, validationOptions);
  const resultPromise = app.waitForResult();
  await app.render({ force: true });
  return resultPromise;
}
