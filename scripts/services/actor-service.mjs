import { MODULE_ID, SETTINGS } from "../constants.mjs";
import { buildActorSource, generateNpcBatch } from "../generator/npc-generator.mjs";
import { logger } from "../logger.mjs";
import { resolveCanonicalItemsForActors } from "./item-resolver.mjs";

export async function resolveNpcFolder(options) {
  if (options.useActorRoot) return null;

  const requested = String(options.newFolderName ?? "").trim();
  if (!requested && options.folderId) {
    const existing = game.folders.get(options.folderId);
    if (existing?.type === "Actor") return existing;
  }

  const fallback = String(game.settings.get(MODULE_ID, SETTINGS.DEFAULT_FOLDER) ?? "").trim();
  const folderName = requested || fallback;
  if (!folderName) return null;

  const existing = game.folders.find((folder) => (
    folder.type === "Actor"
    && !folder.folder
    && folder.name.localeCompare(folderName, undefined, { sensitivity: "accent" }) === 0
  ));
  if (existing) return existing;

  return Folder.implementation.create({
    name: folderName,
    type: "Actor",
    folder: null
  });
}

function ensureCanCreate() {
  if (!game.user?.isGM) throw new Error("Only a Game Master can create NPCs.");
  if (game.system?.id !== "dnd5e") throw new Error("Runyth NPC Button requires the dnd5e game system.");
}

async function createSources(actorSources, options, { imported = false } = {}) {
  const hookPrefix = imported ? "import" : "create";
  Hooks.callAll(`${MODULE_ID}.pre${hookPrefix === "import" ? "Import" : "Create"}Batch`, actorSources, options);
  logger.debug(imported ? "Importing NPC batch" : "Creating NPC batch", {
    count: actorSources.length,
    folderId: actorSources[0]?.folder ?? null
  });

  const actors = await Actor.implementation.createDocuments(actorSources);
  for (const actor of actors) {
    Hooks.callAll(`${MODULE_ID}.${imported ? "imported" : "created"}`, actor, options);
  }

  Hooks.callAll(`${MODULE_ID}.${imported ? "importedBatch" : "createdBatch"}`, actors, options);
  return actors;
}

export async function createNpcActors(options) {
  ensureCanCreate();

  const maxBatch = Number(game.settings.get(MODULE_ID, SETTINGS.MAX_BATCH)) || 25;
  const count = Math.min(Math.max(1, Number(options.count) || 1), maxBatch);
  const normalized = { ...options, count };
  const folder = await resolveNpcFolder(normalized);
  const blueprints = generateNpcBatch(normalized);
  const actorSources = blueprints.map((blueprint) => buildActorSource(blueprint, { folderId: folder?.id }));

  return createSources(actorSources, normalized);
}

export async function createImportedNpcActors(actorSources, options = {}) {
  ensureCanCreate();

  const maxBatch = Number(game.settings.get(MODULE_ID, SETTINGS.MAX_BATCH)) || 25;
  if (!Array.isArray(actorSources) || !actorSources.length) return [];
  if (actorSources.length > maxBatch) {
    throw new Error(`The import contains ${actorSources.length} Actors, exceeding the configured maximum of ${maxBatch}.`);
  }

  const folder = await resolveNpcFolder(options);
  const resolvedItems = await resolveCanonicalItemsForActors(actorSources);
  const sources = resolvedItems.map((source) => ({
    ...source,
    folder: folder?.id ?? null
  }));
  return createSources(sources, { ...options, count: sources.length }, { imported: true });
}
