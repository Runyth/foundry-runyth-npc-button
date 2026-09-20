export async function writeClipboardText(text, { gameRef = globalThis.game, navigatorRef = globalThis.navigator } = {}) {
  const value = String(text ?? "");
  let primaryError = null;
  const foundryCopy = gameRef?.clipboard?.copyPlainText;
  if (typeof foundryCopy === "function") {
    try {
      await Promise.resolve(foundryCopy.call(gameRef.clipboard, value));
      return;
    } catch (error) {
      primaryError = error;
    }
  }

  const browserCopy = navigatorRef?.clipboard?.writeText;
  if (typeof browserCopy === "function") {
    try {
      await Promise.resolve(browserCopy.call(navigatorRef.clipboard, value));
      return;
    } catch (error) {
      if (!primaryError) primaryError = error;
    }
  }

  throw primaryError ?? new Error("Clipboard writing is not available in this client.");
}

export async function readClipboardText({ navigatorRef = globalThis.navigator } = {}) {
  const browserRead = navigatorRef?.clipboard?.readText;
  if (typeof browserRead !== "function") throw new Error("Clipboard reading is not available in this client.");
  return Promise.resolve(browserRead.call(navigatorRef.clipboard));
}
