import { WEALTH_DISTRIBUTIONS } from "./data.mjs";

export const WEALTH_BUDGETS_CP = Object.freeze({
  poor: 50,
  average: 500,
  wellOff: 2500,
  elite: 10000
});

const VALUE_ITEM_NAMES = Object.freeze([
  "Personal valuable",
  "Useful trade goods",
  "Quality accessory",
  "Portable keepsake",
  "Small valuable bundle",
  "Fine personal possession"
]);

export function wealthBudgetCp(wealthId) {
  return WEALTH_BUDGETS_CP[wealthId] ?? WEALTH_BUDGETS_CP.average;
}

export function currencyValueCp(currency = {}) {
  return (Math.max(0, Math.trunc(Number(currency.pp) || 0)) * 1000)
    + (Math.max(0, Math.trunc(Number(currency.gp) || 0)) * 100)
    + (Math.max(0, Math.trunc(Number(currency.ep) || 0)) * 50)
    + (Math.max(0, Math.trunc(Number(currency.sp) || 0)) * 10)
    + Math.max(0, Math.trunc(Number(currency.cp) || 0));
}

export function currencyFromCopper(totalCp) {
  let remaining = Math.max(0, Math.trunc(Number(totalCp) || 0));
  const currency = { pp: Math.floor(remaining / 1000), gp: 0, ep: 0, sp: 0, cp: 0 };
  remaining -= currency.pp * 1000;
  currency.gp = Math.floor(remaining / 100);
  remaining -= currency.gp * 100;
  currency.sp = Math.floor(remaining / 10);
  currency.cp = remaining - (currency.sp * 10);

  return currency;
}

export function formatCopperValue(valueCp) {
  const currency = currencyFromCopper(valueCp);
  return Object.entries(currency)
    .filter(([, value]) => value > 0)
    .map(([denomination, value]) => `${value} ${denomination}`)
    .join(", ") || "0 cp";
}

function splitInteger(total, count) {
  const safeCount = Math.max(1, Math.trunc(Number(count) || 1));
  const base = Math.floor(total / safeCount);
  let remainder = total - (base * safeCount);
  return Array.from({ length: safeCount }, () => {
    const value = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    return value;
  }).filter((value) => value > 0);
}

export function buildWealthBundle({ wealth = "average", distribution = "mixed" } = {}) {
  const budgetCp = wealthBudgetCp(wealth);
  const mode = WEALTH_DISTRIBUTIONS[distribution] ?? WEALTH_DISTRIBUTIONS.mixed;
  let cashCp = Math.round(budgetCp * mode.cashShare);
  cashCp = Math.max(1, Math.min(budgetCp, cashCp));
  const itemBudgetCp = Math.max(0, budgetCp - cashCp);
  const itemValues = splitInteger(itemBudgetCp, Math.min(mode.itemCount, Math.max(1, itemBudgetCp)));
  const valuables = itemValues.map((valueCp, index) => ({
    name: VALUE_ITEM_NAMES[index % VALUE_ITEM_NAMES.length],
    valueCp
  }));

  return {
    budgetCp,
    cashCp,
    itemBudgetCp,
    currency: currencyFromCopper(cashCp),
    valuables,
    distribution
  };
}
