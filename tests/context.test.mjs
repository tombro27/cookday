import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeContext, TIME_DEFAULTS } from '../js/engine/context.js';

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

test('day type drives the time defaults', () => {
  assert.deepEqual(normalizeContext({ dayType: 'busy' }).time, TIME_DEFAULTS.busy);
  assert.deepEqual(normalizeContext({ dayType: 'relaxed' }).time, TIME_DEFAULTS.relaxed);
});
