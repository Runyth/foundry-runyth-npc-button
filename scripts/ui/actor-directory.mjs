import { MODULE_ID } from "../constants.mjs";
import { logger } from "../logger.mjs";
import { htmlElement } from "../utils/html.mjs";
import { openNpcDashboard } from "./npc-dashboard.mjs";

const BUTTON_SELECTOR = `[data-${MODULE_ID}-action="open"]`;

function directoryRoot(app, html) {
  return htmlElement(html) ?? htmlElement(app?.element);
}

export function injectActorDirectoryButton(app, html) {
  if (!game.user?.isGM || game.system?.id !== "dnd5e") return;

  const root = directoryRoot(app, html);
  if (!root || root.querySelector(BUTTON_SELECTOR)) return;

  const header = root.querySelector(".directory-header");
  if (!header) {
    logger.debug("Actor directory header was not available during render.");
    return;
  }

  const actionArea = header.querySelector(".header-actions, .action-buttons, .controls") ?? header;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "runyth-npc-button__directory-button";
  button.setAttribute(`data-${MODULE_ID}-action`, "open");
  button.innerHTML = `<i class="fa-solid fa-user-plus" aria-hidden="true"></i><span>${game.i18n.localize(`${MODULE_ID}.ui.sidebarButton`)}</span>`;
  button.addEventListener("click", () => {
    void openNpcDashboard();
  });

  actionArea.append(button);
}
