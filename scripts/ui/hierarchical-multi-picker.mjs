import { escapeAttribute } from "../utils/html.mjs";

const ROW_HEIGHT = 38;
const OVERSCAN = 6;
const OPEN_EVENT = "runyth-npc-button:picker-open";

function normalized(value) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

export function hierarchicalMultiPickerMarkup({
  id,
  name,
  label,
  hint = "",
  values = [],
  placeholder = "Choose…",
  showBulkActions = false,
  selectAllText = "Select all",
  clearText = "Clear"
}) {
  const hintId = hint ? `${id}-hint` : "";
  return `
    <div class="runyth-npc-button__field runyth-npc-button__picker" data-hierarchical-multi-picker="${escapeAttribute(id)}">
      <label id="${escapeAttribute(id)}-label">${escapeAttribute(label)}</label>
      <input type="hidden" name="${escapeAttribute(name)}" value="${escapeAttribute(JSON.stringify(values))}" data-multi-picker-value>
      <button
        type="button"
        class="runyth-npc-button__picker-trigger"
        data-multi-picker-trigger
        aria-labelledby="${escapeAttribute(id)}-label"
        aria-expanded="false"
        ${hintId ? `aria-describedby="${escapeAttribute(hintId)}"` : ""}
      >
        <span data-multi-picker-display class="${values.length ? "" : "is-placeholder"}">${escapeAttribute(placeholder)}</span>
        <span class="runyth-npc-button__multi-count" data-multi-picker-count>${values.length || ""}</span>
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
      <div class="runyth-npc-button__picker-panel" data-multi-picker-panel hidden>
        <div class="runyth-npc-button__picker-search-row">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input type="search" data-multi-picker-search autocomplete="off" spellcheck="false">
        </div>
        <div class="runyth-npc-button__picker-viewport" data-multi-picker-viewport role="listbox" aria-multiselectable="true" tabindex="-1">
          <div class="runyth-npc-button__picker-spacer" data-multi-picker-spacer></div>
          <div class="runyth-npc-button__picker-window" data-multi-picker-window></div>
        </div>
        <div class="runyth-npc-button__picker-empty" data-multi-picker-empty hidden></div>
        <div class="runyth-npc-button__picker-footer">
          ${showBulkActions ? `<div class="runyth-npc-button__picker-bulk"><button type="button" data-multi-picker-select-all>${escapeAttribute(selectAllText)}</button><button type="button" data-multi-picker-clear>${escapeAttribute(clearText)}</button></div>` : ""}
          <button type="button" data-multi-picker-done>${escapeAttribute("Done")}</button>
        </div>
      </div>
      ${hint ? `<small id="${escapeAttribute(hintId)}">${escapeAttribute(hint)}</small>` : ""}
    </div>
  `;
}

function rowSearchText(row) {
  return normalized([row.label, row.description, row.searchText].filter(Boolean).join(" "));
}

function prepareRows(rows) {
  return rows.map((row) => (row.kind === "group" ? row : { ...row, searchIndex: rowSearchText(row) }));
}

