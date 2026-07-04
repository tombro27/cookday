/**
 * Meal planner — the decision core.
 *
 * For each meal slot it:
 *   1. filters recipes by diet compatibility and allergy safety
 *      (applying ingredient substitutions where the catalog allows),
 *   2. filters by the time the user actually has for that meal,
 *   3. scores the survivors on cost, speed, pantry overlap and variety
 *      with weights that shift based on the user's day,
 *   4. picks deterministically and records *why* — every choice ships
 *      with human-readable reasons.
 */

import { INGREDIENTS, allergensOf, isAllergySafe } from '../data/ingredients.js';
import { RECIPES } from '../data/recipes.js';
import { normalizeContext, MEAL_SLOTS } from './context.js';
import { buyCostOf } from './grocery.js';

export const SLOTS = MEAL_SLOTS;

/**
 * Share of the day's grocery budget each meal is nudged towards.
 * When the user plans only some meals, the selected shares are
 * renormalized so they still split the whole budget.
 */
const BUDGET_SHARE = { breakfast: 0.25, lunch: 0.375, dinner: 0.375 };

function budgetShareFor(slot, meals) {
  const selectedTotal = meals.reduce((sum, m) => sum + BUDGET_SHARE[m], 0);
  return BUDGET_SHARE[slot] / selectedTotal;
}

/** Diet hierarchy: a user at rank N can eat any recipe of rank ≤ N. */
const DIET_RANK = { vegan: 0, veg: 1, egg: 2, nonveg: 3 };

/**
 * Scoring weights, picked by day context.
 * `indulge` flips the time score: on a relaxed day a longer, heartier dish
 * is a feature, not a cost. `minimizeCost` (budget-first re-plan) switches
 * the cost score from "fits your budget" to "cheapest available".
 */
const WEIGHTS = {
  normal:  { cost: 0.35, time: 0.25, pantry: 0.20, variety: 0.20 },
  busy:    { cost: 0.25, time: 0.40, pantry: 0.15, variety: 0.20 },
  relaxed: { cost: 0.30, time: 0.20, pantry: 0.15, variety: 0.35, indulge: true },
  budgetFirst: { cost: 0.55, time: 0.15, pantry: 0.15, variety: 0.15, minimizeCost: true },
};

/** @returns {boolean} whether a user on `userDiet` can eat a `recipeDiet` dish. */
export function dietAllows(userDiet, recipeDiet) {
  return DIET_RANK[recipeDiet] <= DIET_RANK[userDiet];
}

/**
 * Resolve a recipe's ingredients against the user's allergies.
 * Optional clashing ingredients are dropped (and recorded, so the to-do
 * list can warn the cook); required ones are swapped to the first catalog
 * substitute that is itself allergy-safe.
 *
 * @returns {{ok: true, ingredients: Array, swaps: Array, dropped: Array}
 *         | {ok: false, blockedBy: string}}
 */
export function resolveIngredients(recipe, allergies) {
  const ingredients = [];
  const swaps = [];
  const dropped = [];

  for (const ing of recipe.ingredients) {
    const clash = allergensOf(ing.id).filter((a) => allergies.includes(a));
    if (clash.length === 0) {
      ingredients.push({ ...ing });
      continue;
    }
    if (ing.optional) {
      dropped.push({ id: ing.id, reason: clash.join(', '), recipeId: recipe.id });
      continue;
    }

    const safeSub = (INGREDIENTS[ing.id].subs ?? []).find((subId) =>
      isAllergySafe(allergies, subId)
    );
    if (!safeSub) return { ok: false, blockedBy: INGREDIENTS[ing.id].name };

    ingredients.push({ ...ing, id: safeSub, subbedFrom: ing.id });
    swaps.push({
      from: ing.id,
      to: safeSub,
      reason: `${clash.join(', ')}-free`,
      recipeId: recipe.id,
    });
  }
  return { ok: true, ingredients, swaps, dropped };
}

/** Rupees the user would need to SPEND for these ingredients (pantry items are free). */
function spendFor(ingredients, servings, pantry) {
  return ingredients.reduce((sum, ing) => {
    if (pantry.includes(ing.id)) return sum;
    return sum + buyCostOf(ing.id, ing.qty * servings);
  }, 0);
}

/**
 * All recipes a user could cook in a slot, with resolved ingredients and
 * spend estimates — before time filtering, so callers can also relax time.
 */
function slotCandidates(slot, ctx) {
  const out = [];
  for (const recipe of RECIPES) {
    if (!recipe.meals.includes(slot)) continue;
    if (!dietAllows(ctx.diet, recipe.diet)) continue;
    const resolved = resolveIngredients(recipe, ctx.allergies);
    if (!resolved.ok) continue;
    out.push({
      recipe,
      ingredients: resolved.ingredients,
      swaps: resolved.swaps,
      dropped: resolved.dropped,
      spend: spendFor(resolved.ingredients, ctx.servings, ctx.pantry),
    });
  }
  return out;
}

