# AI NPC Import — Native Combat Activities (0.4.4)

The optional `combat` property in each imported NPC JSON object enables native D&D 5e combat Items, attacks, saving throws, healing, utilities, and damage traits. It is intended for **Foundry VTT 13** with **dnd5e 5.0–5.3**.

The ordinary v0.4.3 JSON import contract remains valid. Existing JSON without `combat` imports exactly as before, except that compendium-resolved weapons and equipment are explicitly marked equipped.

## Import the Bree Bunch example

1. Install `runyth-npc-button-0.4.4.zip`, replacing older Runyth NPC Button installation, then restart Foundry.
2. Keep complementary module `runyth-npc-button-orphan-black` enabled if it is normally used for this world; its API remains unchanged.
3. In the dashboard set **Count = 12** and disposition to **Hostile (Enemy)**. Set an Actor folder explicitly.
4. Copy the entire contents of `docs/examples/bree-bunch-12-npcs.json` to the clipboard, then import and inspect the preview.
5. Check `Tusks` on each boar (two attack activities), `Brutal Sweep` on Warriors, and `Rally the Wounded` on the Sachem before starting combat.

The example contains **8 humanoid Bree and 4 boars**, with no hounds. The boars are a deliberately difficult homebrew type with Resistance to Bludgeoning and Slashing and Vulnerability to Piercing. This is **not** the official D&D 5e boar stat block.

## Native activity support

The importer creates native `weapon` Items with an equipped state and one or more Attack activities. Weapon attacks specify **flat attack modifiers** and **explicit typed damage formulas**, eliminating dependence on module item-name resolution. The `feat` type supports native Save, Heal and Utility activities, templates, targets, per-activity limited uses, and recharge where specified.

For Save activities, damage is either full/half/none on a success as specified in the JSON. Attached conditions are available through the Foundry applied-effects UI; they are **not forced unconditionally** onto targets who make a successful saving throw. Damage resistances and vulnerabilities are on the Actor, not in its biography.

## Limitations that cannot be honestly considered automatic

D&D 5e 5.3 activity execution does not automatically check all custom **gameplay prerequisites** or resolve all conditionals. Examples: whether a boar moved in a straight line for 20 ft., an enemy has become Bloodied, whether both Scout dagger attacks hit, when a prepared stack of timber can collapse, whether a spell grants temporary advantage for exactly one attack, or when an attack-triggered prone effect should be applied. GM adjudication remains necessary. The encounter JSON contains explicit directions in each feature description.

The Sachem's `Boar's Command` is a native, usage-tracked Utility activity, but Advantage on each recipient's next attack is set **manually in the attack dialog**, not automatically granted by clicking the command. Healing and damage rolls, attack rolls and saving throws are native activities.

Some natural effects (Prone, forced movement, temporary terrain, smoke) are **represented as effects or area templates**, but applying them according to hit/miss/save/terrain conditions still requires the GM or a compatible automation module.

No actual in-world Foundry import can be executed from the distributed source alone; the included unit tests validate and inspect the generated Actor-source structures and formula values. After installation, confirm activity rolls on one dummy combatant before using the complete encounter.

## Supported optional `combat` schema

Each actor may include:

- `combat.savingThrows`: array of ability keys, e.g. `str`, `wis`.
- `combat.skills`: map of skill abbreviations to 0 (untrained), 1 (proficient), 2 (expertise), e.g. `{"ath":1,"ste":2}`.
- `combat.resistances` and `combat.vulnerabilities`: arrays of standard D&D 5e damage-type names.
- `combat.actions`: up to 35 typed actions. Supported kinds: `attack`, `save`, `heal`, `utility`.

Attack actions take an `attack` object with `toHit`, `mode`, optional `reach`, `range`, and `longRange`, and a `damage` object with `{ "formula": "1d8+3", "type": "piercing" }`. Optional `weapon` groups several activities under one weapon Item, while `replaceInventory` identifies an existing standard inventory item that the functional weapon should replace. `natural` marks a `weapon` as a natural weapon.

Save actions have `{ "save": { "ability": "dex", "dc": 13 } }`, optional `damage`, `onSave` (`half`, `none`, `full`), optional `area` (`type`,`size`), and optional `condition`.

Heal actions take a `healing` dice formula such as `1d6+3`.

Utilities optionally take a `roll` dice formula for reductions such as `1d8+2`.

All activities support an activation (`action`, `bonus`, `reaction`, `none`), targets, range, description, and an optional limited-use structure. A recharge uses `{ "max":1, "recharge":5 }` (5–6 on d6); without `recharge`, uses must be restored manually.

The extra schema is allowlisted and validated. Arbitrary untrusted Item/Actor source injection is not supported.

## Source references

- D&D 5e Activities (up to v5.1): https://github.com/foundryvtt/dnd5e/wiki/Activities/af946a4a38d7efaadff3aa5532d46fb5375c1ed6
- D&D 5e 5.3.3 native attack data model: https://github.com/foundryvtt/dnd5e/blob/release-5.3.3/module/data/activity/attack-data.mjs
- D&D 5e 5.3.3 weapon model: https://github.com/foundryvtt/dnd5e/blob/release-5.3.3/module/data/item/weapon.mjs
- D&D 5e 5.3.3 actor traits: https://github.com/foundryvtt/dnd5e/blob/release-5.3.3/module/data/actor/templates/traits.mjs
