import { MODULE_ID } from "./constants.mjs";

export const TOKEN_DISPOSITION_MODES = Object.freeze({
  default: {
    label: "Foundry default",
    labelKey: "tokenDispositions.default"
  },
  friendly: {
    label: "Friendly",
    labelKey: "tokenDispositions.friendly"
  },
  neutral: {
    label: "Neutral",
    labelKey: "tokenDispositions.neutral"
  },
  hostile: {
    label: "Hostile (Enemy)",
    labelKey: "tokenDispositions.hostile"
  },
  secret: {
    label: "Secret",
    labelKey: "tokenDispositions.secret"
  }
});

const FALLBACK_DISPOSITIONS = Object.freeze({
  FRIENDLY: 1,
  NEUTRAL: 0,
  HOSTILE: -1,
  SECRET: -2
});

function nativeDispositions() {
  const source = globalThis.CONST?.TOKEN_DISPOSITIONS;
  if (!source || typeof source !== "object") return FALLBACK_DISPOSITIONS;
  return {
    FRIENDLY: Number.isFinite(Number(source.FRIENDLY)) ? Number(source.FRIENDLY) : FALLBACK_DISPOSITIONS.FRIENDLY,
    NEUTRAL: Number.isFinite(Number(source.NEUTRAL)) ? Number(source.NEUTRAL) : FALLBACK_DISPOSITIONS.NEUTRAL,
    HOSTILE: Number.isFinite(Number(source.HOSTILE)) ? Number(source.HOSTILE) : FALLBACK_DISPOSITIONS.HOSTILE,
    SECRET: Number.isFinite(Number(source.SECRET)) ? Number(source.SECRET) : FALLBACK_DISPOSITIONS.SECRET
  };
}

export function resolveTokenDisposition(mode) {
  const values = nativeDispositions();
  switch (String(mode ?? "default")) {
    case "friendly": return values.FRIENDLY;
    case "neutral": return values.NEUTRAL;
    case "hostile": return values.HOSTILE;
    case "secret": return values.SECRET;
    default: return null;
  }
}

export function applyTokenDispositionToActorSource(source, mode) {
  const value = resolveTokenDisposition(mode);
  if (value === null) return source;
  const flags = source?.flags && typeof source.flags === "object" ? source.flags : {};
  const moduleFlags = flags[MODULE_ID] && typeof flags[MODULE_ID] === "object" ? flags[MODULE_ID] : {};
  return {
    ...source,
    prototypeToken: {
      ...(source?.prototypeToken && typeof source.prototypeToken === "object" ? source.prototypeToken : {}),
      disposition: value
    },
    flags: {
      ...flags,
      [MODULE_ID]: {
        ...moduleFlags,
        tokenDisposition: String(mode)
      }
    }
  };
}
