// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import { escapeAttribute } from "../utils/html.mjs";

const ROW_HEIGHT = 44;
const OVERSCAN = 6;

function normalized(value) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

function safeCounts(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(Object.entries(source).map(([id, count]) => [String(id), Math.max(0, Math.trunc(Number(count) || 0))]));
}

export function virtualQuotaEditorMarkup({
  id,
  name,
  label,
  hint = "",
  counts = {},
  searchPlaceholder = "Search…",
  balanceText = "Distribute evenly",
  emptyText = "No selected entries."
}) {
  const hintId = hint ? `${id}-hint` : "";
  return `
    <div class="runyth-npc-button__quota-editor" data-virtual-quota-editor="${escapeAttribute(id)}">
      <div class="runyth-npc-button__label-row">
        <strong id="${escapeAttribute(id)}-label">${escapeAttribute(label)}</strong>
        ${hint ? `<small id="${escapeAttribute(hintId)}">${escapeAttribute(hint)}</small>` : ""}
      </div>
      <input type="hidden" name="${escapeAttribute(name)}" value="${escapeAttribute(JSON.stringify(safeCounts(counts)))}" data-quota-value>
      <div class="runyth-npc-button__quota-toolbar">
        <div class="runyth-npc-button__picker-search-row">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input type="search" data-quota-search autocomplete="off" spellcheck="false" placeholder="${escapeAttribute(searchPlaceholder)}" aria-labelledby="${escapeAttribute(id)}-label">
        </div>
        <button type="button" data-quota-balance>${escapeAttribute(balanceText)}</button>
      </div>
      <div class="runyth-npc-button__quota-summary" data-quota-summary role="status" aria-live="polite"></div>
      <div class="runyth-npc-button__picker-viewport runyth-npc-button__quota-viewport" data-quota-viewport tabindex="-1">
        <div class="runyth-npc-button__picker-spacer" data-quota-spacer></div>
        <div class="runyth-npc-button__picker-window" data-quota-window></div>
      </div>
      <div class="runyth-npc-button__picker-empty" data-quota-empty hidden>${escapeAttribute(emptyText)}</div>
    </div>
  `;
}

export function balancedQuotaCounts(ids, total) {
  const unique = [...new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean))];
  const target = Math.max(0, Math.trunc(Number(total) || 0));
  if (!unique.length) return {};
  const base = Math.floor(target / unique.length);
  let remainder = target % unique.length;
  const counts = {};
  for (const id of unique) {
    counts[id] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
  }
  return counts;
}

