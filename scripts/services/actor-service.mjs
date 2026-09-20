import { MODULE_ID, SETTINGS } from "../constants.mjs";
import { buildActorSource, generateNpcBatch } from "../generator/npc-generator.mjs";
import { logger } from "../logger.mjs";

async function resolveFolder(options) {
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

export async function createNpcActors(options) {
  if (!game.user?.isGM) throw new Error("Only a Game Master can generate NPCs.");
  if (game.system?.id !== "dnd5e") throw new Error("Runyth NPC Button requires the dnd5e game system.");

  const maxBatch = Number(game.settings.get(MODULE_ID, SETTINGS.MAX_BATCH)) || 25;
  const count = Math.min(Math.max(1, Number(options.count) || 1), maxBatch);
  const normalized = { ...options, count };
  const folder = await resolveFolder(normalized);
  const blueprints = generateNpcBatch(normalized);
  const actorSources = blueprints.map((blueprint) => buildActorSource(blueprint, { folderId: folder?.id }));

  Hooks.callAll(`${MODULE_ID}.preCreateBatch`, actorSources, normalized);
  logger.debug("Creating NPC batch", { count: actorSources.length, folderId: folder?.id ?? null });

  const actors = [];
  for (const source of actorSources) {
    const actor = await Actor.implementation.create(source, { renderSheet: false });
    if (actor) {
      actors.push(actor);
      Hooks.callAll(`${MODULE_ID}.created`, actor, normalized);
    }
  }

  Hooks.callAll(`${MODULE_ID}.createdBatch`, actors, normalized);
  return actors;
}
