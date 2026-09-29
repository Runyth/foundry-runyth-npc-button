import { MODULE_ID } from "../constants.mjs";
import { composePrompt } from "../extensions/prompt-api.mjs";
import { getRaces } from "../extensions/registry.mjs";

const RACE_GUIDANCE_BY_NAME = Object.freeze({
  goblin: "read unmistakably as a Goblin with a wiry or hunched non-human frame, oversized ears, long fingers or toes, sharp features, and a distinctly goblin silhouette rather than a green-tinted human",
  hobgoblin: "read unmistakably as a Hobgoblin with disciplined martial bearing, robust goblinoid anatomy, distinctive ears and facial structure, and a clearly goblinoid silhouette rather than a human with colored skin",
  duergar: "read unmistakably as a Duergar with compact dwarven build, stern subterranean features, and a hard-edged underdark silhouette rather than a grey human",
  svirfneblin: "read unmistakably as a Svirfneblin with compact deep-gnome proportions, subterranean features, and a clearly non-human gnomish silhouette rather than a short human"
});

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSection(text, label) {
  const plain = stripHtml(text);
  const pattern = new RegExp(`${label}:\\s*(.+?)(?=(?:[A-Z][A-Za-z ]+:)|$)`, "i");
  return plain.match(pattern)?.[1]?.trim() ?? "";
}

function cleanPart(value) {
  return String(value ?? "")
    .replace(/\.+$/g, "")
    .trim();
}

function summarizeItems(actor) {
  const names = Array.from(actor?.items ?? [])
    .map((item) => cleanPart(item?.name))
    .filter(Boolean)
    .slice(0, 4);
  return names.join(", ");
}

function roleFromActor(actor) {
  const flags = actor?.flags?.[MODULE_ID] ?? {};
  const base = cleanPart(flags.role) || cleanPart(extractSection(actor?.system?.details?.biography?.value, "Role").split("(")[0]);
  const variant = cleanPart(flags.roleVariant);
  return variant ? `${variant} ${base}` : base;
}

function raceFromActor(actor) {
  return cleanPart(actor?.system?.details?.type?.subtype) || cleanPart(actor?.flags?.[MODULE_ID]?.race) || "Human";
}

function wealthFromActor(actor) {
  return cleanPart(actor?.flags?.[MODULE_ID]?.wealth) || cleanPart(extractSection(actor?.system?.details?.biography?.value, "Wealth"));
}

function normalizeRaceKey(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function raceConfigFromLabel(race) {
  const target = normalizeRaceKey(race);
  if (!target) return null;
  for (const [id, config] of Object.entries(getRaces())) {
    if (normalizeRaceKey(id) === target || normalizeRaceKey(config?.label) === target) return config;
  }
  return null;
}

function isHumanRace(race) {
  return normalizeRaceKey(race) === "human";
}

function racePortraitGuidance(race) {
  if (!race || isHumanRace(race)) return [];
  const config = raceConfigFromLabel(race);
  const normalized = normalizeRaceKey(race);
  const specific = String(config?.portraitGuidance ?? RACE_GUIDANCE_BY_NAME[normalized] ?? "").trim();
  const generic = `make the anatomy, face, posture, hands, feet, and silhouette unmistakably ${String(race).trim()} and race-idiomatic, not merely human-looking with slight fantasy coloration or token features`;
  return [generic, specific].filter(Boolean);
}

function buildPortraitContext(actor) {
  const biography = actor?.system?.details?.biography?.value ?? "";
  const name = cleanPart(actor?.name) || "Unnamed NPC";
  const race = raceFromActor(actor);
  const role = roleFromActor(actor) || "NPC";
  const wealth = wealthFromActor(actor);
  const gender = cleanPart(actor?.flags?.[MODULE_ID]?.gender) || cleanPart(extractSection(biography, "Gender"));
  const appearance = cleanPart(extractSection(biography, "Appearance") || extractSection(biography, "First impression"));
  const tell = cleanPart(extractSection(biography, "Tell") || extractSection(biography, "Mannerism"));
  const quirk = cleanPart(extractSection(biography, "Quirk"));
  const items = summarizeItems(actor);
  return {
    actor,
    name,
    race,
    role,
    wealth,
    gender,
    appearance,
    tell,
    quirk,
    items
  };
}

function defaultPortraitComponents(context) {
  return {
    output: ["Output exactly one full body image and nothing else."],
    subject: [
      context.name,
      `adult ${context.race} ${context.role}`,
      context.gender,
      context.appearance,
      ...racePortraitGuidance(context.race),
      context.wealth ? `${String(context.wealth).toLowerCase()} attire` : "practical attire",
      context.items ? `carrying ${context.items}` : "",
      context.tell,
      context.quirk,
      "full body",
      "standing pose"
    ],
    style: [
      "semi-realistic adult anime illustration",
      "grounded low-fantasy character art",
      "muted earth-tone palette",
      "painterly shading",
      "crisp linework",
      "detailed worn textiles, leather, rope, and weathered materials"
    ],
    background: [
      "clean light background",
      "isolated single character",
      "studio presentation"
    ],
    negative: [
      "no text",
      "no watermark",
      "no extra characters",
      !isHumanRace(context.race) ? "avoid an overly human face, body, or silhouette for this race" : ""
    ]
  };
}

function buildDefaultPortraitPrompt(context, components) {
  const joinedSubject = (components.subject ?? []).filter(Boolean).join(", ");
  const trailing = [
    ...(components.style ?? []),
    ...(components.background ?? []),
    ...(components.negative ?? [])
  ].filter(Boolean).join(", ");
  return [
    ...(components.output ?? []),
    joinedSubject,
    trailing
  ].filter(Boolean).join("\n");
}

export function buildPortraitPromptFromActor(actor) {
  const context = buildPortraitContext(actor);
  return composePrompt("portrait", {
    context,
    defaults: defaultPortraitComponents,
    buildDefault: (resolvedContext, resolvedComponents) => buildDefaultPortraitPrompt(resolvedContext, resolvedComponents)
  });
}
