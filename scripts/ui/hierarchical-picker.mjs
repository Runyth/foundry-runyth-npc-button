import { escapeAttribute } from "../utils/html.mjs";

const ROW_HEIGHT = 38;
const OVERSCAN = 6;
const OPEN_EVENT = "runyth-npc-button:picker-open";

function normalized(value) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

export function hierarchicalPickerMarkup({
  id,
  name,
  label,
  hint = "",
  value = "",
  display = "",
  placeholder = "Choose…"
}) {
  const hintId = hint ? `${id}-hint` : "";
  return `
    <div class="runyth-npc-button__field runyth-npc-button__picker" data-hierarchical-picker="${escapeAttribute(id)}">
      <label id="${escapeAttribute(id)}-label">${escapeAttribute(label)}</label>
      <input type="hidden" name="${escapeAttribute(name)}" value="${escapeAttribute(value)}" data-picker-value>
      <button
        type="button"
        class="runyth-npc-button__picker-trigger"
        data-picker-trigger
        aria-labelledby="${escapeAttribute(id)}-label"
        aria-expanded="false"
        ${hintId ? `aria-describedby="${escapeAttribute(hintId)}"` : ""}
      >
        <span data-picker-display class="${display ? "" : "is-placeholder"}">${escapeAttribute(display || placeholder)}</span>
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
      <div class="runyth-npc-button__picker-panel" data-picker-panel hidden>
        <div class="runyth-npc-button__picker-search-row">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input type="search" data-picker-search autocomplete="off" spellcheck="false">
        </div>
        <div class="runyth-npc-button__picker-viewport" data-picker-viewport role="listbox" tabindex="-1">
          <div class="runyth-npc-button__picker-spacer" data-picker-spacer></div>
          <div class="runyth-npc-button__picker-window" data-picker-window></div>
        </div>
        <div class="runyth-npc-button__picker-empty" data-picker-empty hidden></div>
      </div>
      ${hint ? `<small id="${escapeAttribute(hintId)}">${escapeAttribute(hint)}</small>` : ""}
    </div>
  `;
}

function rowSearchText(row) {
  return normalized([row.label, row.description, row.searchText].filter(Boolean).join(" "));
}

function prepareRows(rows) {
  return rows.map((row) => (row.kind === "group"
    ? row
    : { ...row, searchIndex: rowSearchText(row) }));
}

function filterRows(rows, query) {
  const needle = normalized(query);
  if (!needle) return rows;

  return rows.filter((row) => row.kind !== "group" && row.searchIndex.includes(needle));
}

function customRow(query, config, rows) {
  const text = String(query ?? "").trim();
  if (!config.allowCustom || !text) return null;
  const exact = rows.some((row) => row.kind !== "group" && normalized(row.label) === normalized(text));
  if (exact) return null;

  return {
    kind: "option",
    id: config.customValueBuilder(text),
    label: text,
    display: text,
    description: config.customDescription?.(text) ?? "",
    depth: 0,
    custom: true
  };
}

function selectedDisplay(rows, value, fallback) {
  const match = rows.find((row) => row.kind !== "group" && row.id === value);
  return match?.display ?? match?.label ?? fallback;
}

/**
 * Mount a reusable, scrollable and virtualized hierarchical picker.
 * Only visible rows plus a small overscan buffer exist in the DOM, so folder
 * trees and future long option catalogs remain responsive.
 */
export function mountHierarchicalPicker(root, config, signal) {
  if (!root) return null;

  const trigger = root.querySelector("[data-picker-trigger]");
  const input = root.querySelector("[data-picker-value]");
  const display = root.querySelector("[data-picker-display]");
  const panel = root.querySelector("[data-picker-panel]");
  const search = root.querySelector("[data-picker-search]");
  const viewport = root.querySelector("[data-picker-viewport]");
  const spacer = root.querySelector("[data-picker-spacer]");
  const windowElement = root.querySelector("[data-picker-window]");
  const empty = root.querySelector("[data-picker-empty]");
  if (!trigger || !input || !display || !panel || !search || !viewport || !spacer || !windowElement || !empty) return null;

  const rows = prepareRows(Array.isArray(config.items) ? config.items : []);
  let activeRows = rows;
  let open = false;
  let searchFrame = null;

  search.placeholder = config.searchPlaceholder ?? "Search…";
  empty.textContent = config.emptyText ?? "No matching options.";

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

  function updateActiveRows() {
    const filtered = filterRows(rows, search.value);
    const custom = customRow(search.value, config, rows);
    activeRows = custom ? [custom, ...filtered] : filtered;
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
    button.className = "runyth-npc-button__picker-option";
    button.dataset.pickerIndex = String(index);
    button.style.height = `${ROW_HEIGHT}px`;
    button.style.paddingInlineStart = `${Math.max(0, Number(row.depth) || 0) * 14 + 8}px`;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(row.id === input.value));
    if (row.id === input.value) button.classList.add("is-selected");
    if (row.custom) button.classList.add("is-custom");

    const primary = document.createElement("span");
    primary.className = "runyth-npc-button__picker-option-label";
    primary.textContent = row.label;
    button.append(primary);

    if (row.description) {
      const secondary = document.createElement("small");
      secondary.className = "runyth-npc-button__picker-option-description";
      secondary.textContent = row.description;
      button.append(secondary);
    }
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
    for (let index = start; index < end; index += 1) {
      fragment.append(makeRow(activeRows[index], index));
    }
    windowElement.replaceChildren(fragment);
  }

  function selectRow(row) {
    if (!row || row.kind === "group") return;
    input.value = row.id;
    display.textContent = row.display ?? row.label;
    display.classList.remove("is-placeholder");
    input.dispatchEvent(new Event("change", { bubbles: true }));
    search.value = "";
    activeRows = rows;
    setOpen(false);
  }

  trigger.addEventListener("click", () => setOpen(!open), { signal });
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
    const button = event.target.closest("[data-picker-index]");
    if (!button) return;
    const row = activeRows[Number(button.dataset.pickerIndex)];
    selectRow(row);
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

  const initial = selectedDisplay(rows, input.value, display.textContent);
  if (initial) display.textContent = initial;
  updateActiveRows();
  setOpen(false);

  return {
    close: () => setOpen(false),
    setValue(value, label) {
      input.value = value;
      display.textContent = label ?? selectedDisplay(rows, value, config.placeholder ?? "Choose…");
      display.classList.toggle("is-placeholder", !input.value);
    }
  };
}
