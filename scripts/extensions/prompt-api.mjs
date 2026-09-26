const registries = {
  promptExtensions: new Map()
};

function clone(value) {
  return globalThis.structuredClone ? globalThis.structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function normalizeId(id) {
  const value = String(id ?? "").trim();
  if (!value) throw new Error("Prompt extension id is required.");
  if (!/^[a-z][a-z0-9-]*$/i.test(value)) throw new Error("Prompt extension id must be alphanumeric and may include hyphens.");
  return value;
}

function normalizePriority(value) {
  const priority = Number(value);
  return Number.isFinite(priority) ? priority : 0;
}

function arrayify(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map((entry) => String(entry ?? "").trim()).filter(Boolean);
  const text = String(value ?? "").trim();
  return text ? [text] : [];
}

function normalizeComponentBlock(components = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(components)) normalized[key] = arrayify(value);
  return normalized;
}

function normalizeTargetConfig(config = {}) {
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("Prompt target config must be an object.");
  const normalized = { ...config };
  if (config.components !== undefined) normalized.components = normalizeComponentBlock(config.components);
  if (config.mergeMode && typeof config.mergeMode === "object" && !Array.isArray(config.mergeMode)) normalized.mergeMode = { ...config.mergeMode };
  return normalized;
}

function sortedEntries(target = null) {
  return Array.from(registries.promptExtensions.entries())
    .map(([id, entry]) => ({ id, ...entry, targetConfig: target ? entry.targets?.[target] ?? null : null }))
    .filter((entry) => !target || entry.targetConfig)
    .sort((left, right) => (left.priority - right.priority) || left.id.localeCompare(right.id));
}

export function registerPromptExtension(id, config) {
  const key = normalizeId(id);
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("Prompt extension config must be an object.");
  const targets = {};
  for (const [target, targetConfig] of Object.entries(config.targets ?? {})) targets[target] = normalizeTargetConfig(targetConfig);
  registries.promptExtensions.set(key, {
    label: String(config.label ?? key),
    priority: normalizePriority(config.priority),
    targets
  });
  return key;
}

export function unregisterPromptExtension(id) {
  registries.promptExtensions.delete(String(id ?? ""));
}

export function clearPromptExtensionRegistry() {
  registries.promptExtensions.clear();
}

export function getPromptExtensions(target = null) {
  return sortedEntries(target).map((entry) => ({
    id: entry.id,
    label: entry.label,
    priority: entry.priority,
    targets: clone(entry.targets)
  }));
}

export function resolvePromptContext(target, context = {}) {
  let resolved = clone(context);
  for (const entry of sortedEntries(target)) {
    const transform = entry.targetConfig?.transformContext;
    if (typeof transform !== "function") continue;
    const next = transform(clone(resolved));
    if (next !== undefined) resolved = next;
  }
  return resolved;
}

export function resolvePromptComponents(target, defaults = {}, context = {}) {
  let resolved = {};
  for (const [key, value] of Object.entries(defaults ?? {})) resolved[key] = arrayify(value);
  const resolvedContext = resolvePromptContext(target, context);
  for (const entry of sortedEntries(target)) {
    const targetConfig = entry.targetConfig ?? {};
    const componentBlock = targetConfig.components ?? {};
    for (const [key, incoming] of Object.entries(componentBlock)) {
      const current = arrayify(resolved[key]);
      const items = arrayify(incoming);
      const mergeRule = typeof targetConfig.mergeMode === "string"
        ? targetConfig.mergeMode
        : String(targetConfig.mergeMode?.[key] ?? "replace");
      if (mergeRule === "append") resolved[key] = [...current, ...items];
      else if (mergeRule === "prepend") resolved[key] = [...items, ...current];
      else if (mergeRule === "clear") resolved[key] = [];
      else resolved[key] = items;
    }
    if (typeof targetConfig.transformComponents === "function") {
      const next = targetConfig.transformComponents(clone(resolved), clone(resolvedContext));
      if (next && typeof next === "object" && !Array.isArray(next)) {
        resolved = {};
        for (const [key, value] of Object.entries(next)) resolved[key] = arrayify(value);
      }
    }
  }
  return resolved;
}

export function composePrompt(target, { context = {}, defaults = null, buildDefault } = {}) {
  if (typeof buildDefault !== "function") throw new Error("composePrompt requires a buildDefault function.");
  const resolvedContext = resolvePromptContext(target, context);
  const resolvedDefaults = typeof defaults === "function" ? defaults(clone(resolvedContext)) : defaults;
  const resolvedComponents = resolvedDefaults ? resolvePromptComponents(target, resolvedDefaults, resolvedContext) : null;
  const entries = sortedEntries(target);
  const composerEntry = [...entries].reverse().find((entry) => typeof entry.targetConfig?.compose === "function");
  let prompt;
  if (composerEntry) {
    prompt = composerEntry.targetConfig.compose({
      context: clone(resolvedContext),
      components: resolvedComponents ? clone(resolvedComponents) : null,
      buildDefault: (overrideContext = resolvedContext, overrideComponents = resolvedComponents) => buildDefault(overrideContext, overrideComponents)
    });
  } else {
    prompt = buildDefault(resolvedContext, resolvedComponents);
  }
  let text = String(prompt ?? "").trim();
  for (const entry of entries) {
    const transform = entry.targetConfig?.transformText;
    if (typeof transform !== "function") continue;
    const next = transform(text, clone(resolvedContext), resolvedComponents ? clone(resolvedComponents) : null);
    if (next !== undefined) text = String(next ?? "").trim();
  }
  return text;
}
