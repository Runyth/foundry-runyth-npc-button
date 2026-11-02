// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
const TEMPLATE_TOKEN_PATTERN = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;
const OPTIONAL_SEGMENT_PATTERN = /\[([^\[\]]*)\]/g;

export const NAME_FORMAT_PRESETS = Object.freeze({
  standard: Object.freeze({ labelKey: "nameFormatPresets.standard", template: "{prefix} {first} {infix} {last} {suffix}" }),
  nickname: Object.freeze({ labelKey: "nameFormatPresets.nickname", template: "{prefix} {first} [\"{nickname}\"] {infix} {last} {suffix}" }),
  formal: Object.freeze({ labelKey: "nameFormatPresets.formal", template: "{prefix} {title} {first} {infix} {last} {suffix}" }),
  location: Object.freeze({ labelKey: "nameFormatPresets.location", template: "{prefix} {first} {infix} {last} [of {location}] {suffix}" }),
  full: Object.freeze({ labelKey: "nameFormatPresets.full", template: "{prefix} {title} {first} [\"{nickname}\"] {infix} {last} [of {location}] {suffix}" }),
  custom: Object.freeze({ labelKey: "nameFormatPresets.custom", template: "{first} {last}" })
});

export const NICKNAME_MODES = Object.freeze({
  never: Object.freeze({ labelKey: "nicknameModes.never" }),
  sometimes: Object.freeze({ labelKey: "nicknameModes.sometimes" }),
  always: Object.freeze({ labelKey: "nicknameModes.always" })
});

export const TITLE_MODES = Object.freeze({
  never: Object.freeze({ labelKey: "titleModes.never" }),
  sometimes: Object.freeze({ labelKey: "titleModes.sometimes" }),
  always: Object.freeze({ labelKey: "titleModes.always" })
});

export const NAME_TEMPLATE_TOKENS = Object.freeze([
  "prefix",
  "title",
  "first",
  "nickname",
  "infix",
  "last",
  "location",
  "suffix",
  "index",
  "role",
  "race"
]);

const FALLBACK_NICKNAMES = Object.freeze([
  "Ash", "Crow", "Fox", "Grey", "Longstep", "Moth", "Quickhand", "Red", "Rook", "Sparrow", "Stone", "Wren"
]);

const ROLE_TITLES = Object.freeze({
  artisan: Object.freeze(["Master", "Journeyman"]),
  merchant: Object.freeze(["Factor", "Trader"]),
  acolyte: Object.freeze(["Acolyte", "Brother", "Sister"]),
  scholar: Object.freeze(["Doctor", "Master", "Scribe"]),
  specialist: Object.freeze(["Master", "Expert"]),
  guard: Object.freeze(["Watchman", "Sergeant"]),
  scout: Object.freeze(["Pathfinder", "Ranger"]),
  bruiser: Object.freeze(["Enforcer", "Strongarm"]),
  soldier: Object.freeze(["Corporal", "Sergeant", "Veteran"]),
  leader: Object.freeze(["Captain", "Steward", "Warden"]),
  noble: Object.freeze(["Lord", "Lady"])
});

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function pick(values, random) {
  if (!Array.isArray(values) || values.length === 0) return "";
  return values[Math.floor(random() * values.length)] ?? "";
}

function modeIncludes(mode, random) {
  if (mode === "always") return true;
  if (mode === "sometimes") return random() < 0.35;
  return false;
}

function titlePool(roleId, role, gender) {
  const configured = Array.isArray(role?.titles) ? role.titles.filter(Boolean) : [];
  const base = configured.length ? configured : (ROLE_TITLES[roleId] ?? []);
  if (roleId !== "acolyte" && roleId !== "noble") return base;
  if (roleId === "noble") return gender === "female" ? ["Lady"] : ["Lord"];
  if (roleId === "acolyte") return gender === "female" ? ["Sister", "Acolyte"] : ["Brother", "Acolyte"];
  return base;
}

