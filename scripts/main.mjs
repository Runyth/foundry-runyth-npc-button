import { MODULE_ID, MODULE_TITLE, MODULE_VERSION } from "./constants.mjs";
import { buildPortraitPromptFromActor } from "./ai/portrait-prompt-builder.mjs";
import { buildAiPrompt } from "./ai/prompt-builder.mjs";
import { generateNpcBatch, generateNpcBlueprint } from "./generator/npc-generator.mjs";
import { logger } from "./logger.mjs";
import { registerSettings } from "./settings.mjs";
import { createNpcActors } from "./services/actor-service.mjs";
import { injectActorDirectoryButton } from "./ui/actor-directory.mjs";
import { clearPromptExtensionRegistry, getPromptExtensions, registerPromptExtension, resolvePromptComponents, resolvePromptContext, unregisterPromptExtension } from "./extensions/prompt-api.mjs";
import { registerPortraitPromptHooks } from "./ui/actor-portrait-button.mjs";
import { openNpcDashboard, openNpcDialog } from "./ui/npc-dialog.mjs";
import {
  getCatalogGroups,
  getGroupTypes,
  getHabitats,
  getNamingStyles,
  getRaces,
  getRoles,
  registerGroupType,
  registerHabitat,
  registerNamingStyle,
  registerRace,
  registerRole,
  unregisterGroupType,
  unregisterHabitat,
  unregisterNamingStyle,
  unregisterRace,
  unregisterRole
} from "./extensions/registry.mjs";

// Foundry hook lifecycle documentation:
// https://foundryvtt.com/api/v13/modules/hookEvents.html
Hooks.once("init", () => {
  registerSettings();

  const module = game.modules.get(MODULE_ID);
  if (module) {
    module.api = Object.freeze({
      createNpcActors,
      generateNpcBatch,
      generateNpcBlueprint,
      openNpcDashboard,
      openNpcDialog,
      buildAiPrompt,
      buildPortraitPromptFromActor,
      registerPromptExtension,
      unregisterPromptExtension,
      getPromptExtensions,
      resolvePromptContext,
      resolvePromptComponents,
      clearPromptExtensionRegistry,
      registerRace,
      unregisterRace,
      registerRole,
      unregisterRole,
      registerNamingStyle,
      unregisterNamingStyle,
      registerHabitat,
      unregisterHabitat,
      registerGroupType,
      unregisterGroupType,
      getRaces,
      getRoles,
      getNamingStyles,
      getHabitats,
      getGroupTypes,
      getCatalogGroups
    });
  }

  logger.debug(`${MODULE_TITLE} ${MODULE_VERSION} initialized.`);
});

// ActorDirectory is an ApplicationV2 in Foundry VTT 13. The render hook keeps
// this integration isolated from private/protected core methods.
Hooks.on("renderActorDirectory", (app, html) => {
  injectActorDirectoryButton(app, html);
});

Hooks.once("ready", () => {
  if (game.system?.id !== "dnd5e") {
    logger.warn("The active system is not dnd5e; the module will remain inactive.");
  }
});


registerPortraitPromptHooks(Hooks);
