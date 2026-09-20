import { buildPortraitPromptFromActor } from "../ai/portrait-prompt-builder.mjs";
import { MODULE_ID } from "../constants.mjs";

function localize(key) {
  return game.i18n.localize(`${MODULE_ID}.${key}`);
}

async function copyPlainText(text) {
  if (game.clipboard?.copyPlainText) {
    await game.clipboard.copyPlainText(text);
    return;
  }
  if (!navigator.clipboard?.writeText) throw new Error(localize("errors.clipboardWrite"));
  await navigator.clipboard.writeText(text);
}

function supportsPortraitPrompt(actor) {
  const flags = actor?.flags?.[MODULE_ID] ?? {};
  return Boolean(flags.generated || flags.aiImported);
}

export function injectPortraitPromptButton(app) {
  const actor = app?.actor ?? app?.object;
  if (!supportsPortraitPrompt(actor)) return;
  const header = app.window?.header;
  if (!header || header.querySelector(`[data-${MODULE_ID}-portrait-prompt]`)) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "runyth-npc-button__header-help";
  button.setAttribute(`data-${MODULE_ID}-portrait-prompt`, "true");
  button.title = localize("ui.copyPortraitPrompt");
  button.setAttribute("aria-label", localize("ui.copyPortraitPrompt"));
  button.innerHTML = '<i class="fa-regular fa-image" aria-hidden="true"></i>';
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const prompt = buildPortraitPromptFromActor(actor);
    void copyPlainText(prompt)
      .then(() => ui.notifications.info(localize("notifications.portraitPromptCopied")))
      .catch((error) => ui.notifications.error(`${localize("notifications.failed")}: ${error?.message ?? String(error)}`));
  });
  app.window.close.before(button);
}
