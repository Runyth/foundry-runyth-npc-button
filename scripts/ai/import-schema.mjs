// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
/**
 * Explicitly allowlisted dnd5e-automation (Midi-class) native ActiveEffect import.
 * No macro/script text or arbitrary document paths are ever evaluated or copied.
 * The referenced automation modules (v13) are optional: imported effects remain data when disabled.
 * @see https://gitlab.com/tposney/midi-qol/-/blob/v13/FLAGS.md
 * @see https://gitlab.com/tposney/midi-qol/-/blob/v13/README.md
 */
const MIDI_FLAG_KEYS = new Set([
  "flags.midi-qol.advantage.attack.all",
  "flags.midi-qol.advantage.attack.mwak",
  "flags.midi-qol.advantage.attack.rwak",
  "flags.midi-qol.grants.advantage.attack.all",
  "flags.midi-qol.grants.advantage.attack.mwak",
  "flags.midi-qol.grants.advantage.attack.rwak",
  "flags.midi-qol.disadvantage.attack.all",
  "flags.midi-qol.disadvantage.attack.mwak",
  "flags.midi-qol.disadvantage.attack.rwak",
  "flags.midi-qol.grants.disadvantage.attack.all",
  "flags.midi-qol.grants.disadvantage.attack.mwak",
  "flags.midi-qol.grants.disadvantage.attack.rwak"
]);
const NATIVE_KEYS = new Set([
  "system.attributes.ac.bonus",
  "system.attributes.movement.walk",
  "system.bonuses.mwak.damage",
  "system.bonuses.rwak.damage"
]);
const CONDITION_KEYS = new Set(["prone", "grappled", "restrained", "frightened", "blinded", "deafened", "poisoned"]);
const DAE_EXPIRY = new Set(["1Attack", "1Action", "1Hit", "isAttacked", "isHit", "isDamaged", "isSave", "isSaveSuccess", "isSaveFailure"]);
const VALID_MODES = new Set(["CUSTOM", "ADD", "OVERRIDE"]);
const MODES = { CUSTOM: 0, ADD: 2, OVERRIDE: 5 };

function invalid(path, reason) { throw new Error(`${path}: ${reason}`); }
function plainObject(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(path, "expected an object");
  return value;
}
function safeString(value, path, max=120) {
  if (typeof value !== "string" || !value.trim() || value.length > max) invalid(path, `expected a nonempty string <= ${max} characters`);
  return value.trim();
}
function htmlEscape(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function limitedArray(value, path, max) {
  if (!Array.isArray(value) || value.length > max) invalid(path, `expected <= ${max} array entries`);
  return value;
}
function effectId(a, b, c) {
  return `rnm${((a + 1) * 1000000 + (b + 1) * 100 + c).toString(36).padStart(13, "0")}`;
}
function validateChange(raw, path) {
  const change = plainObject(raw, path);
  const key = safeString(change.key, `${path}.key`, 128);
  if (!MIDI_FLAG_KEYS.has(key) && !NATIVE_KEYS.has(key)) invalid(`${path}.key`, `unsupported effect field ${key}`);
  const mode = change.mode ?? (MIDI_FLAG_KEYS.has(key) ? "CUSTOM" : "ADD");
  if (!VALID_MODES.has(mode)) invalid(`${path}.mode`, `unsupported mode ${mode}`);
  if (MIDI_FLAG_KEYS.has(key) && mode !== "CUSTOM") invalid(`${path}.mode`, "Midi flags must use CUSTOM mode");
  const value = String(change.value ?? "");
  if (MIDI_FLAG_KEYS.has(key) ? !/^(?:0|1|true|false)$/i.test(value) : !/^[+-]?\d{1,3}$/.test(value)) {
    invalid(`${path}.value`, "value must be a boolean Midi flag or an integer native modifier");
  }
  return { key, mode: MODES[mode], value, priority: 20 };
}
function effectFrom(raw, actorIndex, actionIndex, effectIndex) {
  const path = `Actor ${actorIndex + 1}.combat.actions[${actionIndex}].midi.effects[${effectIndex}]`;
  const effect = plainObject(raw, path);
  const name = safeString(effect.name, `${path}.name`, 100);
  const statuses = limitedArray(effect.statuses ?? [], `${path}.statuses`, 7).map(s => {
    if (!CONDITION_KEYS.has(s)) invalid(`${path}.statuses`, `unsupported condition ${s}`);
    return s;
  });
  const changes = limitedArray(effect.changes ?? [], `${path}.changes`, 12).map((c, n) => validateChange(c, `${path}.changes[${n}]`));
  if (!changes.length && !statuses.length) invalid(path, "effect must have changes or statuses");
  const specialDuration = limitedArray(effect.specialDuration ?? [], `${path}.specialDuration`, 4).map(s => {
    if (!DAE_EXPIRY.has(s)) invalid(`${path}.specialDuration`, `unsupported expiry ${s}`);
    return s;
  });
  const rounds = effect.rounds;
  if (rounds !== undefined && (!Number.isInteger(rounds) || rounds < 1 || rounds > 10)) invalid(`${path}.rounds`, "expected 1..10 rounds");
  if (effect.onSave !== undefined && typeof effect.onSave !== "boolean") invalid(`${path}.onSave`, "expected boolean");
  const source = {
    _id: effectId(actorIndex, actionIndex, effectIndex + 1), name,
    img: "icons/svg/aura.svg", transfer: false, disabled: false,
    statuses, changes, duration: rounds ? { rounds } : {},
    flags: { "runyth-npc-button": { midiImported: true } }
  };
  if (specialDuration.length) source.flags.dae = { specialDuration };
  return { source, onSave: effect.onSave ?? false };
}

/** Attach effects to the specific native dnd5e activity, never to the entire Actor. */
export function applySafeMidiEffects(midi, item, activity, actorIndex, actionIndex) {
  if (midi === undefined || midi === null) return;
  const path = `Actor ${actorIndex + 1}.combat.actions[${actionIndex}].midi`;
  const input = plainObject(midi, path);
  for (const key of Object.keys(input)) if (key !== "effects" && key !== "target") invalid(path, `unsupported property ${key}`);
  if (input.target !== undefined) {
    if (input.target !== "self" && input.target !== "creature") invalid(`${path}.target`, "expected self or creature");
    activity.target = {
      ...(activity.target ?? {}), override: true,
      affects: { type: input.target === "self" ? "self" : "creature",
        ...(activity.target?.affects?.count ? { count: activity.target.affects.count } : {}) },
      prompt: input.target !== "self"
    };
  }
  const effects = limitedArray(input.effects ?? [], `${path}.effects`, 8);
  for (let i=0; i<effects.length; i++) {
    const { source, onSave } = effectFrom(effects[i], actorIndex, actionIndex, i);
    item.effects.push(source);
    activity.effects ??= [];
    activity.effects.push({ _id: source._id, onSave });
  }
}