export function resolveNameTemplate(options = {}) {
  const preset = NAME_FORMAT_PRESETS[options.nameFormatPreset] ?? NAME_FORMAT_PRESETS.standard;
  if (options.nameFormatPreset === "custom") {
    const custom = clean(options.nameTemplate);
    return custom || NAME_FORMAT_PRESETS.standard.template;
  }
  return preset.template;
}

export function validateNameTemplate(template) {
  const text = String(template ?? "");
  const unknown = [];
  for (const match of text.matchAll(TEMPLATE_TOKEN_PATTERN)) {
    if (!NAME_TEMPLATE_TOKENS.includes(match[1])) unknown.push(match[1]);
  }
  if (unknown.length) throw new Error(`Unknown name template token${unknown.length === 1 ? "" : "s"}: ${[...new Set(unknown)].join(", ")}`);
  const withoutTokens = text.replace(TEMPLATE_TOKEN_PATTERN, "");
  TEMPLATE_TOKEN_PATTERN.lastIndex = 0;
  if (/[{}]/.test(withoutTokens)) throw new Error("Name template contains an incomplete placeholder.");
  const opening = (text.match(/\[/g) ?? []).length;
  const closing = (text.match(/\]/g) ?? []).length;
  if (opening !== closing) throw new Error("Name template optional blocks must use matching [ and ] brackets.");
  return true;
}

function optionalSegment(segment, values) {
  const tokens = [...segment.matchAll(TEMPLATE_TOKEN_PATTERN)].map((match) => match[1]);
  if (tokens.some((token) => !clean(values[token]))) return "";
  return segment.replace(TEMPLATE_TOKEN_PATTERN, (_match, token) => clean(values[token]));
}

export function formatNameTemplate(template, values = {}) {
  validateNameTemplate(template);
  let output = String(template ?? "");
  let previous = null;
  while (output !== previous && OPTIONAL_SEGMENT_PATTERN.test(output)) {
    previous = output;
    OPTIONAL_SEGMENT_PATTERN.lastIndex = 0;
    output = output.replace(OPTIONAL_SEGMENT_PATTERN, (_match, segment) => optionalSegment(segment, values));
  }
  OPTIONAL_SEGMENT_PATTERN.lastIndex = 0;
  output = output.replace(TEMPLATE_TOKEN_PATTERN, (_match, token) => clean(values[token]));
  return output
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/([\[(])\s+/g, "$1")
    .replace(/\s+([\])])/g, "$1")
    .trim();
}

export function buildNameComponents({
  first,
  last,
  roleId,
  role,
  race,
  gender,
  index = 1,
  options = {},
  style = {},
  random = Math.random
} = {}) {
  const needsNickname = /\{nickname\}/.test(resolveNameTemplate(options));
  const needsTitle = /\{title\}/.test(resolveNameTemplate(options));
  const nicknamePool = Array.isArray(style.nicknames) && style.nicknames.length ? style.nicknames : FALLBACK_NICKNAMES;
  const nickname = needsNickname && modeIncludes(options.nicknameMode ?? "sometimes", random)
    ? pick(nicknamePool, random)
    : "";
  const titles = titlePool(roleId, role, gender);
  const title = needsTitle && titles.length && modeIncludes(options.titleMode ?? "sometimes", random)
    ? pick(titles, random)
    : "";
  return {
    prefix: clean(options.namePrefix),
    title: clean(title),
    first: clean(first),
    nickname: clean(nickname),
    infix: clean(options.nameInfix),
    last: clean(last),
    location: clean(options.nameLocation),
    suffix: clean(options.nameSuffix),
    index: String(Math.max(1, Math.trunc(Number(index) || 1))),
    role: clean(role?.label ?? roleId),
    race: clean(race?.label ?? race)
  };
}

export function formatGeneratedName(input = {}) {
  const template = resolveNameTemplate(input.options ?? {});
  const components = buildNameComponents(input);
  const formatted = formatNameTemplate(template, components);
  return formatted || [components.first, components.last].filter(Boolean).join(" ").trim() || "Unnamed NPC";
}

export function nameTemplateTokenSummary() {
  return NAME_TEMPLATE_TOKENS.map((token) => `{${token}}`).join(", ");
}