export function mountVirtualQuotaEditor(root, config, signal) {
  if (!root) return null;
  const input = root.querySelector("[data-quota-value]");
  const search = root.querySelector("[data-quota-search]");
  const balance = root.querySelector("[data-quota-balance]");
  const summary = root.querySelector("[data-quota-summary]");
  const viewport = root.querySelector("[data-quota-viewport]");
  const spacer = root.querySelector("[data-quota-spacer]");
  const windowElement = root.querySelector("[data-quota-window]");
  const empty = root.querySelector("[data-quota-empty]");
  if (!input || !search || !balance || !summary || !viewport || !spacer || !windowElement || !empty) return null;

  let items = Array.isArray(config.items) ? config.items.map((item) => ({ ...item, id: String(item.id) })) : [];
  let counts = safeCounts(config.counts ?? JSON.parse(input.value || "{}"));
  let target = Math.max(1, Math.trunc(Number(config.targetCount) || 1));
  let filtered = items;
  let frame = null;

  function syncHidden() {
    const allowed = new Set(items.map((item) => item.id));
    counts = Object.fromEntries(Object.entries(counts).filter(([id]) => allowed.has(id)));
    for (const item of items) if (!(item.id in counts)) counts[item.id] = 0;
    input.value = JSON.stringify(counts);
  }

  function totalAssigned() {
    return items.reduce((sum, item) => sum + Math.max(0, Math.trunc(Number(counts[item.id]) || 0)), 0);
  }

  function updateSummary() {
    const assigned = totalAssigned();
    const remaining = target - assigned;
    summary.textContent = config.summaryText?.({ assigned, target, remaining }) ?? `${assigned} / ${target}`;
    summary.classList.toggle("is-valid", assigned === target);
    summary.classList.toggle("is-invalid", assigned !== target);
  }

  function makeRow(item, index) {
    const row = document.createElement("label");
    row.className = "runyth-npc-button__quota-row";
    row.style.height = `${ROW_HEIGHT}px`;
    row.dataset.quotaIndex = String(index);

    const label = document.createElement("span");
    label.textContent = item.label ?? item.id;
    label.title = item.label ?? item.id;
    row.append(label);

    const number = document.createElement("input");
    number.type = "number";
    number.min = "0";
    number.max = String(Math.max(target, Number(config.maxValue) || target));
    number.step = "1";
    number.inputMode = "numeric";
    number.value = String(Math.max(0, Math.trunc(Number(counts[item.id]) || 0)));
    number.dataset.quotaId = item.id;
    number.setAttribute("aria-label", `${item.label ?? item.id}: ${config.countLabel ?? "count"}`);
    row.append(number);
    return row;
  }

  function renderRows() {
    const viewportHeight = Math.max(ROW_HEIGHT, viewport.clientHeight || 264);
    const start = Math.max(0, Math.floor(viewport.scrollTop / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + (OVERSCAN * 2);
    const end = Math.min(filtered.length, start + visibleCount);
    windowElement.style.transform = `translateY(${start * ROW_HEIGHT}px)`;
    const fragment = document.createDocumentFragment();
    for (let index = start; index < end; index += 1) fragment.append(makeRow(filtered[index], index));
    windowElement.replaceChildren(fragment);
  }

  function applySearch({ resetScroll = false } = {}) {
    const needle = normalized(search.value);
    filtered = needle ? items.filter((item) => normalized(item.label ?? item.id).includes(needle)) : items;
    empty.hidden = filtered.length > 0;
    viewport.hidden = filtered.length === 0;
    spacer.style.height = `${filtered.length * ROW_HEIGHT}px`;
    if (resetScroll) viewport.scrollTop = 0;
    renderRows();
  }

  function notifyChange() {
    syncHidden();
    updateSummary();
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  balance.addEventListener("click", () => {
    counts = balancedQuotaCounts(items.map((item) => item.id), target);
    notifyChange();
    renderRows();
  }, { signal });

  search.addEventListener("input", () => {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => {
      frame = null;
      applySearch({ resetScroll: true });
    });
  }, { signal });

  viewport.addEventListener("scroll", renderRows, { signal, passive: true });
  windowElement.addEventListener("input", (event) => {
    const control = event.target.closest?.("[data-quota-id]");
    if (!control) return;
    event.stopPropagation();
    const id = String(control.dataset.quotaId);
    counts[id] = Math.max(0, Math.trunc(Number(control.valueAsNumber ?? control.value) || 0));
    syncHidden();
    updateSummary();
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, { signal });
  for (const eventName of ["keydown", "keyup", "keypress"]) {
    windowElement.addEventListener(eventName, (event) => {
      if (event.target?.matches?.("[data-quota-id]")) event.stopPropagation();
    }, { signal });
  }

  signal?.addEventListener("abort", () => {
    if (frame !== null) window.cancelAnimationFrame(frame);
  }, { once: true });

  syncHidden();
  updateSummary();
  applySearch();

  return {
    getCounts: () => ({ ...counts }),
    setTargetCount(value) {
      target = Math.max(1, Math.trunc(Number(value) || 1));
      updateSummary();
      renderRows();
    },
    setItems(nextItems, { rebalance = false } = {}) {
      const previous = { ...counts };
      items = Array.isArray(nextItems) ? nextItems.map((item) => ({ ...item, id: String(item.id) })) : [];
      counts = Object.fromEntries(items.map((item) => [item.id, Math.max(0, Math.trunc(Number(previous[item.id]) || 0))]));
      if (rebalance) counts = balancedQuotaCounts(items.map((item) => item.id), target);
      notifyChange();
      applySearch();
    },
    balance() {
      counts = balancedQuotaCounts(items.map((item) => item.id), target);
      notifyChange();
      renderRows();
    },
    isValid() {
      return items.length > 0 && totalAssigned() === target;
    }
  };
}
