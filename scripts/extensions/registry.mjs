import { GROUP_TYPES, HABITATS, NAME_STYLES, RACES, ROLES } from "../generator/data.mjs";

const registries = {
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

function register(kind, id, config, noun) {
  const key = normalizeId(id, noun);
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error(`${noun} config must be an object.`);
  registries[kind].set(key, clone(config));
  return key;
}

function unregister(kind, id) {
  registries[kind].delete(String(id ?? ""));
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
}
