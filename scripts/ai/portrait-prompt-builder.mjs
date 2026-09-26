import { MODULE_ID } from "../constants.mjs";
import { composePrompt } from "../extensions/prompt-api.mjs";

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
      "no extra characters"
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