function scoreCandidate(cand, slot, ctx, usedHeroes, weights, maxPoolSpend) {
  const slotTime = ctx.time[slot];
  const budgetShare = Math.max(1, ctx.budget * budgetShareFor(slot, ctx.meals));

  // Cost is a constraint, not a race to the bottom: anything within the
  // meal's budget share scores full marks, then tapers off as the overshoot
  // grows. Budget-first mode instead rewards the cheapest of the pool, so a
  // re-plan always has a gradient to follow even when nothing fits.
  const costScore = weights.minimizeCost
    ? 1 - (maxPoolSpend > 0 ? cand.spend / maxPoolSpend : 0)
    : Math.max(0, Math.min(1, 1 - (cand.spend - budgetShare) / (budgetShare * 2)));

  // Busy/normal days reward speed; relaxed days reward making an occasion
  // of the time available.
  const timeRatio = Math.min(1, cand.recipe.timeMins / slotTime);
  const timeScore = weights.indulge ? timeRatio : 1 - timeRatio;

  const pantryCount = cand.ingredients.filter((i) => ctx.pantry.includes(i.id)).length;
  const pantryScore = cand.ingredients.length ? pantryCount / cand.ingredients.length : 0;
  const varietyScore = usedHeroes.has(cand.recipe.hero) ? 0 : 1;

  return (
    weights.cost * costScore +
    weights.time * timeScore +
    weights.pantry * pantryScore +
    weights.variety * varietyScore
  );
}

function buildReasons(cand, slot, ctx, usedHeroes) {
  const reasons = [];
  const slotTime = ctx.time[slot];
  if (cand.recipe.timeMins <= slotTime) {
    reasons.push(`Ready in ${cand.recipe.timeMins} min — fits your ${slotTime}-min window`);
  } else {
    reasons.push(`Closest fit for your ${slotTime}-min window (needs ${cand.recipe.timeMins} min)`);
  }
  reasons.push(`Costs about ₹${Math.round(cand.spend)} to shop for ${ctx.servings} serving(s)`);

  const pantryCount = cand.ingredients.filter((i) => ctx.pantry.includes(i.id)).length;
  if (pantryCount > 0) {
    reasons.push(`Uses ${pantryCount} item(s) already in your kitchen`);
  }
  if (usedHeroes.size > 0 && !usedHeroes.has(cand.recipe.hero)) {
    reasons.push('Different base from your other meals for variety');
  }
  for (const swap of cand.swaps) {
    reasons.push(
      `Swapped ${INGREDIENTS[swap.from].name} → ${INGREDIENTS[swap.to].name} (${swap.reason})`
    );
  }
  for (const drop of cand.dropped) {
    reasons.push(`Left out ${INGREDIENTS[drop.id].name} (${drop.reason})`);
  }
  return reasons;
}

/**
 * Plan a full day.
 *
 * @param {object} rawContext values straight from the form (or the AI parser)
 * @param {{budgetFirst?: boolean}} [opts] budgetFirst re-weights scoring to
 *   favour cheaper dishes — used by the "optimize for budget" action.
 * @returns {{context: object, slots: Array, budgetFirst: boolean}}
 */
export function planDay(rawContext, opts = {}) {
  const ctx = normalizeContext(rawContext);
  const weights = opts.budgetFirst ? WEIGHTS.budgetFirst : WEIGHTS[ctx.dayType];
  const usedHeroes = new Set();
  const usedRecipeIds = new Set();
  const slots = [];

  for (const slot of ctx.meals) {
    const all = slotCandidates(slot, ctx).filter((c) => !usedRecipeIds.has(c.recipe.id));
    let pool = all.filter((c) => c.recipe.timeMins <= ctx.time[slot]);
    const timeRelaxed = pool.length === 0 && all.length > 0;
    if (timeRelaxed) pool = all; // nothing fits the window: offer the closest anyway

    if (pool.length === 0) {
      slots.push({
        slot,
        recipe: null,
        note: 'No recipe in the catalog fits this diet + allergy combination.',
      });
      continue;
    }

    const maxPoolSpend = Math.max(...pool.map((c) => c.spend));
    const ranked = pool
      .map((cand) => ({ cand, score: scoreCandidate(cand, slot, ctx, usedHeroes, weights, maxPoolSpend) }))
      .sort(
        (a, b) =>
          // Once nothing fits the window, the shortest recipe wins outright —
          // it keeps the "closest fit" explanation honest.
          (timeRelaxed ? a.cand.recipe.timeMins - b.cand.recipe.timeMins : 0) ||
          b.score - a.score ||
          a.cand.spend - b.cand.spend ||
          a.cand.recipe.name.localeCompare(b.cand.recipe.name)
      );

    const best = ranked[0].cand;
    const reasons = buildReasons(best, slot, ctx, usedHeroes);
    usedHeroes.add(best.recipe.hero);
    usedRecipeIds.add(best.recipe.id);

    slots.push({
      slot,
      recipe: best.recipe,
      ingredients: best.ingredients,
      swaps: best.swaps,
      dropped: best.dropped,
      spend: best.spend,
      timeRelaxed,
      reasons,
      alternatives: ranked.slice(1, 3).map(({ cand }) => ({
        id: cand.recipe.id,
        name: cand.recipe.name,
        timeMins: cand.recipe.timeMins,
        spend: cand.spend,
      })),
    });
  }

  return { context: ctx, slots, budgetFirst: Boolean(opts.budgetFirst) };
}
