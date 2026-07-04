import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planDay, dietAllows, resolveIngredients, SLOTS } from '../js/engine/planner.js';
import { recipeById, RECIPES } from '../js/data/recipes.js';
import { allergensOf } from '../js/data/ingredients.js';

test('plans all three meals for a default day', () => {
  const plan = planDay({});
  assert.equal(plan.slots.length, 3);
  for (const slot of plan.slots) {
    assert.ok(slot.recipe, `${slot.slot} should have a recipe`);
    assert.ok(slot.reasons.length > 0, 'every choice is explained');
  }
});

test('diet hierarchy: vegan ⊂ veg ⊂ egg ⊂ nonveg', () => {
  assert.ok(dietAllows('veg', 'vegan'));
  assert.ok(!dietAllows('vegan', 'veg'));
  assert.ok(dietAllows('nonveg', 'egg'));
  assert.ok(!dietAllows('egg', 'nonveg'));
});

test('vegan day never includes egg, dairy or meat dishes', () => {
  const plan = planDay({ diet: 'vegan' });
  for (const slot of plan.slots) {
    assert.equal(slot.recipe.diet, 'vegan', `${slot.recipe.name} must be vegan`);
  }
});

test('respects the time available per meal', () => {
  const plan = planDay({ dayType: 'busy', time: { breakfast: 12, lunch: 25, dinner: 30 } });
  for (const slot of plan.slots) {
    if (!slot.timeRelaxed) {
      assert.ok(
        slot.recipe.timeMins <= plan.context.time[slot.slot],
        `${slot.recipe.name} (${slot.recipe.timeMins}m) fits the ${slot.slot} window`
      );
    }
  }
});

test('dairy allergy: no chosen ingredient carries the dairy allergen', () => {
  const plan = planDay({ allergies: ['dairy'], diet: 'nonveg' });
  for (const slot of plan.slots) {
    for (const ing of slot.ingredients) {
      assert.ok(
        !allergensOf(ing.id).includes('dairy'),
        `${ing.id} in ${slot.recipe.name} must be dairy-free`
      );
    }
  }
});

test('allergy substitution swaps paneer out of palak paneer', () => {
  const recipe = recipeById('palak_paneer');
  const resolved = resolveIngredients(recipe, ['dairy']);
  assert.ok(resolved.ok);
  const swapped = resolved.swaps.find((s) => s.from === 'paneer');
  assert.ok(swapped, 'paneer should be swapped, not block the recipe');
  assert.ok(!allergensOf(swapped.to).includes('dairy'));
});

test('substitution never introduces another declared allergen', () => {
  // dairy + soy: paneer→tofu is blocked (soy), must fall through to mushroom
  const resolved = resolveIngredients(recipeById('palak_paneer'), ['dairy', 'soy']);
  assert.ok(resolved.ok);
  assert.equal(resolved.swaps.find((s) => s.from === 'paneer')?.to, 'mushroom');
});

test('recipe is rejected when a required ingredient has no safe substitute', () => {
  // grilled sandwich needs bread (gluten) and bread has no substitute
  const resolved = resolveIngredients(recipeById('veg_sandwich'), ['gluten']);
  assert.equal(resolved.ok, false);
});

test('optional clashing ingredients are dropped silently', () => {
  const resolved = resolveIngredients(recipeById('poha'), ['nuts']);
  assert.ok(resolved.ok);
  assert.ok(!resolved.ingredients.some((i) => i.id === 'peanuts'));
  assert.equal(resolved.swaps.length, 0);
});

test('no recipe repeats across the day', () => {
  const plan = planDay({ diet: 'nonveg' });
  const ids = plan.slots.map((s) => s.recipe.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('budget-first mode never plans a costlier day', () => {
  const ctx = { budget: 150, servings: 2, diet: 'veg' };
  const normal = planDay(ctx);
  const thrifty = planDay(ctx, { budgetFirst: true });
  const spend = (p) => p.slots.reduce((s, x) => s + (x.spend ?? 0), 0);
  assert.ok(spend(thrifty) <= spend(normal));
});

test('a relaxed day plans heartier meals than a busy day', () => {
  const cook = (dayType) =>
    planDay({ dayType, diet: 'veg', budget: 500 }).slots
      .reduce((sum, s) => sum + s.recipe.timeMins, 0);
  assert.ok(cook('relaxed') > cook('busy'), 'relaxed days should cook bigger');
});

test('a comfortable budget is used, not hoarded', () => {
  // With money to spare, the plan should be richer than the bare-minimum one.
  const ctx = { dayType: 'relaxed', diet: 'nonveg', budget: 600, servings: 4 };
  const spend = (p) => p.slots.reduce((s, x) => s + x.spend, 0);
  assert.ok(spend(planDay(ctx)) > spend(planDay(ctx, { budgetFirst: true })));
});

test('planning is deterministic — same inputs, same plan', () => {
  const a = planDay({ dayType: 'busy', budget: 250, pantry: ['rice', 'atta'] });
  const b = planDay({ dayType: 'busy', budget: 250, pantry: ['rice', 'atta'] });
  assert.deepEqual(
    a.slots.map((s) => s.recipe.id),
    b.slots.map((s) => s.recipe.id)
  );
});

test('catalog sanity: every slot has recipes for every diet level', () => {
  for (const slot of SLOTS) {
    for (const diet of ['vegan', 'veg', 'egg', 'nonveg']) {
      const options = RECIPES.filter(
        (r) => r.meals.includes(slot) && dietAllows(diet, r.diet)
      );
      assert.ok(options.length >= 2, `${diet} needs choices for ${slot}`);
    }
  }
});
