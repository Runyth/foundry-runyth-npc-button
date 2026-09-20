import { MODULE_ID, SETTINGS } from "./constants.mjs";

function debugEnabled() {
  try {
    return game.settings.get(MODULE_ID, SETTINGS.DEBUG) === true;
  } catch {
    return false;
  }
}

export const logger = Object.freeze({
  debug(message, data) {
    if (!debugEnabled()) return;
    if (data === undefined) console.debug(`${MODULE_ID} | ${message}`);
    else console.debug(`${MODULE_ID} | ${message}`, data);
  },

  warn(message, data) {
    if (data === undefined) console.warn(`${MODULE_ID} | ${message}`);
    else console.warn(`${MODULE_ID} | ${message}`, data);
  },

  error(message, error) {
    console.error(`${MODULE_ID} | ${message}`, error);
  }
});
