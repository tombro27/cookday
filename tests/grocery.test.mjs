import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planDay } from '../js/engine/planner.js';
import { buildGroceryList, buyQtyOf, buyCostOf, formatQty } from '../js/engine/grocery.js';
import { INGREDIENTS } from '../js/data/ingredients.js';

test('piece items are bought whole; weight items as measured', () => {
  assert.equal(buyQtyOf('lemon', 0.5), 1);
  assert.equal(buyQtyOf('egg', 2.2), 3);
  assert.equal(buyQtyOf('rice', 160), 160);
});

test('buy cost prices the rounded-up piece quantity', () => {
  assert.equal(buyCostOf('lemon', 0.5), INGREDIENTS.lemon.price);
});

test('quantities format for humans', () => {
  assert.equal(formatQty('rice', 600), '600 g');
  assert.equal(formatQty('rice', 1200), '1.2 kg');
  assert.equal(formatQty('milk', 1000), '1 L');
  assert.equal(formatQty('lemon', 1.5), '2 pc');
});

test('grocery list scales with servings', () => {
  const base = { diet: 'veg', pantry: [] };
  const for2 = buildGroceryList(planDay({ ...base, servings: 2 }));
  const for4 = buildGroceryList(planDay({ ...base, servings: 4 }));
  // Same recipes chosen (servings does not change candidate filtering),
  // so the 4-serving bill must be strictly larger.
  assert.ok(for4.toBuyTotal > for2.toBuyTotal);
});

test('pantry items are excluded from the bill but listed as owned', () => {
  const plan = planDay({ pantry: ['rice', 'oil', 'salt'] });
  const grocery = buildGroceryList(plan);
  for (const item of grocery.toBuy) {
    assert.ok(!['rice', 'oil', 'salt'].includes(item.id));
  }
  for (const item of grocery.inPantry) {
    assert.equal(item.estCost, 0);
  }
});

test('shared ingredients are merged into one line item', () => {
  const plan = planDay({});
  const grocery = buildGroceryList(plan);
  const ids = grocery.toBuy.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, 'no duplicate line items');
});

test('total equals the sum of line items', () => {
  const grocery = buildGroceryList(planDay({ servings: 3 }));
  const sum = grocery.toBuy.reduce((s, i) => s + i.estCost, 0);
  assert.equal(grocery.toBuyTotal, sum);
});

test('every line item says which recipe needs it', () => {
  const grocery = buildGroceryList(planDay({}));
  for (const item of grocery.toBuy) {
    assert.ok(item.usedIn.length > 0, `${item.name} lists its recipes`);
  }
});
