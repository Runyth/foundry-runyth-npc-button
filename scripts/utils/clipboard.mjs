function unavailableError() {
  return new Error("Clipboard writing is not available in this client.");
}

/**
 * Best-effort clipboard write. Clipboard permission/focus failures are returned
 * as data instead of being thrown so callers can keep already-prepared content
 * available and continue unrelated workflows.
 */
export async function tryWriteClipboardText(text, { gameRef = globalThis.game, navigatorRef = globalThis.navigator } = {}) {
  const value = String(text ?? "");
  const errors = [];
  const foundryCopy = gameRef?.clipboard?.copyPlainText;
  if (typeof foundryCopy === "function") {
    try {
      await Promise.resolve(foundryCopy.call(gameRef.clipboard, value));
      return { ok: true, method: "foundry", error: null };
    } catch (error) {
      errors.push(error);
    }
  }

  const browserCopy = navigatorRef?.clipboard?.writeText;
  if (typeof browserCopy === "function") {
    try {
      await Promise.resolve(browserCopy.call(navigatorRef.clipboard, value));
      return { ok: true, method: "browser", error: null };
    } catch (error) {
      errors.push(error);
    }
  }

  return { ok: false, method: null, error: errors.at(-1) ?? errors[0] ?? unavailableError() };
}

/**
 * Throwing compatibility wrapper for callers that explicitly require a copy.
 * UI convenience actions should normally use tryWriteClipboardText instead.
 */
export async function writeClipboardText(text, options = {}) {
  const result = await tryWriteClipboardText(text, options);
  if (!result.ok) throw result.error;
  return result;
}

export async function readClipboardText({ navigatorRef = globalThis.navigator } = {}) {
  const browserRead = navigatorRef?.clipboard?.readText;
  if (typeof browserRead !== "function") throw new Error("Clipboard reading is not available in this client.");
  return Promise.resolve(browserRead.call(navigatorRef.clipboard));
}
