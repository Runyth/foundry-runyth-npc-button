import { MODULE_ID } from "../constants.mjs";
import { logger } from "../logger.mjs";
import { tryWriteClipboardText } from "../utils/clipboard.mjs";
import { escapeAttribute } from "../utils/html.mjs";

const BaseApplication = globalThis.foundry?.applications?.api?.ApplicationV2 ?? class {};

function localize(key) {
  return game.i18n.localize(`${MODULE_ID}.${key}`);
}

export class ManualCopyApplication extends BaseApplication {
  static DEFAULT_OPTIONS = {
    id: "runyth-npc-button-manual-copy",
    classes: ["runyth-npc-button", "runyth-npc-button--manual-copy"],
    window: {
      title: `${MODULE_ID}.manualCopy.title`,
      icon: "fa-regular fa-copy",
      resizable: true,
      minimizable: true
    },
    position: { width: 720, height: 520 }
  };

  #text;
  #label;
  #abortController = null;

  constructor(text, { label = "" } = {}, options = {}) {
    super(options);
    this.#text = String(text ?? "");
    this.#label = String(label || localize("manualCopy.content"));
  }

  async _renderHTML() {
    const template = document.createElement("template");
    template.innerHTML = `
      <section class="runyth-npc-button__manual-copy">
        <p>${escapeAttribute(localize("manualCopy.hint"))}</p>
        <label>
          <span>${escapeAttribute(this.#label)}</span>
          <textarea data-manual-copy-text rows="16" readonly spellcheck="false">${escapeAttribute(this.#text)}</textarea>
        </label>
        <div class="runyth-npc-button__manual-copy-status" role="status" aria-live="polite"></div>
        <footer class="runyth-npc-button__preview-footer">
          <button type="button" data-manual-copy-action="select"><i class="fa-solid fa-i-cursor"></i>${escapeAttribute(localize("manualCopy.select"))}</button>
          <button type="button" class="runyth-npc-button__primary" data-manual-copy-action="copy"><i class="fa-regular fa-copy"></i>${escapeAttribute(localize("manualCopy.retry"))}</button>
        </footer>
      </section>
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
    const textarea = this.element.querySelector("[data-manual-copy-text]");
    const status = this.element.querySelector(".runyth-npc-button__manual-copy-status");

    const selectText = () => {
      textarea?.focus?.();
      textarea?.select?.();
      if (status) status.textContent = localize("manualCopy.selected");
    };

    this.element.querySelector('[data-manual-copy-action="select"]')?.addEventListener("click", selectText, { signal });
    this.element.querySelector('[data-manual-copy-action="copy"]')?.addEventListener("click", () => {
      void tryWriteClipboardText(this.#text).then((result) => {
        if (result.ok) {
          if (status) status.textContent = localize("manualCopy.copied");
          return;
        }
        logger.warn("Clipboard write failed; manual copy remains available.", result.error);
        selectText();
        if (status) status.textContent = localize("manualCopy.unavailable");
      });
    }, { signal });
  }

  async _preClose(options) {
    this.#abortController?.abort();
    await super._preClose?.(options);
  }
}

export async function openManualCopy(text, options = {}) {
  const app = new ManualCopyApplication(text, options);
  await app.render({ force: true });
  return app;
}
