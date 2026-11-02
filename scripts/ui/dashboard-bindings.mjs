// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import { bindOptionalControl } from "./form-events.mjs";

export function bindDashboardActionButtons(form, handlers = {}, signal) {
  const bound = {
    create: bindOptionalControl(form, '[data-action="create-local"]', "click", handlers.create ?? (() => {}), { signal }),
    copyPrompt: bindOptionalControl(form, '[data-action="copy-prompt"]', "click", handlers.copyPrompt ?? (() => {}), { signal }),
    importNpc: bindOptionalControl(form, '[data-action="import-npc"]', "click", handlers.importNpc ?? (() => {}), { signal })
  };
  return bound;
}
