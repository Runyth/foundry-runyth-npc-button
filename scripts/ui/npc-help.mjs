import { MODULE_ID, SETTINGS, TIER_STYLES } from "../constants.mjs";
import { COMBAT_READINESS, GROUP_TYPES, HABITATS, NAME_STYLES, RACES, RACE_COMPOSITION_MODES, ROLE_COMPOSITION_MODES, WEALTH_DISTRIBUTIONS, WEAPON_VARIETY } from "../generator/data.mjs";
import { getGroupTypes, getHabitats, getNamingStyles, getRaces } from "../extensions/registry.mjs";
import { escapeAttribute } from "../utils/html.mjs";

function localize(key) {
  return game.i18n.localize(`${MODULE_ID}.${key}`);
}

function configuredLabel(config) {
  return config?.labelKey ? localize(config.labelKey) : (config?.label ?? "");
}

function namingExamples(style) {
  return (style.examples ?? [])
    .slice(0, 12)
    .join("; ");
}

function helpTable(headers, rows, { className = "" } = {}) {
  const headerMarkup = headers.map((header) => `<th scope="col">${escapeAttribute(header)}</th>`).join("");
  return `
    <div class="runyth-npc-button__help-table-wrap ${escapeAttribute(className)}">
      <table class="runyth-npc-button__help-table">
        <thead><tr>${headerMarkup}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function detailRows(entries, rules, examples, { exclude = [] } = {}) {
  const excluded = new Set(exclude);
  return Object.entries(entries)
    .filter(([id]) => !excluded.has(id))
    .map(([id, config]) => `
      <tr>
        <th scope="row">${escapeAttribute(configuredLabel(config))}</th>
        <td>${escapeAttribute(rules[id] ?? "")}</td>
        <td>${escapeAttribute(examples[id] ?? "")}</td>
      </tr>
    `).join("");
}

function helpContent() {
  const tierStyle = game.settings.get(MODULE_ID, SETTINGS.TIER_STYLE) || TIER_STYLES.NAMED;
  const tierStyleText = tierStyle === TIER_STYLES.CR
    ? localize("help.tierStyleCr")
    : localize("help.tierStyleNamed");
  const namingStyles = getNamingStyles();
  const races = getRaces();
  const habitats = getHabitats();
  const groupTypes = getGroupTypes();
  const namingRows = Object.values(namingStyles).map((style) => `
    <tr>
      <th scope="row">${escapeAttribute(configuredLabel(style))}</th>
      <td>${escapeAttribute(localize(style.descriptionKey))}</td>
      <td>${escapeAttribute(namingExamples(style))}</td>
    </tr>
  `).join("");
  const raceNames = Object.entries(races)
    .filter(([id]) => id !== "custom")
    .map(([, race]) => configuredLabel(race))
    .join(", ");
  const habitatExamples = ["forestVillage", "desertOasis", "riverlands", "coast", "island", "mountains", "tundra", "underground"]
    .map((id) => localize((habitats[id] ?? HABITATS[id]).labelKey))
    .join(", ");
  const groupExamples = ["family", "guardPatrol", "orcRaiders", "caravan", "shipCrew", "templeHousehold", "villageCouncil", "expedition"]
    .map((id) => configuredLabel(groupTypes[id] ?? GROUP_TYPES[id]))
    .join(", ");
  const generationRows = [
    [localize("ui.count"), localize("help.count")],
    [localize("ui.groupType"), localize("help.groupType")],
    [localize("ui.habitat"), localize("help.habitat")],
    [localize("ui.role"), localize("help.role")],
    [localize(tierStyle === TIER_STYLES.CR ? "ui.challengeRating" : "ui.tier"), tierStyleText],
    [localize("ui.race"), localize("help.race")],
    [localize("ui.wealth"), localize("help.wealth")],
    [localize("ui.wealthDistribution"), localize("help.wealthDistribution")],
    [localize("ui.seed"), localize("help.seed")],
    [localize("ui.destinationFolder"), localize("help.destination")]
  ].map(([setting, behavior]) => `
    <tr><th scope="row">${escapeAttribute(setting)}</th><td>${escapeAttribute(behavior)}</td></tr>
  `).join("");
  const raceMixRules = Object.fromEntries(Object.keys(RACE_COMPOSITION_MODES).map((id) => [id, localize(`help.raceMixModes.${id}`)]));
  const raceMixExamples = Object.fromEntries(Object.keys(RACE_COMPOSITION_MODES).map((id) => [id, localize(`help.raceMixExamples.${id}`)]));
  const raceMixRows = detailRows(RACE_COMPOSITION_MODES, raceMixRules, raceMixExamples, { exclude: ["mixed"] });
  const roleMixRules = Object.fromEntries(Object.keys(ROLE_COMPOSITION_MODES).map((id) => [id, localize(`help.roleMixModes.${id}`)]));
  const roleMixExamples = Object.fromEntries(Object.keys(ROLE_COMPOSITION_MODES).map((id) => [id, localize(`help.roleMixExamples.${id}`)]));
  const roleMixRows = detailRows(ROLE_COMPOSITION_MODES, roleMixRules, roleMixExamples);
  const combatRules = Object.fromEntries(Object.keys(COMBAT_READINESS).map((id) => [id, localize(`help.combatReadinessModes.${id}`)]));
  const combatExamples = Object.fromEntries(Object.keys(COMBAT_READINESS).map((id) => [id, localize(`help.combatReadinessExamples.${id}`)]));
  const combatRows = detailRows(COMBAT_READINESS, combatRules, combatExamples);
  const weaponRules = Object.fromEntries(Object.keys(WEAPON_VARIETY).map((id) => [id, localize(`help.weaponVarietyModes.${id}`)]));
  const weaponExamples = Object.fromEntries(Object.keys(WEAPON_VARIETY).map((id) => [id, localize(`help.weaponVarietyExamples.${id}`)]));
  const weaponRows = detailRows(WEAPON_VARIETY, weaponRules, weaponExamples);
  const wealthDistributionRules = Object.fromEntries(Object.keys(WEALTH_DISTRIBUTIONS).map((id) => [id, localize(`help.wealthDistributionModes.${id}`)]));
  const wealthDistributionExamples = Object.fromEntries(Object.keys(WEALTH_DISTRIBUTIONS).map((id) => [id, localize(`help.wealthDistributionExamples.${id}`)]));
  const wealthDistributionRows = detailRows(WEALTH_DISTRIBUTIONS, wealthDistributionRules, wealthDistributionExamples);
  const previewRows = ["normal", "mismatch", "arbitrary", "oversized"].map((id) => `
    <tr>
      <th scope="row">${escapeAttribute(localize(`help.importPreviewCases.${id}.case`))}</th>
      <td>${escapeAttribute(localize(`help.importPreviewCases.${id}.behavior`))}</td>
    </tr>
  `).join("");
  const filterRows = ["items", "advanced", "profiles"].map((id) => `
    <tr>
      <th scope="row">${escapeAttribute(localize(`help.filterControls.${id}.control`))}</th>
      <td>${escapeAttribute(localize(`help.filterControls.${id}.behavior`))}</td>
    </tr>
  `).join("");
  const aiRows = [1, 2, 3, 4].map((step) => `
    <tr>
      <th scope="row">${escapeAttribute(game.i18n.format(`${MODULE_ID}.help.aiStepLabel`, { step }))}</th>
      <td>${escapeAttribute(localize(`help.aiStep${step}`))}</td>
    </tr>
  `).join("");

  return `
    <article class="runyth-npc-button__help">
      <section>
        <h2>${escapeAttribute(localize("help.generationTitle"))}</h2>
        <p>${escapeAttribute(localize("help.generationBody"))}</p>
        ${helpTable(
          [localize("help.setting"), localize("help.effect")],
          generationRows,
          { className: "runyth-npc-button__help-table-wrap--compact" }
        )}
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.standardRacesTitle"))}</h2>
        <p>${escapeAttribute(game.i18n.format(`${MODULE_ID}.help.standardRacesBody`, { races: raceNames }))}</p>
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.habitatsTitle"))}</h2>
        <p>${escapeAttribute(game.i18n.format(`${MODULE_ID}.help.habitatsBody`, { habitats: habitatExamples }))}</p>
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.groupsTitle"))}</h2>
        <p>${escapeAttribute(game.i18n.format(`${MODULE_ID}.help.groupsBody`, { groups: groupExamples }))}</p>
        <p>${escapeAttribute(localize("help.groupsAdvanced"))}</p>
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.pickersTitle"))}</h2>
        <p>${escapeAttribute(localize("help.pickersBody"))}</p>
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.namingTitle"))}</h2>
        <p>${escapeAttribute(localize("help.namingBody"))}</p>
        ${helpTable([localize("ui.namingStyle"), localize("help.character"), localize("help.examples")], namingRows)}
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.compositionTitle"))}</h2>
        <p>${escapeAttribute(localize("help.compositionBody"))}</p>
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.raceMixTitle"))}</h2>
        <p>${escapeAttribute(localize("help.raceMixBody"))}</p>
        ${helpTable([localize("help.mixMode"), localize("help.mixRule"), localize("help.mixExample")], raceMixRows)}
        <p>${escapeAttribute(localize("help.raceMixWeights"))}</p>
        <p class="runyth-npc-button__note">${escapeAttribute(localize("help.mixRounding"))}</p>
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.roleMixTitle"))}</h2>
        <p>${escapeAttribute(localize("help.roleMixBody"))}</p>
        ${helpTable([localize("help.mixMode"), localize("help.mixRule"), localize("help.mixExample")], roleMixRows)}
        <p>${escapeAttribute(localize("help.roleMixWeights"))}</p>
        <p class="runyth-npc-button__note">${escapeAttribute(localize("help.mixRounding"))}</p>
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.wealthDistributionTitle"))}</h2>
        <p>${escapeAttribute(localize("help.wealthDistributionBody"))}</p>
        ${helpTable([localize("help.mode"), localize("help.effect"), localize("help.example")], wealthDistributionRows)}
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.combatReadinessTitle"))}</h2>
        <p>${escapeAttribute(localize("help.combatReadinessBody"))}</p>
        ${helpTable([localize("help.level"), localize("help.effect"), localize("help.example")], combatRows)}
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.weaponVarietyTitle"))}</h2>
        <p>${escapeAttribute(localize("help.weaponVarietyBody"))}</p>
        ${helpTable([localize("help.mode"), localize("help.effect"), localize("help.example")], weaponRows)}
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.actorReviewTitle"))}</h2>
        <p>${escapeAttribute(localize("help.actorReviewBody"))}</p>
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.portraitPromptTitle"))}</h2>
        <p>${escapeAttribute(localize("help.portraitPromptBody"))}</p>
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.filterTitle"))}</h2>
        <p>${escapeAttribute(localize("help.filterBody"))}</p>
        ${helpTable([localize("help.control"), localize("help.behavior")], filterRows, { className: "runyth-npc-button__help-table-wrap--compact" })}
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.importPreviewTitle"))}</h2>
        <p>${escapeAttribute(localize("help.importPreviewBody"))}</p>
        ${helpTable([localize("help.situation"), localize("help.behavior")], previewRows, { className: "runyth-npc-button__help-table-wrap--compact" })}
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.aiTitle"))}</h2>
        <p>${escapeAttribute(localize("help.aiBody"))}</p>
        ${helpTable([localize("help.step"), localize("help.action")], aiRows, { className: "runyth-npc-button__help-table-wrap--compact" })}
        <p class="runyth-npc-button__note">${escapeAttribute(localize("help.aiValidation"))}</p>
      </section>
    </article>
  `;
}

class NpcHelpApplication extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "runyth-npc-button-help",
    classes: ["runyth-npc-button", "runyth-npc-button--help"],
    window: {
      title: `${MODULE_ID}.help.title`,
      icon: "fa-solid fa-circle-question",
      resizable: true,
      minimizable: true
    },
    position: {
      width: 760,
      height: 760
    }
  };

  async _renderHTML() {
    const template = document.createElement("template");
    template.innerHTML = helpContent();
    return template.content;
  }

  _replaceHTML(result, content) {
    content.replaceChildren(result);
  }
}

let helpApplication = null;

function sidePosition(master, help) {
  const gap = 12;
  const masterPosition = master?.position ?? {};
  const helpPosition = help.position ?? {};
  const width = Number(helpPosition.width) || 760;
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const preferredLeft = Number(masterPosition.left) + Number(masterPosition.width) + gap;
  const left = Number.isFinite(preferredLeft) && preferredLeft + width <= viewportWidth
    ? preferredLeft
    : Math.max(gap, Number(masterPosition.left || gap) - width - gap);
  const top = Math.max(gap, Number(masterPosition.top || gap));
  return { left, top };
}

export async function openNpcHelp(masterApplication) {
  if (!helpApplication) helpApplication = new NpcHelpApplication();
  if (!helpApplication.rendered) await helpApplication.render({ force: true });
  helpApplication.setPosition(sidePosition(masterApplication, helpApplication));
  helpApplication.bringToFront();
  return helpApplication;
}
