/**
 * Substitution intelligence, three kinds:
 *   1. Forced swaps      — allergy-driven, already applied by the planner;
 *                          collected here so the UI can explain them.
 *   2. Budget swaps      — cheaper alternatives for the priciest items on
 *                          the shopping list, with the rupee saving.
 *   3. Backup options    — "out of stock? use this instead" hints per item.
 *
 * Every suggestion is re-checked against the user's allergies: a swap
 * that fixes the budget but triggers an allergy is never offered.
 */

import { INGREDIENTS, allergensOf } from '../data/ingredients.js';
import { buyCostOf } from './grocery.js';

const MIN_WORTHWHILE_SAVING = 5; // ₹ — below this a swap is just noise

function safeFor(allergies, id) {
  return !allergensOf(id).some((a) => allergies.includes(a));
}

/** Allergy swaps the planner already applied, deduplicated for display. */
export function collectForcedSwaps(plan) {
  const seen = new Set();
  const out = [];
  for (const slot of plan.slots) {
    for (const swap of slot.swaps ?? []) {
      const key = `${swap.from}->${swap.to}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        from: INGREDIENTS[swap.from].name,
        to: INGREDIENTS[swap.to].name,
        reason: swap.reason,
        recipeName: slot.recipe.name,
      });
    }
  }
  return out;
}

/**
 * Cheaper allergy-safe substitutes for items on the shopping list,
 * biggest saving first.
 *
 * @param {ReturnType<import('./grocery.js').buildGroceryList>} grocery
 * @param {string[]} allergies
 */
export function budgetSwapSuggestions(grocery, allergies) {
  const suggestions = [];
  for (const item of grocery.toBuy) {
    const subs = INGREDIENTS[item.id].subs ?? [];
    for (const subId of subs) {
      if (!safeFor(allergies, subId)) continue;
      const subCost = Math.round(buyCostOf(subId, item.qty));
      const saving = item.estCost - subCost;
      if (saving < MIN_WORTHWHILE_SAVING) continue;
      suggestions.push({
        fromId: item.id,
        from: item.name,
        to: INGREDIENTS[subId].name,
        saving,
        usedIn: item.usedIn,
      });
      break; // first worthwhile safe sub per item is enough
    }
  }
  return suggestions.sort((a, b) => b.saving - a.saving);
}

/**
 * "Couldn't find it at the shop?" backups: for each item to buy, the
 * allergy-safe catalog substitutes, regardless of price.
 */
export function backupOptions(grocery, allergies) {
  const out = [];
  for (const item of grocery.toBuy) {
    const safeSubs = (INGREDIENTS[item.id].subs ?? [])
      .filter((subId) => safeFor(allergies, subId))
      .map((subId) => INGREDIENTS[subId].name);
    if (safeSubs.length > 0) {
      out.push({ item: item.name, options: safeSubs });
    }
  }
  return out;
}
