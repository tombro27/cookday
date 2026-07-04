/**
 * Budget feasibility — compares the day's shopping estimate against the
 * user's budget and, when it doesn't fit, works out concrete ways back
 * under: ingredient swaps and cheaper dishes for the costliest slots.
 */

import { budgetSwapSuggestions } from './substitutions.js';

/** "₹1,234" — Indian-locale rupee formatting. */
export function formatINR(amount) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

const STATUS = {
  comfortable: (spend, budget) =>
    `Comfortably within budget — ${formatINR(spend)} of ${formatINR(budget)}, ` +
    `${formatINR(budget - spend)} to spare.`,
  tight: (spend, budget) =>
    `Just fits — ${formatINR(spend)} of your ${formatINR(budget)} budget. ` +
    `The swaps below add breathing room.`,
  over: (spend, budget) =>
    `Over budget by ${formatINR(spend - budget)} (${formatINR(spend)} vs ${formatINR(budget)}). ` +
    `Here's how to close the gap:`,
};

/**
 * Assess feasibility of the plan's shopping list against the budget.
 *
 * @param {ReturnType<import('./planner.js').planDay>} plan
 * @param {ReturnType<import('./grocery.js').buildGroceryList>} grocery
 * @returns {{
 *   spend: number, budget: number, ratio: number,
 *   status: 'comfortable'|'tight'|'over', message: string,
 *   swaps: Array, cheaperDishes: Array, afterSwapsSpend: number
 * }}
 */
export function assessBudget(plan, grocery) {
  const budget = plan.context.budget;
  const spend = grocery.toBuyTotal;
  const ratio = budget > 0 ? spend / budget : 0;

  const status = ratio <= 0.85 ? 'comfortable' : ratio <= 1 ? 'tight' : 'over';
  const swaps = status === 'comfortable' ? [] : budgetSwapSuggestions(grocery, plan.context.allergies);
  const afterSwapsSpend = spend - swaps.reduce((sum, s) => sum + s.saving, 0);

  // Cheaper dish alternatives, most impactful slot first.
  const cheaperDishes =
    status === 'over'
      ? plan.slots
          .filter((s) => s.recipe)
          .flatMap((s) =>
            s.alternatives
              .filter((alt) => alt.spend < s.spend)
              .slice(0, 1)
              .map((alt) => ({
                slot: s.slot,
                from: s.recipe.name,
                to: alt.name,
                saving: Math.round(s.spend - alt.spend),
              }))
          )
          .filter((d) => d.saving >= 5)
          .sort((a, b) => b.saving - a.saving)
      : [];

  return {
    spend,
    budget,
    ratio,
    status,
    message: STATUS[status](spend, budget),
    swaps,
    cheaperDishes,
    afterSwapsSpend,
  };
}
