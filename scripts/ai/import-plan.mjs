const HARD_PREVIEW_LIMIT = 100;

function integerCount(value, fallback = 0) {
  const count = Math.trunc(Number(value));
  return Number.isFinite(count) ? count : fallback;
}

/**
 * Count the top-level Actor entries represented by a parsed NPC payload.
 * Root-shape validation belongs to npc-json.mjs; this helper deliberately
 * performs no recursive/object-member counting so nested arrays can never
 * inflate the reported NPC total.
 */
export function countNpcPayloadEntries(payload) {
  if (Array.isArray(payload)) return payload.length;
  if (payload && typeof payload === "object") return 1;
  return 0;
}

/**
 * Decide how an already parsed and structurally valid payload should enter the
 * import flow. Count mismatches are review events by default, not parse errors.
 * The configured maximum remains a hard creation limit, but preview can inspect
 * a bounded oversized payload so the user can deselect entries safely.
 */
export function buildNpcImportPlan({
  actualCount,
  expectedCount,
  maxBatch,
  previewRequested = false,
  ignoreCountMismatch = false,
  allowSingleObject = false
} = {}) {
  const actual = Math.max(0, integerCount(actualCount, 0));
  const expected = Math.max(1, integerCount(expectedCount, 1));
  const maximum = Math.max(1, Math.min(HARD_PREVIEW_LIMIT, integerCount(maxBatch, 25) || 25));
  const mismatch = actual !== expected;
  const exceedsMaximum = actual > maximum;
  const mismatchNeedsReview = mismatch && !ignoreCountMismatch;
  const previewRequired = Boolean(previewRequested || mismatchNeedsReview || exceedsMaximum);

  return Object.freeze({
    actualCount: actual,
    expectedCount: expected,
    maxBatch: maximum,
    mismatch,
    exceedsMaximum,
    previewRequired,
    autoPreview: previewRequired && !previewRequested,
    allowSingleObject: Boolean(allowSingleObject),
    // A mismatch that reaches preview is an explicit human-review workflow.
    // Final selection may therefore differ from the originally requested count,
    // but can never exceed the configured maximum.
    finalValidationOptions: Object.freeze({
      maxCount: maximum,
      allowSingleObject: Boolean(allowSingleObject)
    }),
    preflightValidationOptions: Object.freeze({
      maxCount: HARD_PREVIEW_LIMIT,
      allowSingleObject: Boolean(allowSingleObject)
    })
  });
}

export const NPC_IMPORT_PREVIEW_HARD_LIMIT = HARD_PREVIEW_LIMIT;