function parseSelection(input) {
  try {
    const parsed = JSON.parse(input.value || "[]");
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

export function mountHierarchicalMultiPicker(root, config, signal) {
  if (!root) return null;

  const trigger = root.querySelector("[data-multi-picker-trigger]");
  const input = root.querySelector("[data-multi-picker-value]");
  const display = root.querySelector("[data-multi-picker-display]");
  const count = root.querySelector("[data-multi-picker-count]");
  const panel = root.querySelector("[data-multi-picker-panel]");
  const search = root.querySelector("[data-multi-picker-search]");
  const viewport = root.querySelector("[data-multi-picker-viewport]");
  const spacer = root.querySelector("[data-multi-picker-spacer]");
  const windowElement = root.querySelector("[data-multi-picker-window]");
  const empty = root.querySelector("[data-multi-picker-empty]");
  const done = root.querySelector("[data-multi-picker-done]");
  const selectAll = root.querySelector("[data-multi-picker-select-all]");
  const clear = root.querySelector("[data-multi-picker-clear]");
  if (!trigger || !input || !display || !count || !panel || !search || !viewport || !spacer || !windowElement || !empty || !done) return null;

  const baseRows = prepareRows(Array.isArray(config.items) ? config.items : []);
  const customRows = new Map();
  let selected = parseSelection(input);
  let activeRows = baseRows;
  let open = false;
  let searchFrame = null;

  search.placeholder = config.searchPlaceholder ?? "Search…";
  empty.textContent = config.emptyText ?? "No matching options.";
  done.textContent = config.doneText ?? "Done";

  function allRows() {
    const custom = [...customRows.values()];
    if (!custom.length) return baseRows;
    return [
      { kind: "group", id: "group:custom-selected", label: config.customGroupLabel ?? "Custom", depth: 0 },
      ...custom,
      ...baseRows
    ];
  }

  function labelFor(id) {
    return allRows().find((row) => row.kind !== "group" && row.id === id)?.display
      ?? allRows().find((row) => row.kind !== "group" && row.id === id)?.label
      ?? String(id).replace(/^custom:/, "");
  }

  function updateSummary() {
    const labels = [...selected].map(labelFor).filter(Boolean);
    const summary = labels.length === 0
      ? (config.placeholder ?? "Choose…")
      : labels.length <= 3
        ? labels.join(", ")
        : `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
    display.textContent = summary;
    display.classList.toggle("is-placeholder", labels.length === 0);
    count.textContent = labels.length ? String(labels.length) : "";
    input.value = JSON.stringify([...selected]);
  }

  function setOpen(next) {
    open = Boolean(next);
    panel.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
    trigger.querySelector("i")?.classList.toggle("fa-chevron-up", open);
    trigger.querySelector("i")?.classList.toggle("fa-chevron-down", !open);
    if (open) {
      document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: root }));
      queueMicrotask(() => search.focus());
      renderRows(true);
    }
  }

  function customCandidate(query) {
    const text = String(query ?? "").trim();
    if (!config.allowCustom || !text) return null;
    const exact = allRows().some((row) => row.kind !== "group" && normalized(row.label) === normalized(text));
    if (exact) return null;
    const id = config.customValueBuilder(text);
    return {
      kind: "option",
      id,
      label: text,
      display: text,
      description: config.customDescription?.(text) ?? "",
      depth: 0,
      custom: true,
      searchIndex: normalized(text)
    };
  }

  function updateActiveRows() {
    const rows = allRows();
    const needle = normalized(search.value);
    const filtered = needle
      ? rows.filter((row) => row.kind !== "group" && row.searchIndex?.includes(needle))
      : rows;
    const candidate = customCandidate(search.value);
    activeRows = candidate ? [candidate, ...filtered] : filtered;
    empty.hidden = activeRows.length > 0;
    viewport.hidden = activeRows.length === 0;
    spacer.style.height = `${activeRows.length * ROW_HEIGHT}px`;
    viewport.scrollTop = 0;
    renderRows(true);
  }

  function makeRow(row, index) {
    if (row.kind === "group") {
      const group = document.createElement("div");
      group.className = "runyth-npc-button__picker-group";
      group.style.height = `${ROW_HEIGHT}px`;
      group.style.paddingInlineStart = `${Math.max(0, Number(row.depth) || 0) * 14 + 8}px`;
      group.textContent = row.label;
      return group;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "runyth-npc-button__picker-option runyth-npc-button__picker-option--multi";
    button.dataset.multiPickerIndex = String(index);
    button.style.height = `${ROW_HEIGHT}px`;
    button.style.paddingInlineStart = `${Math.max(0, Number(row.depth) || 0) * 14 + 8}px`;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(selected.has(row.id)));
    if (selected.has(row.id)) button.classList.add("is-selected");
    if (row.custom) button.classList.add("is-custom");

    const marker = document.createElement("i");
    marker.className = selected.has(row.id) ? "fa-solid fa-square-check" : "fa-regular fa-square";
    marker.setAttribute("aria-hidden", "true");
    button.append(marker);

    const text = document.createElement("span");
    text.className = "runyth-npc-button__picker-option-copy";
    const primary = document.createElement("span");
    primary.className = "runyth-npc-button__picker-option-label";
    primary.textContent = row.label;
    text.append(primary);
    if (row.description) {
      const secondary = document.createElement("small");
      secondary.className = "runyth-npc-button__picker-option-description";
      secondary.textContent = row.description;
      text.append(secondary);
    }
    button.append(text);
    return button;
  }

  function renderRows(force = false) {
    if (!open && !force) return;
    const viewportHeight = Math.max(ROW_HEIGHT, viewport.clientHeight || 250);
    const start = Math.max(0, Math.floor(viewport.scrollTop / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + (OVERSCAN * 2);
    const end = Math.min(activeRows.length, start + visibleCount);
    windowElement.style.transform = `translateY(${start * ROW_HEIGHT}px)`;
    const fragment = document.createDocumentFragment();
    for (let index = start; index < end; index += 1) fragment.append(makeRow(activeRows[index], index));
    windowElement.replaceChildren(fragment);
  }

  function toggleRow(row) {
    if (!row || row.kind === "group") return;
    if (row.custom) customRows.set(row.id, row);
    if (selected.has(row.id)) selected.delete(row.id);
    else selected.add(row.id);
    if (selected.size === 0 && config.requireOne) selected.add(config.fallbackValue ?? baseRows.find((item) => item.kind !== "group")?.id);
    updateSummary();
    input.dispatchEvent(new Event("change", { bubbles: true }));
    updateActiveRows();
  }

  // Restore custom selections that are not part of the base catalog.
  for (const id of selected) {
    if (baseRows.some((row) => row.kind !== "group" && row.id === id)) continue;
    if (id.startsWith("custom:")) {
      const label = id.slice(7).trim() || id;
      customRows.set(id, { kind: "option", id, label, display: label, description: config.customDescription?.(label) ?? "", depth: 1, custom: true, searchIndex: normalized(label) });
    }
  }

  trigger.addEventListener("click", () => setOpen(!open), { signal });
  selectAll?.addEventListener("click", () => {
    selected = new Set(baseRows.filter((row) => row.kind !== "group").map((row) => String(row.id)));
    updateSummary();
    input.dispatchEvent(new Event("change", { bubbles: true }));
    updateActiveRows();
  }, { signal });
  clear?.addEventListener("click", () => {
    selected.clear();
    if (config.requireOne) selected.add(config.fallbackValue ?? baseRows.find((item) => item.kind !== "group")?.id);
    updateSummary();
    input.dispatchEvent(new Event("change", { bubbles: true }));
    updateActiveRows();
  }, { signal });
  done.addEventListener("click", () => setOpen(false), { signal });
  search.addEventListener("input", () => {
    if (searchFrame !== null) window.cancelAnimationFrame(searchFrame);
    searchFrame = window.requestAnimationFrame(() => {
      searchFrame = null;
      updateActiveRows();
    });
  }, { signal });
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      trigger.focus();
    }
  }, { signal });
  viewport.addEventListener("scroll", () => renderRows(), { signal, passive: true });
  windowElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-multi-picker-index]");
    if (!button) return;
    toggleRow(activeRows[Number(button.dataset.multiPickerIndex)]);
  }, { signal });
  document.addEventListener(OPEN_EVENT, (event) => {
    if (event.detail !== root) setOpen(false);
  }, { signal });
  document.addEventListener("pointerdown", (event) => {
    if (open && !root.contains(event.target)) setOpen(false);
  }, { signal });
  signal?.addEventListener("abort", () => {
    if (searchFrame !== null) window.cancelAnimationFrame(searchFrame);
  }, { once: true });

  updateSummary();
  updateActiveRows();
  setOpen(false);

  return {
    close: () => setOpen(false),
    getValues: () => [...selected],
    setValues(values) {
      selected = new Set((Array.isArray(values) ? values : []).map(String));
      updateSummary();
      updateActiveRows();
    }
  };
}
