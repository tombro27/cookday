/**
 * Grocery list builder — aggregates the day's resolved ingredients,
 * scales them by servings, separates what the user already has, and
 * prices what needs to be bought.
 */

import { INGREDIENTS } from '../data/ingredients.js';

/**
 * Quantity you actually purchase: piece-based items are bought whole
 * (you can't buy half a lemon), weight/volume items as measured.
 */
export function buyQtyOf(id, qty) {
  const item = INGREDIENTS[id];
  if (!item) throw new Error(`Unknown ingredient: ${id}`);
  return item.unit === 'pc' ? Math.ceil(qty) : qty;
}

/** Rupees to buy `qty` of ingredient `id` (piece items rounded up). */
export function buyCostOf(id, qty) {
  return INGREDIENTS[id].price * buyQtyOf(id, qty);
}

/** "600 g", "1.2 kg", "250 ml", "1 L", "2 pc" — human-friendly quantities. */
export function formatQty(id, qty) {
  const { unit } = INGREDIENTS[id];
  if (unit === 'pc') return `${Math.ceil(qty)} pc`;
  const big = unit === 'g' ? 'kg' : 'L';
  if (qty >= 1000) {
    const n = qty / 1000;
    return `${Number.isInteger(n) ? n : n.toFixed(1)} ${big}`;
  }
  return `${Math.round(qty)} ${unit}`;
}

/**
 * Build the day's grocery list from a plan.
 *
 * @param {ReturnType<import('./planner.js').planDay>} plan
 * @returns {{
 *   groups: Array<{category: string, items: Array}>,
 *   toBuy: Array, inPantry: Array, toBuyTotal: number
 * }}
 */
export function buildGroceryList(plan) {
  const { servings, pantry } = plan.context;
  const byId = new Map();

  for (const slot of plan.slots) {
    if (!slot.recipe) continue;
    for (const ing of slot.ingredients) {
      const entry = byId.get(ing.id) ?? { id: ing.id, qty: 0, usedIn: [] };
      entry.qty += ing.qty * servings;
      if (!entry.usedIn.includes(slot.recipe.name)) entry.usedIn.push(slot.recipe.name);
      byId.set(ing.id, entry);
    }
  }

  const items = [...byId.values()].map((entry) => {
    const meta = INGREDIENTS[entry.id];
    const inPantry = pantry.includes(entry.id);
    return {
      ...entry,
      name: meta.name,
      category: meta.category,
      displayQty: formatQty(entry.id, entry.qty),
      estCost: inPantry ? 0 : Math.round(buyCostOf(entry.id, entry.qty)),
      inPantry,
    };
  });

  const toBuy = items.filter((i) => !i.inPantry);
  const inPantry = items.filter((i) => i.inPantry);
  const toBuyTotal = toBuy.reduce((sum, i) => sum + i.estCost, 0);

  // Stable category order for a natural shopping walk-through.
  const categoryOrder = ['Vegetables', 'Grains', 'Pulses', 'Dairy & proteins', 'Nuts & extras', 'Pantry'];
  const groups = categoryOrder
    .map((category) => ({
      category,
      items: toBuy
        .filter((i) => i.category === category)
        .sort((a, b) => b.estCost - a.estCost),
    }))
    .filter((g) => g.items.length > 0);

  return { groups, toBuy, inPantry, toBuyTotal };
}
