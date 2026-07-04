/**
 * Recipe catalog.
 *
 * Each recipe lists ingredient quantities PER SERVING in the ingredient's
 * base unit (g / ml / pc) — the engine scales them by the requested servings.
 *
 * `diet` is the strictest classification of the dish:
 *   'vegan' ⊂ 'veg' ⊂ 'egg' ⊂ 'nonveg'  (a veg user can eat vegan + veg, etc.)
 * `hero` names the dominant ingredient, used to avoid repeating the same
 * base across meals in one day. `optional: true` ingredients are dropped
 * silently when they clash with an allergy instead of blocking the recipe.
 * Steps flagged `prepAhead: true` are surfaced as "prep the night before"
 * tasks on the to-do list.
 */

export const RECIPES = [
  // ── Breakfast ──────────────────────────────────────────────────────
  {
    id: 'poha', name: 'Kanda Poha', meals: ['breakfast'], diet: 'vegan',
    timeMins: 15, hero: 'poha', tags: ['light', 'one-pan'],
    ingredients: [
      { id: 'poha_flakes', qty: 60 }, { id: 'onion', qty: 40 },
      { id: 'peanuts', qty: 10, optional: true }, { id: 'green_chili', qty: 3 },
      { id: 'mustard_seeds', qty: 2 }, { id: 'turmeric', qty: 1 },
      { id: 'oil', qty: 10 }, { id: 'salt', qty: 2 }, { id: 'lemon', qty: 0.5 },
      { id: 'curry_leaves', qty: 2, optional: true },
    ],
    steps: [
      'Rinse poha in a colander and let it soften.',
      'Temper mustard seeds, curry leaves, chillies and peanuts in oil.',
      'Add onion; sauté until translucent, then add turmeric and salt.',
      'Fold in poha, steam 2 minutes, finish with lemon juice.',
    ],
  },
  {
    id: 'upma', name: 'Rava Upma', meals: ['breakfast'], diet: 'vegan',
    timeMins: 20, hero: 'rava', tags: ['comfort'],
    ingredients: [
      { id: 'rava', qty: 60 }, { id: 'onion', qty: 30 }, { id: 'carrot', qty: 20 },
      { id: 'peas', qty: 15, optional: true }, { id: 'green_chili', qty: 3 },
      { id: 'mustard_seeds', qty: 2 }, { id: 'oil', qty: 12 }, { id: 'salt', qty: 2 },
      { id: 'curry_leaves', qty: 2, optional: true },
    ],
    steps: [
      'Dry-roast rava until aromatic; set aside.',
      'Temper mustard seeds and curry leaves; sauté onion and vegetables.',
      'Add 2 cups hot water and salt; stream in rava while stirring.',
      'Cover and steam 3 minutes; fluff and serve.',
    ],
  },
  {
    id: 'veg_oats', name: 'Savoury Vegetable Oats', meals: ['breakfast'], diet: 'vegan',
    timeMins: 12, hero: 'oats', tags: ['light', 'high-fibre', 'one-pan'],
    ingredients: [
      { id: 'oats', qty: 50 }, { id: 'onion', qty: 25 }, { id: 'tomato', qty: 40 },
      { id: 'carrot', qty: 20 }, { id: 'cumin', qty: 2 }, { id: 'oil', qty: 8 },
      { id: 'salt', qty: 2 }, { id: 'turmeric', qty: 1 },
    ],
    steps: [
      'Sauté cumin, onion and vegetables in oil for 3 minutes.',
      'Add oats, turmeric, salt and 1.5 cups water.',
      'Simmer 5 minutes until creamy.',
    ],
  },
  {
    id: 'besan_chilla', name: 'Besan Chilla', meals: ['breakfast'], diet: 'vegan',
    timeMins: 15, hero: 'besan', tags: ['high-protein', 'gluten-free'],
    ingredients: [
      { id: 'besan', qty: 50 }, { id: 'onion', qty: 30 }, { id: 'tomato', qty: 30 },
      { id: 'green_chili', qty: 3 }, { id: 'coriander', qty: 5, optional: true },
      { id: 'oil', qty: 10 }, { id: 'salt', qty: 2 }, { id: 'turmeric', qty: 1 },
    ],
    steps: [
      'Whisk besan with water, salt, turmeric into a pourable batter.',
      'Stir in chopped onion, tomato, chillies and coriander.',
      'Cook ladlefuls on an oiled pan, 2 minutes per side.',
    ],
  },
  {
    id: 'veg_sandwich', name: 'Grilled Veg Sandwich', meals: ['breakfast'], diet: 'veg',
    timeMins: 10, hero: 'bread', tags: ['quick', 'no-fuss'],
    ingredients: [
      { id: 'bread', qty: 3 }, { id: 'cucumber', qty: 40 }, { id: 'tomato', qty: 40 },
      { id: 'onion', qty: 20 }, { id: 'butter', qty: 10 },
      { id: 'cheese', qty: 1, optional: true }, { id: 'salt', qty: 1 },
    ],
    steps: [
      'Butter the bread and layer sliced vegetables; season.',
      'Add cheese if using; grill or toast until golden.',
    ],
  },
  {
    id: 'masala_omelette', name: 'Masala Omelette & Toast', meals: ['breakfast'], diet: 'egg',
    timeMins: 10, hero: 'egg', tags: ['high-protein', 'quick'],
    ingredients: [
      { id: 'egg', qty: 2 }, { id: 'bread', qty: 2 }, { id: 'onion', qty: 20 },
      { id: 'tomato', qty: 20 }, { id: 'green_chili', qty: 2 },
      { id: 'oil', qty: 8 }, { id: 'salt', qty: 1 },
    ],
    steps: [
      'Whisk eggs with chopped onion, tomato, chillies and salt.',
      'Cook the omelette 2 minutes per side; toast the bread.',
    ],
  },
  {
    id: 'vermicelli_upma', name: 'Vermicelli Upma', meals: ['breakfast'], diet: 'vegan',
    timeMins: 15, hero: 'vermicelli', tags: ['light'],
    ingredients: [
      { id: 'vermicelli', qty: 60 }, { id: 'onion', qty: 30 }, { id: 'carrot', qty: 20 },
      { id: 'beans', qty: 20 }, { id: 'mustard_seeds', qty: 2 }, { id: 'oil', qty: 10 },
      { id: 'salt', qty: 2 }, { id: 'lemon', qty: 0.5 },
    ],
    steps: [
      'Roast vermicelli until golden; set aside.',
      'Temper mustard seeds; sauté onion and vegetables.',
      'Add water, salt and vermicelli; cook until absorbed. Finish with lemon.',
    ],
  },
  {
    id: 'idli', name: 'Idli with Coconut Chutney', meals: ['breakfast'], diet: 'vegan',
    timeMins: 25, hero: 'idli_batter', tags: ['steamed', 'gluten-free'],
    ingredients: [
      { id: 'idli_batter', qty: 150 }, { id: 'coconut', qty: 30 },
      { id: 'green_chili', qty: 3 }, { id: 'curry_leaves', qty: 2, optional: true },
      { id: 'mustard_seeds', qty: 2 }, { id: 'oil', qty: 5 }, { id: 'salt', qty: 2 },
    ],
    steps: [
      'Steam ladlefuls of batter in an idli stand for 12 minutes.',
      'Blend coconut, chillies and salt into a chutney.',
      'Temper mustard seeds and curry leaves; pour over the chutney.',
    ],
  },
  {
    id: 'aloo_paratha', name: 'Aloo Paratha with Curd', meals: ['breakfast'], diet: 'veg',
    timeMins: 35, hero: 'potato', tags: ['hearty', 'weekend'],
    ingredients: [
      { id: 'atta', qty: 80 }, { id: 'potato', qty: 100 }, { id: 'curd', qty: 60 },
      { id: 'green_chili', qty: 3 }, { id: 'coriander', qty: 5, optional: true },
      { id: 'ghee', qty: 10 }, { id: 'salt', qty: 2 }, { id: 'garam_masala', qty: 1 },
    ],
    steps: [
      { text: 'Boil the potatoes (can be done the night before).', prepAhead: true },
      'Knead a soft dough with atta, water and salt.',
      'Mash potatoes with spices; stuff, roll and roast parathas in ghee.',
      'Serve hot with curd.',
    ],
  },

  // ── Lunch ──────────────────────────────────────────────────────────
  {
    id: 'dal_rice', name: 'Dal Tadka with Rice', meals: ['lunch', 'dinner'], diet: 'vegan',
    timeMins: 35, hero: 'dal', tags: ['comfort', 'high-protein'],
    ingredients: [
      { id: 'toor_dal', qty: 60 }, { id: 'rice', qty: 80 }, { id: 'onion', qty: 30 },
      { id: 'tomato', qty: 40 }, { id: 'garlic', qty: 5 }, { id: 'cumin', qty: 2 },
      { id: 'turmeric', qty: 1 }, { id: 'oil', qty: 10 }, { id: 'salt', qty: 3 },
    ],
    steps: [
      'Pressure-cook dal with turmeric and salt (3 whistles).',
      'Cook rice separately.',
      'Temper cumin, garlic, onion and tomato in oil; pour over the dal.',
    ],
  },
  {
    id: 'rajma_chawal', name: 'Rajma Chawal', meals: ['lunch'], diet: 'vegan',
    timeMins: 45, hero: 'rajma', tags: ['hearty', 'high-protein'],
    ingredients: [
      { id: 'rajma', qty: 60 }, { id: 'rice', qty: 80 }, { id: 'onion', qty: 50 },
      { id: 'tomato', qty: 60 }, { id: 'ginger', qty: 5 }, { id: 'garlic', qty: 5 },
      { id: 'garam_masala', qty: 2 }, { id: 'oil', qty: 12 }, { id: 'salt', qty: 3 },
    ],
    steps: [
      { text: 'Soak rajma overnight in plenty of water.', prepAhead: true },
      'Pressure-cook soaked rajma until soft (5–6 whistles).',
      'Simmer in an onion–tomato–ginger–garlic gravy with garam masala.',
      'Serve over steamed rice.',
    ],
  },
  {
    id: 'veg_pulao', name: 'Vegetable Pulao with Raita', meals: ['lunch'], diet: 'veg',
    timeMins: 30, hero: 'rice', tags: ['one-pot'],
    ingredients: [
      { id: 'rice', qty: 80 }, { id: 'carrot', qty: 30 }, { id: 'beans', qty: 30 },
      { id: 'peas', qty: 25 }, { id: 'onion', qty: 40 }, { id: 'curd', qty: 80 },
      { id: 'cumin', qty: 2 }, { id: 'garam_masala', qty: 2 }, { id: 'oil', qty: 12 },
      { id: 'salt', qty: 3 }, { id: 'cashew', qty: 8, optional: true },
    ],
    steps: [
      'Sauté cumin, onion and vegetables; add rice and 2 cups water.',
      'Cook covered on low until the rice is done.',
      'Whisk curd with salt for raita; top the pulao with cashews.',
    ],
  },
  {
    id: 'chole_rice', name: 'Chole with Rice', meals: ['lunch'], diet: 'vegan',
    timeMins: 45, hero: 'chana', tags: ['hearty', 'high-protein'],
    ingredients: [
      { id: 'chana', qty: 60 }, { id: 'rice', qty: 80 }, { id: 'onion', qty: 50 },
      { id: 'tomato', qty: 60 }, { id: 'ginger', qty: 5 }, { id: 'garam_masala', qty: 2 },
      { id: 'oil', qty: 12 }, { id: 'salt', qty: 3 },
    ],
    steps: [
      { text: 'Soak chickpeas overnight.', prepAhead: true },
      'Pressure-cook chickpeas until tender.',
      'Simmer in a spiced onion–tomato masala.',
      'Serve with steamed rice.',
    ],
  },
  {
    id: 'curd_rice', name: 'Curd Rice with Tempering', meals: ['lunch'], diet: 'veg',
    timeMins: 20, hero: 'rice', tags: ['light', 'cooling', 'gluten-free'],
    ingredients: [
      { id: 'rice', qty: 70 }, { id: 'curd', qty: 150 }, { id: 'mustard_seeds', qty: 2 },
      { id: 'ginger', qty: 3 }, { id: 'green_chili', qty: 2 },
      { id: 'curry_leaves', qty: 2, optional: true }, { id: 'oil', qty: 6 }, { id: 'salt', qty: 2 },
    ],
    steps: [
      'Cook rice soft and let it cool slightly.',
      'Mix in whisked curd and salt.',
      'Temper mustard seeds, ginger, chillies and curry leaves; fold in.',
    ],
  },
  {
    id: 'khichdi', name: 'Moong Dal Khichdi', meals: ['lunch', 'dinner'], diet: 'vegan',
    timeMins: 25, hero: 'dal', tags: ['one-pot', 'comfort', 'gluten-free'],
    ingredients: [
      { id: 'moong_dal', qty: 40 }, { id: 'rice', qty: 60 }, { id: 'turmeric', qty: 1 },
      { id: 'cumin', qty: 2 }, { id: 'ginger', qty: 3 }, { id: 'ghee', qty: 10 },
      { id: 'salt', qty: 3 }, { id: 'peas', qty: 20, optional: true },
    ],
    steps: [
      'Rinse rice and dal together.',
      'Pressure-cook with turmeric, salt and 3 cups water (3 whistles).',
      'Temper cumin and ginger in ghee; stir through.',
    ],
  },
  {
    id: 'chicken_curry', name: 'Home-style Chicken Curry with Rice', meals: ['lunch', 'dinner'], diet: 'nonveg',
    timeMins: 45, hero: 'chicken', tags: ['hearty', 'high-protein'],
    ingredients: [
      { id: 'chicken', qty: 150 }, { id: 'rice', qty: 80 }, { id: 'onion', qty: 60 },
      { id: 'tomato', qty: 60 }, { id: 'ginger', qty: 5 }, { id: 'garlic', qty: 8 },
      { id: 'curd', qty: 30, optional: true }, { id: 'garam_masala', qty: 2 },
      { id: 'chili_powder', qty: 2 }, { id: 'oil', qty: 15 }, { id: 'salt', qty: 3 },
    ],
    steps: [
      'Brown onions; add ginger–garlic, tomatoes and spices.',
      'Add chicken and sear, then simmer covered 25 minutes.',
      'Serve with steamed rice.',
    ],
  },
  {
    id: 'palak_paneer', name: 'Palak Paneer with Roti', meals: ['lunch', 'dinner'], diet: 'veg',
    timeMins: 40, hero: 'paneer', tags: ['iron-rich'],
    ingredients: [
      { id: 'spinach', qty: 150 }, { id: 'paneer', qty: 80 }, { id: 'atta', qty: 60 },
      { id: 'onion', qty: 40 }, { id: 'tomato', qty: 40 }, { id: 'garlic', qty: 5 },
      { id: 'garam_masala', qty: 2 }, { id: 'oil', qty: 12 }, { id: 'salt', qty: 3 },
    ],
    steps: [
      'Blanch and purée the spinach.',
      'Sauté onion, garlic and tomato; add purée and spices.',
      'Fold in paneer cubes; simmer 5 minutes.',
      'Knead atta dough and roast fresh rotis.',
    ],
  },
  {
    id: 'lemon_rice', name: 'Lemon Rice with Peanuts', meals: ['lunch'], diet: 'vegan',
    timeMins: 20, hero: 'rice', tags: ['quick', 'tangy', 'gluten-free'],
    ingredients: [
      { id: 'rice', qty: 80 }, { id: 'lemon', qty: 1 }, { id: 'peanuts', qty: 15, optional: true },
      { id: 'mustard_seeds', qty: 2 }, { id: 'turmeric', qty: 1 },
      { id: 'curry_leaves', qty: 2, optional: true }, { id: 'green_chili', qty: 3 },
      { id: 'oil', qty: 10 }, { id: 'salt', qty: 2 },
    ],
    steps: [
      'Cook rice and spread it to cool.',
      'Temper mustard seeds, peanuts, chillies, curry leaves and turmeric.',
      'Toss rice with the tempering, lemon juice and salt.',
    ],
  },
  {
    id: 'egg_curry', name: 'Egg Curry with Rice', meals: ['lunch', 'dinner'], diet: 'egg',
    timeMins: 35, hero: 'egg', tags: ['high-protein'],
    ingredients: [
      { id: 'egg', qty: 2 }, { id: 'rice', qty: 80 }, { id: 'onion', qty: 50 },
      { id: 'tomato', qty: 50 }, { id: 'ginger', qty: 5 }, { id: 'garlic', qty: 5 },
      { id: 'garam_masala', qty: 2 }, { id: 'oil', qty: 12 }, { id: 'salt', qty: 3 },
    ],
    steps: [
      'Hard-boil and halve the eggs.',
      'Simmer an onion–tomato gravy with the spices.',
      'Slide in the eggs; cook 5 minutes. Serve with rice.',
    ],
  },

  // ── Dinner ─────────────────────────────────────────────────────────
  {
    id: 'roti_sabzi', name: 'Roti with Mixed Veg Sabzi', meals: ['dinner'], diet: 'vegan',
    timeMins: 35, hero: 'atta', tags: ['balanced', 'classic'],
    ingredients: [
      { id: 'atta', qty: 80 }, { id: 'potato', qty: 60 }, { id: 'cauliflower', qty: 80 },
      { id: 'peas', qty: 25 }, { id: 'onion', qty: 30 }, { id: 'tomato', qty: 40 },
      { id: 'turmeric', qty: 1 }, { id: 'chili_powder', qty: 1 },
      { id: 'oil', qty: 12 }, { id: 'salt', qty: 3 },
    ],
    steps: [
      'Knead a soft atta dough and rest it.',
      'Sauté onion, then vegetables and spices; cover and cook 12 minutes.',
      'Roll and roast rotis on a hot tawa.',
    ],
  },
  {
    id: 'paneer_bhurji', name: 'Paneer Bhurji with Roti', meals: ['dinner'], diet: 'veg',
    timeMins: 25, hero: 'paneer', tags: ['high-protein', 'quick'],
    ingredients: [
      { id: 'paneer', qty: 80 }, { id: 'atta', qty: 60 }, { id: 'onion', qty: 40 },
      { id: 'tomato', qty: 40 }, { id: 'capsicum', qty: 30 }, { id: 'green_chili', qty: 3 },
      { id: 'turmeric', qty: 1 }, { id: 'oil', qty: 10 }, { id: 'salt', qty: 2 },
    ],
    steps: [
      'Sauté onion, capsicum, chillies and tomato.',
      'Crumble in paneer with turmeric and salt; cook 3 minutes.',
      'Serve with fresh rotis.',
    ],
  },
  {
    id: 'veg_fried_rice', name: 'Veg Fried Rice', meals: ['dinner'], diet: 'vegan',
    timeMins: 25, hero: 'rice', tags: ['one-pan', 'quick'],
    ingredients: [
      { id: 'rice', qty: 80 }, { id: 'carrot', qty: 30 }, { id: 'beans', qty: 30 },
      { id: 'capsicum', qty: 30 }, { id: 'garlic', qty: 5 }, { id: 'onion', qty: 30 },
      { id: 'oil', qty: 12 }, { id: 'salt', qty: 2 },
    ],
    steps: [
      { text: 'Cook and chill the rice (day-old rice works best).', prepAhead: true },
      'Stir-fry garlic, onion and vegetables on high heat.',
      'Toss in the rice with salt; fry 3 minutes.',
    ],
  },
  {
    id: 'dal_roti', name: 'Masoor Dal with Roti & Salad', meals: ['dinner'], diet: 'vegan',
    timeMins: 30, hero: 'dal', tags: ['balanced', 'budget'],
    ingredients: [
      { id: 'masoor_dal', qty: 60 }, { id: 'atta', qty: 80 }, { id: 'onion', qty: 30 },
      { id: 'tomato', qty: 40 }, { id: 'cucumber', qty: 50 }, { id: 'cumin', qty: 2 },
      { id: 'turmeric', qty: 1 }, { id: 'oil', qty: 10 }, { id: 'salt', qty: 3 },
      { id: 'lemon', qty: 0.5 },
    ],
    steps: [
      'Pressure-cook masoor dal with turmeric and salt.',
      'Temper cumin, onion and tomato; add to the dal.',
      'Roast rotis; slice cucumber–onion salad with lemon.',
    ],
  },
  {
    id: 'grilled_chicken', name: 'Grilled Chicken with Sautéed Veggies', meals: ['dinner'], diet: 'nonveg',
    timeMins: 35, hero: 'chicken', tags: ['high-protein', 'low-carb'],
    ingredients: [
      { id: 'chicken', qty: 180 }, { id: 'capsicum', qty: 50 }, { id: 'carrot', qty: 40 },
      { id: 'beans', qty: 40 }, { id: 'garlic', qty: 8 }, { id: 'curd', qty: 40 },
      { id: 'chili_powder', qty: 2 }, { id: 'oil', qty: 12 }, { id: 'salt', qty: 3 },
      { id: 'lemon', qty: 0.5 },
    ],
    steps: [
      { text: 'Marinate chicken in curd, garlic and spices (30+ minutes ahead).', prepAhead: true },
      'Grill or pan-sear the chicken 6–7 minutes per side.',
      'Sauté the vegetables in the same pan; finish with lemon.',
    ],
  },
  {
    id: 'soy_curry', name: 'Soy Chunk Curry with Rice', meals: ['dinner'], diet: 'vegan',
    timeMins: 30, hero: 'soy_chunks', tags: ['high-protein', 'budget'],
    ingredients: [
      { id: 'soy_chunks', qty: 40 }, { id: 'rice', qty: 80 }, { id: 'onion', qty: 50 },
      { id: 'tomato', qty: 50 }, { id: 'ginger', qty: 5 }, { id: 'garlic', qty: 5 },
      { id: 'garam_masala', qty: 2 }, { id: 'oil', qty: 12 }, { id: 'salt', qty: 3 },
    ],
    steps: [
      'Soak soy chunks in hot water; squeeze dry.',
      'Simmer in an onion–tomato–ginger–garlic gravy.',
      'Serve over steamed rice.',
    ],
  },
  {
    id: 'tomato_soup_sandwich', name: 'Tomato Soup & Toasted Sandwich', meals: ['dinner'], diet: 'veg',
    timeMins: 25, hero: 'tomato', tags: ['light', 'cozy'],
    ingredients: [
      { id: 'tomato', qty: 150 }, { id: 'onion', qty: 20 }, { id: 'garlic', qty: 5 },
      { id: 'butter', qty: 10 }, { id: 'bread', qty: 2 }, { id: 'cucumber', qty: 30 },
      { id: 'salt', qty: 2 }, { id: 'sugar', qty: 2 },
    ],
    steps: [
      'Simmer tomatoes, onion and garlic; blend and strain.',
      'Finish the soup with butter, salt and a pinch of sugar.',
      'Toast cucumber sandwiches alongside.',
    ],
  },
];

/** @returns {object|undefined} recipe by id. */
export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}
