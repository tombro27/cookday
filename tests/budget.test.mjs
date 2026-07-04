import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planDay } from '../js/engine/planner.js';
import { buildGroceryList } from '../js/engine/grocery.js';
import { assessBudget, formatINR } from '../js/engine/budget.js';

function assess(rawCtx) {
  const plan = planDay(rawCtx);
  const grocery = buildGroceryList(plan);
  return { plan, grocery, budget: assessBudget(plan, grocery) };
}

test('rupee formatting uses the Indian locale', () => {
  assert.equal(formatINR(1234), '₹1,234');
  assert.equal(formatINR(100000), '₹1,00,000');
});

test('a generous budget is comfortable, with no swap noise', () => {
  const { budget } = assess({ budget: 5000, servings: 1 });
  assert.equal(budget.status, 'comfortable');
  assert.deepEqual(budget.swaps, []);
  assert.deepEqual(budget.cheaperDishes, []);
});

test('a tiny budget for many people is flagged as over', () => {
  const { budget } = assess({ budget: 50, servings: 8, diet: 'nonveg' });
  assert.equal(budget.status, 'over');
  assert.ok(budget.spend > budget.budget);
  assert.match(budget.message, /Over budget/);
});

test('over-budget assessment proposes a way back under', () => {
  const { budget } = assess({ budget: 50, servings: 8, diet: 'nonveg' });
  assert.ok(
    budget.swaps.length + budget.cheaperDishes.length > 0,
    'must offer at least one concrete saving'
  );
  assert.ok(budget.afterSwapsSpend <= budget.spend);
});

test('swap suggestions respect allergies', () => {
  // With a soy allergy, paneer must never be suggested → tofu.
  const { budget } = assess({ budget: 60, servings: 8, allergies: ['soy'] });
  for (const swap of budget.swaps) {
    assert.notEqual(swap.to, 'Tofu');
    assert.notEqual(swap.to, 'Soy milk');
  }
});

test('status thresholds: ratio ≤ 0.85 comfortable, ≤ 1 tight, else over', () => {
  const { budget } = assess({ budget: 5000 });
  assert.ok(budget.ratio <= 0.85);
  const { budget: overB } = assess({ budget: 50, servings: 8 });
  assert.ok(overB.ratio > 1);
});
