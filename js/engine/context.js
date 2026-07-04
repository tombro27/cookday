/**
 * User-context normalization.
 *
 * Everything downstream (planner, budget, to-do list) consumes the
 * normalized context produced here, so all input validation and
 * day-type defaults live in one place.
 */

import { ALLERGEN_OPTIONS, INGREDIENTS } from '../data/ingredients.js';

export const DAY_TYPES = ['busy', 'normal', 'relaxed'];
export const DIETS = ['vegan', 'veg', 'egg', 'nonveg'];

/** Minutes available to cook each meal, by how the user's day looks. */
export const TIME_DEFAULTS = {
  busy:    { breakfast: 12, lunch: 25, dinner: 30 },
  normal:  { breakfast: 20, lunch: 35, dinner: 40 },
  relaxed: { breakfast: 35, lunch: 50, dinner: 50 },
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Coerce to a finite number, falling back when the input is junk. */
function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalize raw form values into a safe, complete context object.
 * Unknown allergens / pantry ids are dropped; numbers are clamped to
 * sane ranges so hostile or accidental input can't distort the plan.
 *
 * @param {object} raw
 * @returns {{
 *   dayType: string, diet: string, servings: number, budget: number,
 *   allergies: string[], pantry: string[],
 *   time: {breakfast: number, lunch: number, dinner: number}
 * }}
 */
export function normalizeContext(raw = {}) {
  const dayType = DAY_TYPES.includes(raw.dayType) ? raw.dayType : 'normal';
  const diet = DIETS.includes(raw.diet) ? raw.diet : 'veg';
  const servings = clamp(Math.round(toNumber(raw.servings, 2)), 1, 8);
  const budget = clamp(toNumber(raw.budget, 300), 50, 5000);

  const allergies = [...new Set(
    (Array.isArray(raw.allergies) ? raw.allergies : [])
      .filter((a) => ALLERGEN_OPTIONS.includes(a))
  )];

  const pantry = [...new Set(
    (Array.isArray(raw.pantry) ? raw.pantry : [])
      .filter((id) => Object.hasOwn(INGREDIENTS, id))
  )];

  const defaults = TIME_DEFAULTS[dayType];
  const time = {
    breakfast: clamp(Math.round(toNumber(raw.time?.breakfast, defaults.breakfast)), 5, 120),
    lunch:     clamp(Math.round(toNumber(raw.time?.lunch, defaults.lunch)), 5, 180),
    dinner:    clamp(Math.round(toNumber(raw.time?.dinner, defaults.dinner)), 5, 180),
  };

  return { dayType, diet, servings, budget, allergies, pantry, time };
}
