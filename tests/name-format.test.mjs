import assert from "node:assert/strict";
import test from "node:test";

import { formatNameTemplate, resolveNameTemplate, validateNameTemplate } from "../scripts/generator/name-format.mjs";

test("optional name-template blocks disappear when a referenced value is empty", () => {
  assert.equal(
    formatNameTemplate('{first} ["{nickname}" ]{last}[ of {location}]', { first: "Elian", last: "Mercer", nickname: "", location: "" }),
    "Elian Mercer"
  );
});

test("optional name-template blocks render when all referenced values exist", () => {
  assert.equal(
    formatNameTemplate('{first} ["{nickname}" ]{last}[ of {location}]', { first: "Elian", last: "Mercer", nickname: "Crow", location: "Velia" }),
    'Elian "Crow" Mercer of Velia'
  );
});

test("custom template resolution falls back safely when custom text is blank", () => {
  assert.equal(resolveNameTemplate({ nameFormatPreset: "custom", nameTemplate: "" }), "{prefix} {first} {infix} {last} {suffix}");
});

test("name-template validation rejects unknown and incomplete placeholders", () => {
  assert.throws(() => validateNameTemplate("{first} {unknown}"), /Unknown name template token/);
  assert.throws(() => validateNameTemplate("{first} {last"), /incomplete placeholder/);
  assert.throws(() => validateNameTemplate("{first} [of {location}"), /optional blocks/);
});
