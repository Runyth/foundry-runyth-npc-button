import { buildPortraitPromptFromActor } from "../ai/portrait-prompt-builder.mjs";
import { MODULE_ID } from "../constants.mjs";
import { writeClipboardText } from "../utils/clipboard.mjs";

function localize(key) {
  return game.i18n.localize(`${MODULE_ID}.${key}`);
}

export function supportsPortraitPrompt(actor) {
  const flags = actor?.flags?.[MODULE_ID] ?? {};
  return Boolean(flags.generated || flags.aiImported);
}

function actorFromApplication(app) {
  return app?.actor ?? app?.document ?? app?.object ?? null;
}

function headerElement(app, element) {
  const HTMLElementClass = globalThis.HTMLElement;
  if (HTMLElementClass && app?.window?.header instanceof HTMLElementClass) return app.window.header;
  if (app?.element?.querySelector) {
    const found = app.element.querySelector(".window-header");
    if (found) return found;
  }
  if (element?.querySelector) {
    const found = element.querySelector(".window-header");
    if (found) return found;
  }
  return null;
}

function closeButton(app, header) {
  const HTMLElementClass = globalThis.HTMLElement;
  if (HTMLElementClass && app?.window?.close instanceof HTMLElementClass) return app.window.close;
  return header?.querySelector?.('[data-action="close"], .header-control.close, button.close') ?? null;
}

export async function copyPortraitPrompt(actor) {
  if (!supportsPortraitPrompt(actor)) throw new Error(localize("errors.portraitPromptUnavailable"));
  await writeClipboardText(buildPortraitPromptFromActor(actor));
}

/**
 * Inject a visible portrait-prompt control into both ApplicationV2 and legacy
 * Actor sheet frames. The operation is idempotent so generic + type-specific
 * render hooks can safely call it during the same render cycle.
 */
export function injectPortraitPromptButton(app, element = null) {
  const actor = actorFromApplication(app);
  if (!supportsPortraitPrompt(actor)) return false;
  const header = headerElement(app, element);
  if (!header || header.querySelector(`[data-${MODULE_ID}-portrait-prompt]`)) return false;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "runyth-npc-button__portrait-prompt-control";
  button.setAttribute(`data-${MODULE_ID}-portrait-prompt`, "true");
  button.title = localize("ui.copyPortraitPrompt");
  button.setAttribute("aria-label", localize("ui.copyPortraitPrompt"));
  button.innerHTML = `<i class="fa-regular fa-image" aria-hidden="true"></i><span>${localize("ui.portraitPromptShort")}</span>`;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void copyPortraitPrompt(actor)
      .then(() => ui.notifications.info(localize("notifications.portraitPromptCopied")))
      .catch((error) => ui.notifications.error(game.i18n.format(`${MODULE_ID}.notifications.failed`, { message: error?.message ?? String(error) })));
  });

  const close = closeButton(app, header);
  if (close?.parentElement === header) close.before(button);
  else header.append(button);
  return true;
}

export function registerPortraitPromptHooks(hooks = globalThis.Hooks) {
  if (!hooks?.on) return false;
  hooks.on("renderActorSheetV2", (app, element) => {
    injectPortraitPromptButton(app, element);
  });
  hooks.on("renderApplicationV2", (app, element) => {
    injectPortraitPromptButton(app, element);
  });
  hooks.on("renderActorSheet", (app) => {
    injectPortraitPromptButton(app);
  });
  return true;
}
