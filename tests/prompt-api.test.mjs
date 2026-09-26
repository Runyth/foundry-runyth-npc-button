import assert from "node:assert/strict";
import test from "node:test";

import { buildAiPrompt } from "../scripts/ai/prompt-builder.mjs";
import { buildPortraitPromptFromActor } from "../scripts/ai/portrait-prompt-builder.mjs";
import {
  clearPromptExtensionRegistry,
  getPromptExtensions,
  registerPromptExtension,
  resolvePromptComponents,
  resolvePromptContext,
  unregisterPromptExtension
} from "../scripts/extensions/prompt-api.mjs";

test("prompt extension registry exposes deterministic sorted metadata", () => {
  clearPromptExtensionRegistry();
  registerPromptExtension("beta", { priority: 20, targets: { portrait: { components: { style: ["style b"] } } } });
  registerPromptExtension("alpha", { priority: 10, targets: { portrait: { components: { style: ["style a"] } } } });
  const entries = getPromptExtensions("portrait");
  assert.deepEqual(entries.map((entry) => entry.id), ["alpha", "beta"]);
  clearPromptExtensionRegistry();
});

test("portrait prompt extensions can replace core aesthetic components", () => {
  clearPromptExtensionRegistry();
  registerPromptExtension("grim-style", {
    priority: 50,
    targets: {
      portrait: {
        mergeMode: { style: "replace", background: "replace" },
        components: {
          style: ["ink illustration", "high-contrast monochrome"],
          background: ["dark parchment background"]
        }
      }
    }
  });
  const prompt = buildPortraitPromptFromActor({
    name: "Bren",
    system: {
      details: {
        type: { subtype: "Human" },
        biography: { value: "<p><strong>Appearance:</strong> Scarred porter.</p>" }
      }
    },
    flags: { "runyth-npc-button": { role: "Laborer" } },
    items: []
  });
  assert.match(prompt, /ink illustration/);
  assert.match(prompt, /dark parchment background/);
  assert.doesNotMatch(prompt, /muted earth-tone palette/);
  clearPromptExtensionRegistry();
});

test("prompt extensions can transform portrait context before default composition", () => {
  clearPromptExtensionRegistry();
  registerPromptExtension("rename-style", {
    priority: 10,
    targets: {
      portrait: {
        transformContext(context) {
          return { ...context, name: `${context.name} of Velia`, role: "Dock Worker" };
        }
      }
    }
  });
  const prompt = buildPortraitPromptFromActor({
    name: "Taren",
    system: { details: { type: { subtype: "Human" }, biography: { value: "" } } },
    flags: { "runyth-npc-button": { role: "Laborer" } },
    items: []
  });
  assert.match(prompt, /Taren of Velia, adult Human Dock Worker/);
  clearPromptExtensionRegistry();
});

test("AI prompt extensions can fully replace the default composer", () => {
  clearPromptExtensionRegistry();
  registerPromptExtension("custom-json", {
    priority: 100,
    targets: {
      npcJson: {
        compose({ context }) {
          return `CUSTOM NPC JSON PROMPT FOR ${String(context.roleLabel ?? "Guard").toUpperCase()}`;
        }
      }
    }
  });
  const prompt = buildAiPrompt({ count: 2, roleLabel: "Guard" });
  assert.equal(prompt, "CUSTOM NPC JSON PROMPT FOR GUARD");
  clearPromptExtensionRegistry();
});

test("AI prompt extensions can post-process default text without replacing the whole composer", () => {
  clearPromptExtensionRegistry();
  registerPromptExtension("suffix", {
    priority: 5,
    targets: {
      npcJson: {
        transformText(text) {
          return `${text}\nEXTRA LINE`;
        }
      }
    }
  });
  const prompt = buildAiPrompt({ count: 1, roleLabel: "Guard" });
  assert.match(prompt, /Generate exactly 1 NPC/);
  assert.match(prompt, /EXTRA LINE$/);
  clearPromptExtensionRegistry();
});

test("resolvePromptComponents supports prepend and append merging", () => {
  clearPromptExtensionRegistry();
  registerPromptExtension("prepend-style", {
    priority: 1,
    targets: { portrait: { mergeMode: { style: "prepend" }, components: { style: ["first"] } } }
  });
  registerPromptExtension("append-style", {
    priority: 2,
    targets: { portrait: { mergeMode: { style: "append" }, components: { style: ["last"] } } }
  });
  const components = resolvePromptComponents("portrait", { style: ["middle"] }, {});
  assert.deepEqual(components.style, ["first", "middle", "last"]);
  clearPromptExtensionRegistry();
});

test("resolvePromptContext applies target-specific context transforms in priority order", () => {
  clearPromptExtensionRegistry();
  registerPromptExtension("one", {
    priority: 1,
    targets: { portrait: { transformContext: (context) => ({ ...context, score: 1 }) } }
  });
  registerPromptExtension("two", {
    priority: 2,
    targets: { portrait: { transformContext: (context) => ({ ...context, score: context.score + 1 }) } }
  });
  const context = resolvePromptContext("portrait", { score: 0 });
  assert.equal(context.score, 2);
  clearPromptExtensionRegistry();
});

test("prompt extensions can be unregistered cleanly", () => {
  clearPromptExtensionRegistry();
  registerPromptExtension("temp-style", {
    targets: { portrait: { components: { style: ["temporary"] } } }
  });
  unregisterPromptExtension("temp-style");
  assert.equal(getPromptExtensions("portrait").length, 0);
  clearPromptExtensionRegistry();
});
