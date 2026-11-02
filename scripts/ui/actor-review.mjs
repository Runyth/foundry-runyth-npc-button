// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
const MAX_OPEN_ACTORS = 10;
const MAX_COLUMNS = 3;
const MIN_SHEET_WIDTH = 420;
const MAX_SHEET_WIDTH = 620;
const GAP = 10;
const MARGIN = 12;

function nextFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

function layoutFor(count) {
  const viewportWidth = Math.max(640, document.documentElement.clientWidth || window.innerWidth || 1280);
  const possibleColumns = Math.max(1, Math.floor((viewportWidth - (MARGIN * 2) + GAP) / (MIN_SHEET_WIDTH + GAP)));
  const columns = Math.min(MAX_COLUMNS, count, possibleColumns);
  const available = viewportWidth - (MARGIN * 2) - (GAP * (columns - 1));
  const width = Math.min(MAX_SHEET_WIDTH, Math.max(MIN_SHEET_WIDTH, Math.floor(available / columns)));
  const totalWidth = (width * columns) + (GAP * (columns - 1));
  const left = Math.max(MARGIN, Math.floor((viewportWidth - totalWidth) / 2));
  return { columns, width, left, top: 48 };
}

/**
 * Open up to ten Actor sheets as three (or fewer on small displays) visible
 * columns. Later Actors share the same column positions behind the first row,
 * so closing a top sheet reveals the next Actor in that stack.
 */
export async function openActorReviewStack(actors = []) {
  const selected = Array.from(actors).slice(0, MAX_OPEN_ACTORS);
  if (!selected.length) return;

  const layout = layoutFor(selected.length);
  for (let index = selected.length - 1; index >= 0; index -= 1) {
    const actor = selected[index];
    const sheet = actor?.sheet;
    if (!sheet) continue;

    const column = index % layout.columns;
    const position = {
      left: layout.left + (column * (layout.width + GAP)),
      top: layout.top,
      width: layout.width
    };

    await Promise.resolve(sheet.render(true, { position }));
    await nextFrame();
    if (typeof sheet.setPosition === "function") sheet.setPosition(position);
  }
}
