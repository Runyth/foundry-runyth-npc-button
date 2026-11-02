// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import { MODULE_ID } from "../constants.mjs";
import { GROUP_TYPES, HABITATS, NAME_STYLES, RACES, ROLES } from "../generator/data.mjs";

const registries = {
  races: new Map(),
  roles: new Map(),
  namingStyles: new Map(),
  habitats: new Map(),
  groupTypes: new Map()
};

const metadata = {
  races: new Map(),
  roles: new Map(),
  namingStyles: new Map(),
  habitats: new Map(),
  groupTypes: new Map()
};

function clone(value) {
  return globalThis.structuredClone ? globalThis.structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function normalizeId(id, noun) {
  const value = String(id ?? "").trim();
  if (!value) throw new Error(`${noun} id is required.`);
  if (!/^[a-z][a-z0-9-]*$/i.test(value)) throw new Error(`${noun} id must be alphanumeric and may include hyphens.`);
  return value;
}

function normalizeSourceMetadata(config) {
  const sourceModuleId = String(
    config?.sourceModuleId
    ?? config?.moduleId
    ?? config?.source?.moduleId
    ?? ""
  ).trim();
  if (!sourceModuleId || sourceModuleId === MODULE_ID) return null;
  const module = globalThis.game?.modules?.get?.(sourceModuleId);
  const sourceModuleTitle = String(
    config?.sourceModuleTitle
    ?? config?.moduleTitle
    ?? config?.source?.moduleTitle
    ?? module?.title
    ?? sourceModuleId
  ).trim() || sourceModuleId;
  return { sourceModuleId, sourceModuleTitle };
}

function register(kind, id, config, noun) {
  const key = normalizeId(id, noun);
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error(`${noun} config must be an object.`);
  registries[kind].set(key, clone(config));
  const source = normalizeSourceMetadata(config);
  if (source) metadata[kind].set(key, source);
  else metadata[kind].delete(key);
  return key;
}

function unregister(kind, id) {
  const key = String(id ?? "");
  registries[kind].delete(key);
  metadata[kind].delete(key);
}

function mergeCatalog(base, kind) {
  const merged = { ...base };
  for (const [id, config] of registries[kind]) merged[id] = clone(config);
  return merged;
}

export function getRaces() {
  return mergeCatalog(RACES, "races");
}

export function getRoles() {
  return mergeCatalog(ROLES, "roles");
}

export function getNamingStyles() {
  return mergeCatalog(NAME_STYLES, "namingStyles");
}

export function getHabitats() {
  return mergeCatalog(HABITATS, "habitats");
}

export function getGroupTypes() {
  return mergeCatalog(GROUP_TYPES, "groupTypes");
}

export function getCatalogGroups(entries, baseGroups = []) {
  const groups = [...baseGroups];
  for (const config of Object.values(entries)) {
    const group = String(config?.group ?? "").trim();
    if (group && !groups.includes(group)) groups.push(group);
  }
  return groups;
}

export function getCatalogEntryMetadata(kind, id) {
  return clone(metadata?.[kind]?.get(String(id ?? "")) ?? null);
}

export function getComplementaryCatalogModules() {
  const merged = new Map();
  for (const [kind, registry] of Object.entries(metadata)) {
    for (const contribution of registry.values()) {
      if (!contribution?.sourceModuleId) continue;
      const existing = merged.get(contribution.sourceModuleId) ?? {
        moduleId: contribution.sourceModuleId,
        title: contribution.sourceModuleTitle,
        counts: { races: 0, roles: 0, namingStyles: 0, habitats: 0, groupTypes: 0 },
        totalEntries: 0
      };
      existing.counts[kind] = (existing.counts[kind] ?? 0) + 1;
      existing.totalEntries += 1;
      merged.set(contribution.sourceModuleId, existing);
    }
  }
  return [...merged.values()].sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: "base" }));
}

export function getUnattributedCatalogEntries() {
  const entries = [];
  for (const [kind, registry] of Object.entries(registries)) {
    for (const [id, config] of registry.entries()) {
      if (metadata[kind].has(id)) continue;
      entries.push({
        kind,
        id,
        label: String(config?.label ?? id)
      });
    }
  }
  return entries.sort((left, right) => (
    left.kind.localeCompare(right.kind)
    || left.label.localeCompare(right.label, undefined, { sensitivity: "base" })
  ));
}

export function attributeCatalogEntries(sourceModuleId, contributions = {}, { sourceModuleTitle = "" } = {}) {
  const moduleId = String(sourceModuleId ?? "").trim();
  if (!moduleId || moduleId === MODULE_ID) throw new Error("A complementary source module id is required.");
  const title = String(
    sourceModuleTitle
    || globalThis.game?.modules?.get?.(moduleId)?.title
    || moduleId
  ).trim() || moduleId;
  let attributed = 0;
  for (const [kind, ids] of Object.entries(contributions ?? {})) {
    if (!registries[kind]) continue;
    for (const id of Array.isArray(ids) ? ids : []) {
      const key = String(id ?? "").trim();
      if (!key || !registries[kind].has(key)) continue;
      metadata[kind].set(key, { sourceModuleId: moduleId, sourceModuleTitle: title });
      attributed += 1;
    }
  }
  return attributed;
}

export function registerRace(id, config) {
  return register("races", id, config, "Race");
}

export function registerRole(id, config) {
  return register("roles", id, config, "Role");
}

export function registerNamingStyle(id, config) {
  return register("namingStyles", id, config, "Naming style");
}

export function registerHabitat(id, config) {
  return register("habitats", id, config, "Habitat");
}

export function registerGroupType(id, config) {
  return register("groupTypes", id, config, "Group type");
}

export function unregisterRace(id) {
  unregister("races", id);
}

export function unregisterRole(id) {
  unregister("roles", id);
}

export function unregisterNamingStyle(id) {
  unregister("namingStyles", id);
}

export function unregisterHabitat(id) {
  unregister("habitats", id);
}

export function unregisterGroupType(id) {
  unregister("groupTypes", id);
}

export function clearExtensionRegistry() {
  for (const registry of Object.values(registries)) registry.clear();
  for (const registry of Object.values(metadata)) registry.clear();
}
