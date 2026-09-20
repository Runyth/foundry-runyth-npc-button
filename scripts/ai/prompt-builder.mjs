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
    "Create table-ready D&D 5e (2024 rules) NPC data for import into Foundry Virtual Tabletop v13 with dnd5e 5.x using the exact JSON contract below.",
    "Your entire response MUST be valid JSON only. Do not use Markdown, code fences, commentary, headings outside JSON, trailing commas, or JSON comments.",
    `Return ${payloadShape}.`,
    `Generate exactly ${count} NPC${count === 1 ? "" : "s"}.`,
    "Every Actor must have type \"npc\". Do not include _id, folder, ownership, sort, _stats, effects, prototypeToken, or flags.",
    "Set img to \"icons/svg/mystery-man.svg\". The importer applies the chosen Foundry folder locally.",
    "Use HTML only inside system.details.biography.value and system.details.biography.public. Allowed tags are <p>, <strong>, <em>, <ul>, <li>, and <br>, with no attributes.",
    "The private biography must be terse but immediately useful at the table and contain: Appearance, Speech, Motivation, Mannerism, Rumours, Secrets, Relationships, and Adventure Hook.",
    "Rumours should be things other people might plausibly say or believe about the NPC; they may be true, false, or distorted. Secrets must contain information the NPC would not readily volunteer.",
    count > 1
      ? "This is a batch. When it improves play, connect the NPCs: relationships, rumours, secrets, debts, loyalties, rivalries, family ties, or shared incidents may refer to other generated NPCs by exact name. Do not force a connection when it would be unnatural."
      : "Relationships may mention off-screen people or groups when useful, but do not invent batch relationships because only one NPC is requested.",
    "Use sensible D&D 5e numbers for the requested role and tier/CR. Ability values must be integers from 1 to 30. HP value/max must be non-negative numbers. AC flat must be numeric. CR must be numeric and match the requested CR exactly when a CR is explicitly requested.",
    "Use movement.units = \"ft\" and a standard dnd5e size key: tiny, sm, med, lg, huge, or grg.",
    "Inventory is important. Give each NPC a short, plausible inventory appropriate to Role and Wealth, not a generic adventurer loadout.",
    "Prefer standard D&D 5e equipment when it fits. For a standard item, set lookup to its exact English canonical equipment name so the importer can resolve it from the D&D 5e compendium. For an invented roleplay-only possession, set lookup to null.",
    "Invented possessions are encouraged when mundane specificity improves roleplay: purses, letters, receipts, toys, keys, work scraps, devotional keepsakes, food, personal mementos, local tokens, and similar items.",
    "Represent carried money as a believable purse, pouch, strongbox, wallet, or similar roleplay item whose description states the coins or valuables. Scale it to Wealth and circumstances rather than giving every NPC the same money.",
    "Do not overload inventories. Usually 3–8 entries is enough unless the role strongly calls for more.",
    "Do not invent additional top-level Actor keys.",
    "Do not include prose before or after the JSON value.",
    "",
    "Requested NPC profile:",
    `- Role: ${clean(options.roleLabel, clean(options.role, "Guard"))}`,
    `- Role equipment guidance: ${clean(options.roleEquipmentHint, "choose practical possessions that directly support the role")}`,
    `- Tier / CR: ${clean(options.tierLabel, clean(options.tier, "Trained"))}`,
    `- Race: ${clean(options.raceLabel, clean(options.race, "Human"))}`,
    `- Wealth: ${clean(options.wealthLabel, clean(options.wealth, "Average"))}`,
    `- Wealth guidance: ${clean(options.wealthPrompt, "ordinary practical possessions and modest spending money")}`,
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
    "      \"biography\": {",
    "        \"value\": \"<p><strong>Appearance:</strong> ...</p><p><strong>Speech:</strong> ...</p><p><strong>Motivation:</strong> ...</p><p><strong>Mannerism:</strong> ...</p><p><strong>Rumours:</strong> ...</p><p><strong>Secrets:</strong> ...</p><p><strong>Relationships:</strong> ...</p><p><strong>Adventure Hook:</strong> ...</p>\",",
    "        \"public\": \"\"",
    "      }",
    "    },",
    "    \"traits\": { \"size\": \"med\" }",
    "  },",
    "  \"items\": [",
    "    {",
    "      \"name\": \"Mace\",",
    "      \"lookup\": \"Mace\",",
    "      \"quantity\": 1,",
    "      \"description\": \"Why this NPC carries it, if context is useful.\"",
    "    },",
    "    {",
    "      \"name\": \"Worn coin purse\",",
    "      \"lookup\": null,",
    "      \"quantity\": 1,",
    "      \"description\": \"Contains a believable amount and mix of coins for this NPC's wealth.\"",
    "    }",
    "  ]",
    "}",
    "",
    "Inventory contract:",
    "- name: required display name, 1–120 characters.",
    "- lookup: exact English canonical D&D 5e equipment name when the item should resolve to standard compendium content; otherwise null.",
    "- quantity: integer from 1 to 1000.",
    "- description: short roleplay context. It may be empty for obvious canonical equipment.",
    "- Do not put raw Foundry Item system data in items; the importer resolves canonical items and safely creates fallback roleplay items.",
    "",
    `Final validation before replying: JSON.parse must succeed; the root JSON value must be ${singleObject ? "an object" : "an array"}; it must contain exactly ${count} Actor object${count === 1 ? "" : "s"}; every Actor must have an items array and all required biography sections.`,
    "Output only the JSON value."
  ].join("\n");
}
