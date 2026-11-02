// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import { DEFAULT_OPTIONS } from "../constants.mjs";
import { getRaces } from "../extensions/registry.mjs";

export const AGE_RANGE_MODES = Object.freeze({
  contextual: { label: "Contextual", labelKey: "ageRange.contextual", prompt: "choose a role- and group-appropriate adult life stage for each NPC" },
  youngAdult: { label: "Young adults", labelKey: "ageRange.youngAdult", prompt: "keep NPCs in the younger part of their Race's adult lifespan" },
  adult: { label: "Adults", labelKey: "ageRange.adult", prompt: "keep NPCs in the broad early-to-middle adult portion of their Race's lifespan" },
  mature: { label: "Mature adults", labelKey: "ageRange.mature", prompt: "keep NPCs in the mature middle-to-later part of their Race's adult lifespan" },
  older: { label: "Older adults", labelKey: "ageRange.older", prompt: "keep NPCs in the older but normally active part of their Race's lifespan" },
  mixedGenerations: { label: "Mixed generations", labelKey: "ageRange.mixedGenerations", prompt: "use a broad adult age span so several generations can naturally appear in the same group" },
  exactRange: { label: "Exact year range", labelKey: "ageRange.exactRange", prompt: "use the supplied literal minimum and maximum ages in years" }
});

export const AGE_SPREADS = Object.freeze({
  natural: { label: "Natural/random", labelKey: "ageSpread.natural", prompt: "randomize naturally within the selected age range" },
  even: { label: "Evenly spread", labelKey: "ageSpread.even", prompt: "spread the batch broadly and evenly across the selected age range" },
  clustered: { label: "Similar ages", labelKey: "ageSpread.clustered", prompt: "cluster most NPCs near the middle of the selected age range" },
  younger: { label: "Younger-leaning", labelKey: "ageSpread.younger", prompt: "bias the batch toward the younger end while retaining some older members" },
  older: { label: "Older-leaning", labelKey: "ageSpread.older", prompt: "bias the batch toward the older end while retaining some younger members" }
});

const CORE_AGE_PROFILES = Object.freeze({
  human: { adulthood: 18, lifespan: 80 },
  aasimar: { adulthood: 18, lifespan: 160 },
  dragonborn: { adulthood: 15, lifespan: 80 },
  dwarf: { adulthood: 50, lifespan: 350 },
  elf: { adulthood: 100, lifespan: 750 },
  gnome: { adulthood: 40, lifespan: 425 },
  goliath: { adulthood: 18, lifespan: 90 },
  halfling: { adulthood: 20, lifespan: 150 },
  orc: { adulthood: 14, lifespan: 80 },
  tiefling: { adulthood: 18, lifespan: 100 }
});

const MODE_FRACTIONS = Object.freeze({
  youngAdult: [0.0, 0.22],
  adult: [0.12, 0.50],
  mature: [0.42, 0.72],
  older: [0.66, 0.92],
  mixedGenerations: [0.0, 0.95]
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizedProfile(profile) {
  const adulthood = Math.max(1, Math.trunc(Number(profile?.adulthood) || 18));
  const lifespan = Math.max(adulthood + 1, Math.trunc(Number(profile?.lifespan) || 80));
  return { adulthood, lifespan };
}

export function ageProfileForRace(species = "human") {
  const races = getRaces();
  const race = races[species];
  return normalizedProfile(race?.ageProfile ?? CORE_AGE_PROFILES[species] ?? CORE_AGE_PROFILES.human);
}

function contextualFractions(roleId, groupTypeId) {
  if (groupTypeId === "family") return [0.0, 0.95];
  if (["leader", "noble", "scholar"].includes(roleId)) return [0.32, 0.78];
  if (["guard", "soldier", "scout", "bruiser"].includes(roleId)) return [0.08, 0.55];
  if (["merchant", "artisan", "specialist", "acolyte"].includes(roleId)) return [0.15, 0.70];
  return [0.08, 0.78];
}

export function ageBoundsForNpc(options = {}, raceAssignment = {}, roleAssignment = {}, groupType = {}) {
  const mode = AGE_RANGE_MODES[options.ageRange] ? options.ageRange : DEFAULT_OPTIONS.ageRange;
  if (mode === "exactRange") {
    let min = clamp(Math.trunc(Number(options.ageMin) || DEFAULT_OPTIONS.ageMin), 1, 10000);
    let max = clamp(Math.trunc(Number(options.ageMax) || DEFAULT_OPTIONS.ageMax), 1, 10000);
    if (min > max) [min, max] = [max, min];
    return { min, max, literal: true };
  }

  const profile = ageProfileForRace(raceAssignment.species ?? options.species ?? "human");
  const fractions = mode === "contextual"
    ? contextualFractions(roleAssignment.role ?? options.role, options.groupType ?? groupType?.id ?? "independent")
    : (MODE_FRACTIONS[mode] ?? MODE_FRACTIONS.adult);
  const adultSpan = Math.max(1, profile.lifespan - profile.adulthood);
  const min = Math.round(profile.adulthood + (adultSpan * fractions[0]));
  const max = Math.max(min, Math.round(profile.adulthood + (adultSpan * fractions[1])));
  return { min, max, literal: false };
}

function shuffle(values, random) {
  const output = [...values];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

function spreadPositions(total, spread, random) {
  const count = Math.max(1, Math.trunc(Number(total) || 1));
  let values;
  if (spread === "even") {
    values = Array.from({ length: count }, (_, index) => (index + 0.5) / count);
  } else if (spread === "clustered") {
    values = Array.from({ length: count }, () => clamp(0.5 + ((random() - 0.5) * 0.30), 0, 1));
  } else if (spread === "younger") {
    values = Array.from({ length: count }, () => Math.pow(random(), 2));
  } else if (spread === "older") {
    values = Array.from({ length: count }, () => 1 - Math.pow(random(), 2));
  } else {
    values = Array.from({ length: count }, () => random());
  }
  return shuffle(values, random);
}

export function buildAgeAssignments(options = {}, raceAssignments = [], roleAssignments = [], count = 1, random = Math.random, groupType = {}) {
  const total = Math.max(1, Math.trunc(Number(count) || 1));
  const spread = AGE_SPREADS[options.ageSpread] ? options.ageSpread : DEFAULT_OPTIONS.ageSpread;
  const positions = spreadPositions(total, spread, random);
  return Array.from({ length: total }, (_, index) => {
    const bounds = ageBoundsForNpc(options, raceAssignments[index] ?? {}, roleAssignments[index] ?? {}, groupType);
    const position = clamp(positions[index] ?? 0.5, 0, 1);
    return Math.round(bounds.min + ((bounds.max - bounds.min) * position));
  });
}
