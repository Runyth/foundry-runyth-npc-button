const ABILITY_KEYS = Object.freeze(["str", "dex", "con", "int", "wis", "cha"]);

function clean(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function buildAiPrompt(options = {}) {
  const count = Math.max(1, Math.trunc(Number(options.count) || 1));
  const singleObject = count === 1 && Boolean(options.singleAiObject);
  const payloadShape = singleObject
    ? "exactly one JSON object, not an array"
    : `exactly one JSON array containing ${count} Actor object${count === 1 ? "" : "s"}`;
  const namingExamples = Array.isArray(options.namingExamples) && options.namingExamples.length
    ? options.namingExamples.join(", ")
    : "use names consistent with the requested naming style";

  return [
    "Create D&D 5e NPC Actor source data for Foundry Virtual Tabletop v13 and dnd5e 5.x using the exact contract below.",
    "Your entire response MUST be valid JSON only. Do not use Markdown, code fences, commentary, headings, trailing commas, or JSON comments.",
    `Return ${payloadShape}.`,
    `Generate exactly ${count} NPC${count === 1 ? "" : "s"}.`,
    "Every Actor must have type \"npc\". Do not include _id, folder, ownership, sort, _stats, effects, prototypeToken, or flags.",
    "Set img to \"icons/svg/mystery-man.svg\" and items to an empty array. The importer intentionally owns and validates this stable Actor core.",
    "Use HTML only inside system.details.biography.value and system.details.biography.public. Allowed tags are <p>, <strong>, <em>, <ul>, <li>, and <br>, with no attributes.",
    "The private biography should be immediately useful at the table and include Appearance, Speech, Motivation, Secret, Mannerism, and Adventure Hook.",
    "Use sensible D&D 5e numbers for the requested role and tier. Ability values must be integers from 1 to 30. HP value/max must be non-negative numbers. AC flat must be numeric. CR must be numeric.",
    "Use movement.units = \"ft\" and a standard dnd5e size key: tiny, sm, med, lg, huge, or grg.",
    "Do not invent additional top-level keys.",
    "Do not include prose before or after the JSON value.",
    "",
    "Requested NPC profile:",
    `- Role: ${clean(options.roleLabel, clean(options.role, "Guard"))}`,
    `- Tier: ${clean(options.tierLabel, clean(options.tier, "Trained"))}`,
    `- Species: ${clean(options.speciesLabel, clean(options.species, "Human"))}`,
    `- Naming style: ${clean(options.namingStyleLabel, clean(options.namingStyle, "Central"))}`,
    `- Naming examples: ${namingExamples}`,
    `- Requested name or batch prefix: ${clean(options.customName, "none; generate natural names")}`,
    "",
    "Required Actor object shape:",
    "{",
    "  \"name\": \"string\",",
    "  \"type\": \"npc\",",
    "  \"img\": \"icons/svg/mystery-man.svg\",",
    "  \"system\": {",
    `    \"abilities\": { ${ABILITY_KEYS.map((key) => `\"${key}\": { \"value\": 10 }`).join(", ")} },`,
    "    \"attributes\": {",
    "      \"ac\": { \"calc\": \"flat\", \"flat\": 12 },",
    "      \"hp\": { \"value\": 9, \"max\": 9, \"formula\": \"2d8\" },",
    "      \"movement\": { \"walk\": 30, \"units\": \"ft\" }",
    "    },",
    "    \"details\": {",
    "      \"cr\": 0.25,",
    "      \"type\": { \"value\": \"humanoid\", \"subtype\": \"Human\", \"swarm\": \"\", \"custom\": \"\" },",
    "      \"biography\": { \"value\": \"<p><strong>Appearance:</strong> ...</p>\", \"public\": \"\" }",
    "    },",
    "    \"traits\": { \"size\": \"med\" }",
    "  },",
    "  \"items\": []",
    "}",
    "",
    `Final validation before replying: JSON.parse must succeed; the root JSON value must be ${singleObject ? "an object" : "an array"}; and it must contain exactly ${count} Actor object${count === 1 ? "" : "s"}.`,
    "Output only the JSON value."
  ].join("\n");
}
