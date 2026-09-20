import { MODULE_ID, SETTINGS, TIER_STYLES } from "../constants.mjs";
import { GROUP_TYPES, HABITATS, NAME_STYLES, RACES } from "../generator/data.mjs";
import { getGroupTypes, getHabitats, getNamingStyles, getRaces } from "../extensions/registry.mjs";
import { escapeAttribute } from "../utils/html.mjs";

function localize(key) {
  return game.i18n.localize(`${MODULE_ID}.${key}`);
}

function namingExamples(style) {
  return (style.examples ?? [])
    .slice(0, 12)
    .join("; ");
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
      <th scope="row">${escapeAttribute(localize(style.labelKey))}</th>
      <td>${escapeAttribute(localize(style.descriptionKey))}</td>
      <td>${escapeAttribute(namingExamples(style))}</td>
    </tr>
  `).join("");
  const raceNames = Object.entries(races)
    .filter(([id]) => id !== "custom")
    .map(([, race]) => localize(race.labelKey))
    .join(", ");
  const habitatExamples = ["forestVillage", "desertOasis", "riverlands", "coast", "island", "mountains", "tundra", "underground"]
    .map((id) => localize((habitats[id] ?? HABITATS[id]).labelKey))
    .join(", ");
  const groupExamples = ["family", "guardPatrol", "orcRaiders", "caravan", "shipCrew", "templeHousehold", "villageCouncil", "expedition"]
    .map((id) => localize((groupTypes[id] ?? GROUP_TYPES[id]).labelKey))
    .join(", ");

  return `
    <article class="runyth-npc-button__help">
      <section>
        <h2>${escapeAttribute(localize("help.generationTitle"))}</h2>
        <p>${escapeAttribute(localize("help.generationBody"))}</p>
        <dl class="runyth-npc-button__help-list">
          <dt>${escapeAttribute(localize("ui.count"))}</dt><dd>${escapeAttribute(localize("help.count"))}</dd>
          <dt>${escapeAttribute(localize("ui.groupType"))}</dt><dd>${escapeAttribute(localize("help.groupType"))}</dd>
          <dt>${escapeAttribute(localize("ui.habitat"))}</dt><dd>${escapeAttribute(localize("help.habitat"))}</dd>
          <dt>${escapeAttribute(localize("ui.role"))}</dt><dd>${escapeAttribute(localize("help.role"))}</dd>
          <dt>${escapeAttribute(localize(tierStyle === TIER_STYLES.CR ? "ui.challengeRating" : "ui.tier"))}</dt><dd>${escapeAttribute(tierStyleText)}</dd>
          <dt>${escapeAttribute(localize("ui.race"))}</dt><dd>${escapeAttribute(localize("help.race"))}</dd>
          <dt>${escapeAttribute(localize("ui.wealth"))}</dt><dd>${escapeAttribute(localize("help.wealth"))}</dd>
          <dt>${escapeAttribute(localize("ui.seed"))}</dt><dd>${escapeAttribute(localize("help.seed"))}</dd>
          <dt>${escapeAttribute(localize("ui.destinationFolder"))}</dt><dd>${escapeAttribute(localize("help.destination"))}</dd>
        </dl>
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
        <table class="runyth-npc-button__help-table">
          <thead><tr><th>${escapeAttribute(localize("ui.namingStyle"))}</th><th>${escapeAttribute(localize("help.character"))}</th><th>${escapeAttribute(localize("help.examples"))}</th></tr></thead>
          <tbody>${namingRows}</tbody>
        </table>
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.compositionTitle"))}</h2>
        <p>${escapeAttribute(localize("help.compositionBody"))}</p>
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.combatReadinessTitle"))}</h2>
        <p>${escapeAttribute(localize("help.combatReadinessBody"))}</p>
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.weaponVarietyTitle"))}</h2>
        <p>${escapeAttribute(localize("help.weaponVarietyBody"))}</p>
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
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.importPreviewTitle"))}</h2>
        <p>${escapeAttribute(localize("help.importPreviewBody"))}</p>
      </section>
      <section>
        <h2>${escapeAttribute(localize("help.aiTitle"))}</h2>
        <p>${escapeAttribute(localize("help.aiBody"))}</p>
        <ol>
          <li>${escapeAttribute(localize("help.aiStep1"))}</li>
          <li>${escapeAttribute(localize("help.aiStep2"))}</li>
          <li>${escapeAttribute(localize("help.aiStep3"))}</li>
          <li>${escapeAttribute(localize("help.aiStep4"))}</li>
        </ol>
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
      width: 620,
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
  const width = Number(helpPosition.width) || 620;
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
