import { composePrompt } from "../extensions/prompt-api.mjs";
import { wealthBudgetCp } from "../generator/wealth.mjs";

const ABILITY_KEYS = Object.freeze(["str", "dex", "con", "int", "wis", "cha"]);

function clean(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function list(values, fallback = "none") {
  if (!Array.isArray(values) || values.length === 0) return fallback;
  return values.map((value) => clean(value)).filter(Boolean).join(", ") || fallback;
}

function buildDefaultAiPrompt(options = {}) {
  const count = Math.max(1, Math.trunc(Number(options.count) || 1));
  const portableWealthBudgetCp = wealthBudgetCp(options.wealth);
  const grouped = clean(options.groupType, "independent") !== "independent" && clean(options.groupTypeLabel, "Independent NPCs") !== "Independent NPCs";
  const payloadShape = `exactly one JSON array containing ${count} Actor object${count === 1 ? "" : "s"}`;
  const namingExamples = Array.isArray(options.namingExamples) && options.namingExamples.length
    ? options.namingExamples.join("; ")
    : "use names consistent with the requested naming style";
  const groupRaces = list(options.groupRaceLabels, clean(options.raceLabel, "Human"));
  const groupRoles = list(options.groupRoleLabels, clean(options.roleLabel, "Guard"));
  const raceMixed = clean(options.raceComposition, "single") !== "single";
  const roleMixed = ["balanced", "primary", "dominant", "weighted"].includes(clean(options.roleComposition, "groupPreset"));
  const roleVariants = list(options.roleVariants, "none supplied");
  const genderMode = clean(options.genderComposition, "random");
  const genderInstruction = genderMode === "exact"
    ? `exactly ${Math.max(0, Math.trunc(Number(options.genderExactMale) || 0))} male and ${Math.max(0, Math.trunc(Number(options.genderExactFemale) || 0))} female NPCs`
    : genderMode === "balanced"
      ? "an as-even-as-possible male/female split, using exact integer counts for the requested batch size"
      : genderMode === "mostlyMale"
        ? "a strong male majority, approximately 80/20, using exact integer counts for the batch"
        : genderMode === "mostlyFemale"
          ? "a strong female majority, approximately 80/20, using exact integer counts for the batch"
          : "independently randomize each NPC as male or female";

  return [
    "Create table-ready D&D 5e (2024 rules) NPC data for import into Foundry Virtual Tabletop v13 with dnd5e 5.x using the exact JSON contract below.",
    "Your entire response MUST be a single markdown code block labeled json containing valid JSON. Do not include commentary, headings, trailing commas, or JSON comments.",
    `Return ${payloadShape}.`,
    `Generate exactly ${count} NPC${count === 1 ? "" : "s"}.`,
    "Every Actor must have type \"npc\". Do not include _id, folder, ownership, sort, _stats, effects, prototypeToken, or flags.",
    "Set img to \"icons/svg/mystery-man.svg\". The importer applies the chosen Foundry folder locally.",
    "Use HTML only inside system.details.biography.value and system.details.biography.public. Allowed tags are <p>, <strong>, <em>, <ul>, <li>, and <br>, with no attributes.",
    "The private biography must be terse but immediately useful at the table and contain these labeled sections: Gender, Appearance, Speech, Motivation, Mannerism, Quirk, Rumours, Secrets, Relationships, and Adventure Hook.",
    "Quirk must be a small, playable behavior, habit, preference, superstition, or personal oddity. Avoid cartoonish gimmicks unless the requested group specifically calls for one.",
    "Rumours should be things other people might plausibly say or believe about the NPC; they may be true, false, or distorted. Secrets must contain information the NPC would not readily volunteer.",
    grouped
      ? "This is an intentional group. Cross-reference generated NPCs by exact name. Relationship, rumour, secret, obligation, debt, affection, rivalry, family tie, chain-of-command issue, shared incident, or dispute details should connect members wherever useful. Do not generate isolated strangers unless the group concept logically requires it."
      : count > 1
        ? "This is a batch of independent NPCs. Relationships between generated NPCs are optional; add them only when they improve play and feel natural."
        : "Relationships may mention off-screen people or groups when useful, but do not invent batch relationships because only one NPC is requested.",
    grouped
      ? "Give every group member a distinct functional or social role inside the group, even when two members share the same broad D&D role. Make the group feel like it existed before the PCs arrived and will keep functioning after they leave."
      : "Keep each NPC distinct in voice, motivation, possessions, and hook.",
    clean(options.groupType, "") === "family"
      ? "FAMILY REQUIREMENTS: establish exact kinship between every member; make household responsibilities clear; include at least one shared family secret, one plausible family rumour, and one meaningful disagreement or pressure. Every family member must have an individual quirk. Reuse family surnames naturally where appropriate, while allowing married-in relatives, step-relations, adopted relatives, or different surnames when the chosen family structure supports it."
      : "",
    "Use sensible D&D 5e numbers for the requested role and tier/CR. Ability values must be integers from 1 to 30. HP value/max must be non-negative numbers. AC flat must be numeric. CR must be numeric and match the requested CR exactly when a CR is explicitly requested.",
    "Use movement.units = \"ft\" and a standard dnd5e size key: tiny, sm, med, lg, huge, or grg.",
    "Every NPC remains mechanically combatable even when combat is not their narrative focus. Combat readiness controls carried weapons and armor, not whether the Actor has usable combat statistics.",
    `Combat readiness: ${clean(options.combatReadinessLabel, "Standard")} — ${clean(options.combatReadinessPrompt, "use realistic role-appropriate equipment")}.`,
    `Weapon variety: ${clean(options.weaponVarietyLabel, "Mixed")} — ${clean(options.weaponVarietyPrompt, "use a natural mix of melee and ranged options where plausible")}.`,
    `Primary-role combat guidance: ${clean(options.roleCombatGuidance, "weapons and armor must remain realistic for the exact occupation and circumstances")}.`,
    "Weapon and armor logic must be explainable from Role, role subtype, CR, Habitat, Wealth, group function, and Combat readiness. Higher CR may justify better training, quality, or a broader practical loadout, but it must never justify absurd occupational gear.",
    roleMixed ? "For each mixed Role, derive its own realistic combat ceiling from that exact occupation; do not apply the primary Role combat guidance blindly to every NPC." : "",
    "At Weaponless readiness, do not include any weapon or armor. Occupational tools and ordinary clothing are still allowed. At higher readiness, stay within the role's realistic ceiling: a jurist or scholar may top out at a discreet knife or walking staff, while a professional raider or soldier may carry several proper weapons and armor.",
    "Weapon variety never overrides role realism. Melee-only and ranged-only are hard constraints on dedicated weapons; if a role has no believable option in the requested category, keep that NPC weaponless instead of inventing an absurd weapon. Preference modes bias the loadout but may use one sensible backup from the other category when readiness and role justify it.",
    "Inventory is important. Give each NPC a short, plausible inventory appropriate to Role, Wealth, Habitat, group function, and immediate circumstances, not a generic adventurer loadout.",
    "Prefer standard D&D 5e equipment when it fits. For a standard item, set lookup to its exact English canonical equipment name so the importer can resolve it from the D&D 5e compendium. For an invented roleplay-only possession, set lookup to null.",
    "Invented possessions are encouraged when mundane specificity improves roleplay: purses, letters, receipts, toys, keys, work scraps, devotional keepsakes, food, personal mementos, local tokens, family objects, duty rosters, travel papers, trade samples, repair parts, and similar items.",
    "Use system.currency for actual carried coins. Every generated NPC must carry at least 1 cp-equivalent of real coin; do not represent all money only as prose or a generic purse item.",
    `Portable personal-wealth budget: exactly ${portableWealthBudgetCp} cp-equivalent per NPC. This budget covers system.currency plus portable valuables whose wealthValueCp is greater than 0. Ordinary role/combat equipment has wealthValueCp 0 and is outside this portable-wealth budget.`,
    `Wealth distribution: ${clean(options.wealthDistributionLabel, "Mixed")} — ${clean(options.wealthDistributionPrompt, "split portable wealth roughly evenly between coins and portable possessions")}.`,
    "The distribution changes only the split between coins and portable valuables. It must never change the total portable-wealth budget.",
    "Do not overload inventories. Usually 3–8 entries is enough unless the role strongly calls for more.",
    "Do not invent additional top-level Actor keys.",
    "Do not include commentary before or after the fenced JSON code block.",
    "Wrap the entire reply in exactly one markdown code block labeled json.",
    "Inside the code block, indent nested JSON with 2 spaces.",
    "",
    "NAMING REQUIREMENTS:",
    `- Naming style: ${clean(options.namingStyleLabel, clean(options.namingStyle, "Central"))}`,
    `- Style guidance: ${clean(options.namingStyleGuidance, "use a coherent fictional regional naming palette")}`,
    `- Creative idiomatic examples: ${namingExamples}`,
    "- Treat examples as tonal references, not a finite name list. Do not simply copy every example or mechanically recombine first and last halves.",
    "- Produce names that sound natural together, with enough phonetic and structural variation that a batch does not look algorithmically generated.",
    "- For families or long-standing houses, use shared surnames, cadet surnames, marriage names, nicknames, and generational variation naturally rather than forcing every relative to have an identical surname.",
    clean(options.customName)
      ? (count === 1
        ? `- Name override: use ${clean(options.customName)} as the Actor name. It overrides the generated naming template.`
        : `- Batch prefix override: use ${clean(options.customName)} followed by the sequential NPC number (for example ${clean(options.customName)} 1, ${clean(options.customName)} 2). It overrides the generated naming template.`)
      : `- Name format template: ${clean(options.nameFormatTemplate, "{first} {last}")}`,
    !clean(options.customName) ? "- Template tokens: {prefix}, {title}, {first}, {nickname}, {infix}, {last}, {location}, {suffix}, {index}, {role}, {race}. Text inside [square brackets] is optional and must be omitted when one of its placeholders is empty." : "",
    !clean(options.customName) && clean(options.namePrefix) ? `- Fixed prefix text: ${clean(options.namePrefix)}` : "",
    !clean(options.customName) && clean(options.nameInfix) ? `- Fixed infix text: ${clean(options.nameInfix)}` : "",
    !clean(options.customName) && clean(options.nameSuffix) ? `- Fixed suffix text: ${clean(options.nameSuffix)}` : "",
    !clean(options.customName) && clean(options.nameLocation) ? `- Fixed location text: ${clean(options.nameLocation)}` : "",
    !clean(options.customName) ? `- Nickname inclusion: ${clean(options.nicknameMode, "sometimes")}. Generate a natural short nickname only if the template uses {nickname}.` : "",
    !clean(options.customName) ? `- Title inclusion: ${clean(options.titleMode, "sometimes")}. Use a plausible role/status title only if the template uses {title}; leave it empty when no sensible title applies.` : "",
    "",
    "Requested NPC profile:",
    `- Count: ${count}`,
    `- Gender mix: ${clean(options.genderCompositionLabel, "Randomized")} — ${genderInstruction}.`,
    `- Role / primary role: ${clean(options.roleLabel, clean(options.role, "Guard"))}`,
    `- Role composition: ${clean(options.roleCompositionLabel, "Group-appropriate roles")} — ${clean(options.roleCompositionPrompt, "use a coherent role distribution")}`,
    clean(options.roleComposition, "") === "variants" ? `- Available primary-role variants: ${roleVariants}` : "",
    roleMixed ? `- Allowed roles: ${groupRoles}` : "",
    roleMixed ? `- Primary role: ${clean(options.roleLabel, clean(options.role, "Guard"))}` : "",
    clean(options.roleComposition, "") === "weighted" ? `- Relative role weights: ${clean(options.roleWeightSummary, "equal weights")}` : "",
    `- Role equipment guidance: ${clean(options.roleEquipmentHint, "choose practical possessions that directly support the role")}`,
    `- Combat readiness: ${clean(options.combatReadinessLabel, "Standard")}`,
    `- Weapon variety: ${clean(options.weaponVarietyLabel, "Mixed")} — ${clean(options.weaponVarietyPrompt, "natural role-appropriate mix")}`,
    `- Tier / CR: ${clean(options.tierLabel, clean(options.tier, "Trained"))}`,
    `- Race / primary race: ${clean(options.raceLabel, clean(options.race, "Human"))}`,
    `- Wealth: ${clean(options.wealthLabel, clean(options.wealth, "Average"))}`,
    `- Wealth guidance: ${clean(options.wealthPrompt, "ordinary practical possessions and modest spending money")}`,
    `- Wealth distribution: ${clean(options.wealthDistributionLabel, "Mixed")} — ${clean(options.wealthDistributionPrompt, "roughly even coins and portable valuables")}`,
    `- Portable wealth budget: ${portableWealthBudgetCp} cp-equivalent total per NPC`,
    `- Habitat: ${clean(options.habitatLabel, "Forest Village")}`,
    `- Habitat guidance: ${clean(options.habitatPrompt, "adapt daily life, possessions, travel, and social assumptions to the habitat")}`,
    `- Group type: ${clean(options.groupTypeLabel, "Independent NPCs")}`,
    `- Group archetype guidance: ${clean(options.groupTypePrompt, "generate distinct individuals")}`,
    clean(options.groupType, "") === "family" ? `- Family structure: ${clean(options.familyStructureLabel, "Single household")}` : "",
    grouped ? `- Group cohesion: ${clean(options.groupCohesionLabel, "Functional")} — ${clean(options.groupCohesionPrompt)}` : "",
    grouped ? `- Group hierarchy: ${clean(options.groupHierarchyLabel, "Informal leader")} — ${clean(options.groupHierarchyPrompt)}` : "",
    grouped ? `- Relationship density: ${clean(options.relationshipDensityLabel, "Rich")} — ${clean(options.relationshipDensityPrompt)}` : "",
    grouped ? `- Internal conflict: ${clean(options.internalConflictLabel, "Low")} — ${clean(options.internalConflictPrompt)}` : "",
    `- Race composition: ${clean(options.raceCompositionLabel, "Single race")} — ${clean(options.raceCompositionPrompt, "use the selected primary race")}`,
    raceMixed ? `- Allowed races: ${groupRaces}` : "",
    raceMixed ? `- Primary race: ${clean(options.primaryRaceLabel, clean(options.raceLabel, "Human"))}` : "",
    clean(options.raceComposition, "") === "weighted" ? `- Relative race weights: ${clean(options.raceWeightSummary, "equal weights")}` : "",
    clean(options.raceComposition, "") === "exact" ? `- Exact race counts: ${clean(options.raceExactCountSummary, "counts must add up exactly to the requested batch size")}` : "",
    grouped && clean(options.groupBrief) ? `- Additional group brief: ${clean(options.groupBrief)}` : "",
    `- Requested name or batch prefix: ${clean(options.customName, "none; use the configured naming format")}`,
    "",
    grouped ? "GROUP COHERENCE RULES:" : "",
    grouped ? "- Give the group a coherent shared situation, recent history, and reason its members are currently together." : "",
    grouped ? "- Assign responsibilities and useful internal roles so not every member is a copy of the same stat concept." : "",
    grouped ? "- At least half the NPCs should explicitly name another generated NPC in Relationships, Rumours, or Secrets; for families, every NPC must do so." : "",
    grouped ? "- Shared secrets and rumours may appear from different perspectives, but do not paste identical biography text into every Actor." : "",
    grouped ? "- Vary equipment by responsibility: leaders, scouts, caretakers, artisans, guards, dependents, specialists, and wealthy members should carry different things." : "",
    clean(options.roleComposition, "") === "variants" ? "- For Role variants, keep the same broad Role statistics but assign distinct practical subtypes as evenly as possible; when enough variants exist, avoid duplicates before reusing one." : "",
    roleMixed ? "- For mixed-role composition, satisfy the requested approximate proportions across the exact NPC count. Use integer counts that best approximate the requested shares; do not randomize away small minorities." : "",
    clean(options.raceComposition, "") === "exact" ? "- Exact Race composition is a hard quota, not an approximation. Produce exactly the supplied count for each selected Race." : (raceMixed ? "- For mixed-Race composition, satisfy the requested approximate proportions using exact integer member counts. Strong-majority composition should preserve small minorities when group size permits; e.g. a ten-person three-Race group may reasonably become 8/1/1." : ""),
    "",
    "Required Actor object shape:",
    "{",
    "  \"name\": \"string\",",
    "  \"type\": \"npc\",",
    "  \"img\": \"icons/svg/mystery-man.svg\",",
    "  \"system\": {",
    `    \"abilities\": { ${ABILITY_KEYS.map((key) => `\"${key}\": { \"value\": 10 }`).join(", ")} },`,
    "    \"currency\": { \"pp\": 0, \"gp\": 2, \"ep\": 0, \"sp\": 4, \"cp\": 7 },",
    "    \"attributes\": {",
    "      \"ac\": { \"calc\": \"flat\", \"flat\": 12 },",
    "      \"hp\": { \"value\": 9, \"max\": 9, \"formula\": \"2d8\" },",
    "      \"movement\": { \"walk\": 30, \"units\": \"ft\" }",
    "    },",
    "    \"details\": {",
    "      \"cr\": 0.25,",
    "      \"type\": { \"value\": \"humanoid\", \"subtype\": \"Human\", \"swarm\": \"\", \"custom\": \"\" },",
    "      \"biography\": {",
    "        \"value\": \"<p><strong>Gender:</strong> Male</p><p><strong>Appearance:</strong> ...</p><p><strong>Speech:</strong> ...</p><p><strong>Motivation:</strong> ...</p><p><strong>Mannerism:</strong> ...</p><p><strong>Quirk:</strong> ...</p><p><strong>Rumours:</strong> ...</p><p><strong>Secrets:</strong> ...</p><p><strong>Relationships:</strong> ...</p><p><strong>Adventure Hook:</strong> ...</p>\",",
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
    "      \"wealthValueCp\": 0,",
    "      \"description\": \"Why this NPC carries it, if context is useful.\"",
    "    },",
    "    {",
    "      \"name\": \"Portable valuable\",",
    "      \"lookup\": null,",
    "      \"quantity\": 1,",
    "      \"wealthValueCp\": 250,",
    "      \"description\": \"A personal valuable counted against this NPC's portable wealth budget.\"",
    "    }",
    "  ]",
    "}",
    "",
    "Inventory contract:",
    "- name: required display name, 1–120 characters.",
    "- lookup: exact English canonical D&D 5e equipment name when the item should resolve to standard compendium content; otherwise null.",
    "- quantity: integer from 1 to 1000.",
    "- wealthValueCp: non-negative integer. Use 0 for ordinary role/combat gear; use the item's share of portable personal wealth for valuables counted against the fixed wealth budget.",
    "- description: short roleplay context. It may be empty for obvious canonical equipment.",
    "- Do not put raw Foundry Item system data in items; the importer resolves canonical items and safely creates fallback roleplay items.",
    "",
    `Final validation before replying: JSON.parse must succeed; the root JSON value inside the code block must be an array; it must contain exactly ${count} Actor object${count === 1 ? "" : "s"}; every Actor must have an items array and all required biography sections, including Quirk, Rumours, Secrets, and Relationships.`,
    "Output only one markdown code block labeled json, with no prose outside it."
  ].filter(Boolean).join("\n");
}


export function buildAiPrompt(options = {}) {
  return composePrompt("npcJson", {
    context: options,
    buildDefault: (resolvedOptions) => buildDefaultAiPrompt(resolvedOptions)
  });
}
