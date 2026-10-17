/**
 * One narrowly scoped rules exception not expressible as a native attack/save/heal/utility activity:
 * Relentless consumes its single use when an NPC would be reduced to 0 HP by non-massive damage.
 * Uses the dnd5e 5.3 preApplyDamage hook, so the HP and consumed flag are updated atomically.
 * Works with linked Actors and synthetic (unlinked) Token Actors; no specific NPC name dependency.
 * The hook only handles damage processed by Actor5e.applyDamage (including Midi's normal damage workflow).
 * https://github.com/foundryvtt/dnd5e/blob/release-5.3.3/module/documents/actor/actor.mjs
 */
import { MODULE_ID } from "../constants.mjs";

const FLAG = `flags.${MODULE_ID}.relentlessSpent`;

export function interceptRelentless(actor, amount, updates) {
  if (!actor?.getFlag?.(MODULE_ID, "relentlessOnce")) return;
  if (actor.getFlag(MODULE_ID, "relentlessSpent")) return;
  if (!updates || typeof updates !== "object") return;
  const oldHp = Number(actor.system?.attributes?.hp?.value);
  const maxHp = Number(actor.system?.attributes?.hp?.max);
  const tempHp = Number(actor.system?.attributes?.hp?.temp ?? 0);
  const afterHp = Number(updates["system.attributes.hp.value"]);
  if (![oldHp, maxHp, tempHp, afterHp, Number(amount)].every(Number.isFinite)) return;
  if (oldHp <= 0 || maxHp < 1 || afterHp !== 0 || amount <= 0) return;
  // Massive-damage instant death when damage remaining after temp HP reduction
  // equals or exceeds the creature's current HP plus its maximum HP.
  if (Math.max(0, amount - tempHp) >= oldHp + maxHp) return;
  updates["system.attributes.hp.value"] = 1;
  updates[FLAG] = true;
}

async function syncRelentlessItem(actor, spent) {
  if (!actor?.isOwner || !actor?.items || !actor.updateEmbeddedDocuments) return;
  const changes = [];
  for (const item of actor.items) {
    if (item.type !== "feat" || item.name !== "Relentless (Once)") continue;
    const activities = item.system?.activities;
    if (!activities) continue;
    for (const activity of activities.values?.() ?? Object.values(activities)) {
      if (activity.name !== "Relentless (Once)" || !activity.uses) continue;
      if (activity.uses.spent !== Number(spent)) {
        changes.push({ _id: item.id, [`system.activities.${activity.id}.uses.spent`]: Number(spent) });
      }
    }
  }
  if (changes.length) await actor.updateEmbeddedDocuments("Item", changes);
}

export function registerRelentlessHooks(hooks) {
  hooks.on("dnd5e.preApplyDamage", interceptRelentless);
  hooks.on("dnd5e.applyDamage", (actor) => {
    if (!actor?.getFlag?.(MODULE_ID, "relentlessSpent")) return;
    void syncRelentlessItem(actor, true).catch(console.error);
  });
  // A deliberately narrow reset: only when a fresh Combat is created and only for
  // its combatants. Round transitions do NOT refresh this once-per-encounter use.
  hooks.on("combatStart", async (combat) => {
    if (!globalThis.game?.user?.isGM) return;
    const actors = new Set();
    for (const combatant of combat?.combatants ?? []) {
      const actor = combatant.actor;
      if (!actor?.getFlag?.(MODULE_ID, "relentlessOnce")) continue;
      if (actors.has(actor.uuid)) continue;
      actors.add(actor.uuid);
      if (actor.getFlag(MODULE_ID, "relentlessSpent")) {
        await actor.unsetFlag(MODULE_ID, "relentlessSpent");
      }
      await syncRelentlessItem(actor, false);
    }
  });
}
