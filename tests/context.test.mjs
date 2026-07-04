import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeContext, TIME_DEFAULTS, MEAL_SLOTS } from '../js/engine/context.js';

test('empty input produces sane defaults', () => {
  const ctx = normalizeContext({});
  assert.equal(ctx.dayType, 'normal');
  assert.equal(ctx.diet, 'veg');
  assert.equal(ctx.servings, 2);
  assert.equal(ctx.budget, 300);
  assert.deepEqual(ctx.allergies, []);
  assert.deepEqual(ctx.time, TIME_DEFAULTS.normal);
});

test('numbers are clamped to sane ranges', () => {
  const ctx = normalizeContext({ servings: 500, budget: -20, time: { breakfast: 0 } });
  assert.equal(ctx.servings, 8);
  assert.equal(ctx.budget, 50);
  assert.equal(ctx.time.breakfast, 5);
});

test('junk values fall back instead of propagating NaN', () => {
  const ctx = normalizeContext({ servings: 'lots', budget: 'free', dayType: 'DROP TABLE' });
  assert.equal(ctx.servings, 2);
  assert.equal(ctx.budget, 300);
  assert.equal(ctx.dayType, 'normal');
});

test('unknown allergens and pantry ids are dropped', () => {
  const ctx = normalizeContext({
    allergies: ['dairy', 'kryptonite', 'dairy'],
    pantry: ['rice', 'unicorn_dust'],
  });
  assert.deepEqual(ctx.allergies, ['dairy']);
  assert.deepEqual(ctx.pantry, ['rice']);
});

test('meals default to the full day', () => {
  assert.deepEqual(normalizeContext({}).meals, MEAL_SLOTS);
});

test('meal selection is honoured, deduplicated and kept in day order', () => {
  assert.deepEqual(normalizeContext({ meals: ['dinner', 'breakfast', 'dinner'] }).meals,
    ['breakfast', 'dinner']);
  assert.deepEqual(normalizeContext({ meals: ['lunch'] }).meals, ['lunch']);
});

test('an empty or invalid meal selection falls back to all meals', () => {
  assert.deepEqual(normalizeContext({ meals: [] }).meals, MEAL_SLOTS);
  assert.deepEqual(normalizeContext({ meals: ['brunch'] }).meals, MEAL_SLOTS);
  assert.deepEqual(normalizeContext({ meals: 'dinner' }).meals, MEAL_SLOTS);
});

test('day type drives the time defaults', () => {
  assert.deepEqual(normalizeContext({ dayType: 'busy' }).time, TIME_DEFAULTS.busy);
  assert.deepEqual(normalizeContext({ dayType: 'relaxed' }).time, TIME_DEFAULTS.relaxed);
});
