/**
 * Ingredient catalog.
 *
 * Prices are approximate Indian retail prices (₹) per base unit:
 *   unit 'g'  → price per gram
 *   unit 'ml' → price per millilitre
 *   unit 'pc' → price per piece
 *
 * `allergens` uses the classes: 'dairy', 'gluten', 'nuts', 'egg', 'soy'.
 * `subs` lists substitute ingredient ids in order of preference; the engine
 * checks each substitute against the user's allergies before applying it.
 * `pantryStaple: true` marks items offered on the "already in my kitchen" list.
 */

export const INGREDIENTS = {
  // ── Grains & flours ────────────────────────────────────────────────
  rice:        { name: 'Rice',              category: 'Grains',  unit: 'g',  price: 0.06,  pantryStaple: true },
  atta:        { name: 'Wheat flour (atta)', category: 'Grains', unit: 'g',  price: 0.045, allergens: ['gluten'], subs: ['jowar_flour'], pantryStaple: true },
  jowar_flour: { name: 'Jowar flour',       category: 'Grains',  unit: 'g',  price: 0.07 },
  poha_flakes: { name: 'Poha (rice flakes)', category: 'Grains', unit: 'g',  price: 0.06 },
  rava:        { name: 'Rava (semolina)',   category: 'Grains',  unit: 'g',  price: 0.05,  allergens: ['gluten'] },
  oats:        { name: 'Rolled oats',       category: 'Grains',  unit: 'g',  price: 0.12 },
  vermicelli:  { name: 'Vermicelli',        category: 'Grains',  unit: 'g',  price: 0.08,  allergens: ['gluten'] },
  bread:       { name: 'Bread slices',      category: 'Grains',  unit: 'pc', price: 2.5,   allergens: ['gluten'] },
  besan:       { name: 'Besan (gram flour)', category: 'Grains', unit: 'g',  price: 0.09 },
  idli_batter: { name: 'Idli-dosa batter',  category: 'Grains',  unit: 'g',  price: 0.08 },

  // ── Pulses ─────────────────────────────────────────────────────────
  toor_dal:    { name: 'Toor dal',          category: 'Pulses',  unit: 'g',  price: 0.15, subs: ['moong_dal'] },
  moong_dal:   { name: 'Moong dal',         category: 'Pulses',  unit: 'g',  price: 0.13 },
  masoor_dal:  { name: 'Masoor dal',        category: 'Pulses',  unit: 'g',  price: 0.11 },
  rajma:       { name: 'Rajma (kidney beans)', category: 'Pulses', unit: 'g', price: 0.14 },
  chana:       { name: 'Chole (chickpeas)', category: 'Pulses',  unit: 'g',  price: 0.10 },

  // ── Dairy & proteins ───────────────────────────────────────────────
  milk:        { name: 'Milk',              category: 'Dairy & proteins', unit: 'ml', price: 0.06,  allergens: ['dairy'], subs: ['soy_milk', 'almond_milk'] },
  curd:        { name: 'Curd',              category: 'Dairy & proteins', unit: 'g',  price: 0.08,  allergens: ['dairy'], subs: ['coconut_milk'] },
  paneer:      { name: 'Paneer',            category: 'Dairy & proteins', unit: 'g',  price: 0.40,  allergens: ['dairy'], subs: ['tofu', 'mushroom'] },
  butter:      { name: 'Butter',            category: 'Dairy & proteins', unit: 'g',  price: 0.55,  allergens: ['dairy'], subs: ['oil'] },
  ghee:        { name: 'Ghee',              category: 'Dairy & proteins', unit: 'ml', price: 0.60,  allergens: ['dairy'], subs: ['oil'], pantryStaple: true },
  cheese:      { name: 'Cheese slices',     category: 'Dairy & proteins', unit: 'pc', price: 12,    allergens: ['dairy'] },
  tofu:        { name: 'Tofu',              category: 'Dairy & proteins', unit: 'g',  price: 0.25,  allergens: ['soy'] },
  soy_milk:    { name: 'Soy milk',          category: 'Dairy & proteins', unit: 'ml', price: 0.15,  allergens: ['soy'] },
  almond_milk: { name: 'Almond milk',       category: 'Dairy & proteins', unit: 'ml', price: 0.25,  allergens: ['nuts'] },
  coconut_milk:{ name: 'Coconut milk',      category: 'Dairy & proteins', unit: 'ml', price: 0.20 },
  egg:         { name: 'Eggs',              category: 'Dairy & proteins', unit: 'pc', price: 7,     allergens: ['egg'] },
  chicken:     { name: 'Chicken',           category: 'Dairy & proteins', unit: 'g',  price: 0.25 },
  soy_chunks:  { name: 'Soy chunks',        category: 'Dairy & proteins', unit: 'g',  price: 0.15,  allergens: ['soy'] },

  // ── Vegetables & fruit ─────────────────────────────────────────────
  onion:       { name: 'Onion',             category: 'Vegetables', unit: 'g',  price: 0.035 },
  tomato:      { name: 'Tomato',            category: 'Vegetables', unit: 'g',  price: 0.04 },
  potato:      { name: 'Potato',            category: 'Vegetables', unit: 'g',  price: 0.03 },
  carrot:      { name: 'Carrot',            category: 'Vegetables', unit: 'g',  price: 0.05 },
  beans:       { name: 'French beans',      category: 'Vegetables', unit: 'g',  price: 0.06 },
  capsicum:    { name: 'Capsicum',          category: 'Vegetables', unit: 'g',  price: 0.06 },
  peas:        { name: 'Green peas',        category: 'Vegetables', unit: 'g',  price: 0.12 },
  spinach:     { name: 'Spinach',           category: 'Vegetables', unit: 'g',  price: 0.06 },
  cauliflower: { name: 'Cauliflower',       category: 'Vegetables', unit: 'g',  price: 0.04 },
  mushroom:    { name: 'Mushroom',          category: 'Vegetables', unit: 'g',  price: 0.08 },
  cucumber:    { name: 'Cucumber',          category: 'Vegetables', unit: 'g',  price: 0.04 },
  ginger:      { name: 'Ginger',            category: 'Vegetables', unit: 'g',  price: 0.12 },
  garlic:      { name: 'Garlic',            category: 'Vegetables', unit: 'g',  price: 0.16 },
  green_chili: { name: 'Green chillies',    category: 'Vegetables', unit: 'g',  price: 0.08 },
  coriander:   { name: 'Coriander leaves',  category: 'Vegetables', unit: 'g',  price: 0.10 },
  curry_leaves:{ name: 'Curry leaves',      category: 'Vegetables', unit: 'g',  price: 0.20 },
  lemon:       { name: 'Lemon',             category: 'Vegetables', unit: 'pc', price: 5 },
  banana:      { name: 'Banana',            category: 'Vegetables', unit: 'pc', price: 5 },

  // ── Nuts & extras ──────────────────────────────────────────────────
  peanuts:     { name: 'Peanuts',           category: 'Nuts & extras', unit: 'g', price: 0.12, allergens: ['nuts'] },
  cashew:      { name: 'Cashews',           category: 'Nuts & extras', unit: 'g', price: 0.90, allergens: ['nuts'], subs: ['peanuts'] },
  coconut:     { name: 'Grated coconut',    category: 'Nuts & extras', unit: 'g', price: 0.10 },

  // ── Pantry staples ─────────────────────────────────────────────────
  oil:         { name: 'Cooking oil',       category: 'Pantry', unit: 'ml', price: 0.14, pantryStaple: true },
  salt:        { name: 'Salt',              category: 'Pantry', unit: 'g',  price: 0.02, pantryStaple: true },
  sugar:       { name: 'Sugar',             category: 'Pantry', unit: 'g',  price: 0.045, pantryStaple: true },
  turmeric:    { name: 'Turmeric powder',   category: 'Pantry', unit: 'g',  price: 0.25, pantryStaple: true },
  cumin:       { name: 'Cumin seeds',       category: 'Pantry', unit: 'g',  price: 0.40, pantryStaple: true },
  mustard_seeds:{ name: 'Mustard seeds',    category: 'Pantry', unit: 'g',  price: 0.20, pantryStaple: true },
  chili_powder:{ name: 'Red chilli powder', category: 'Pantry', unit: 'g',  price: 0.35, pantryStaple: true },
  garam_masala:{ name: 'Garam masala',      category: 'Pantry', unit: 'g',  price: 0.50, pantryStaple: true },
};

/** Allergen classes a user can pick in the UI. */
export const ALLERGEN_OPTIONS = ['dairy', 'gluten', 'nuts', 'egg', 'soy'];

/** @returns {string[]} allergen classes for an ingredient id (empty if none). */
export function allergensOf(id) {
  return INGREDIENTS[id]?.allergens ?? [];
}

/** @returns {number} price of `qty` of ingredient `id`, in rupees. */
export function costOf(id, qty) {
  const item = INGREDIENTS[id];
  if (!item) throw new Error(`Unknown ingredient: ${id}`);
  return item.price * qty;
}

/** Ingredient ids offered as "already in my kitchen" checkboxes. */
export const PANTRY_STAPLE_IDS = Object.keys(INGREDIENTS).filter(
  (id) => INGREDIENTS[id].pantryStaple
);
