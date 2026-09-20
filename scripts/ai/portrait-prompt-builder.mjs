import { MODULE_ID } from "../constants.mjs";

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
  return cleanPart(actor?.flags?.[MODULE_ID]?.role) || cleanPart(extractSection(actor?.system?.details?.biography?.value, "Role").split("(")[0]);
}

function raceFromActor(actor) {
  return cleanPart(actor?.system?.details?.type?.subtype) || cleanPart(actor?.flags?.[MODULE_ID]?.race) || "Human";
}

function wealthFromActor(actor) {
  return cleanPart(actor?.flags?.[MODULE_ID]?.wealth) || cleanPart(extractSection(actor?.system?.details?.biography?.value, "Wealth"));
}

export function buildPortraitPromptFromActor(actor) {
  const biography = actor?.system?.details?.biography?.value ?? "";
  const name = cleanPart(actor?.name) || "Unnamed NPC";
  const race = raceFromActor(actor);
  const role = roleFromActor(actor) || "NPC";
  const wealth = wealthFromActor(actor);
  const appearance = cleanPart(extractSection(biography, "Appearance") || extractSection(biography, "First impression"));
  const tell = cleanPart(extractSection(biography, "Tell") || extractSection(biography, "Mannerism"));
  const quirk = cleanPart(extractSection(biography, "Quirk"));
  const items = summarizeItems(actor);
  const parts = [
    `${name}`,
    `adult ${race} ${role}`,
    appearance,
    wealth ? `${wealth.toLocaleLowerCase()} attire` : "practical attire",
    items ? `carrying ${items}` : "",
    tell,
    quirk,
    "full body",
    "standing pose",
    "adult anime style"
  ].filter(Boolean);

  return [
    "Output exactly one full body image and nothing else.",
    parts.join(", "),
    "clean background, polished illustration, no text, no watermark, no extra characters"
  ].join("\n");
}
