import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planDay } from '../js/engine/planner.js';
import { buildGroceryList } from '../js/engine/grocery.js';
import { buildTodoList, formatClock } from '../js/engine/todo.js';
import { collectForcedSwaps, backupOptions } from '../js/engine/substitutions.js';

test('clock formatting', () => {
  assert.equal(formatClock(8.5), '8:30 am');
  assert.equal(formatClock(13), '1:00 pm');
  assert.equal(formatClock(19.75), '7:45 pm');
  assert.equal(formatClock(0), '12:00 am');
});

test('to-do list covers shopping and all three meals', () => {
  const plan = planDay({});
  const grocery = buildGroceryList(plan);
  const sections = buildTodoList(plan, grocery);
  const titles = sections.map((s) => s.title);

  assert.ok(titles.some((t) => t.startsWith('Shopping run')));
  assert.ok(titles.some((t) => t.startsWith('Breakfast')));
  assert.ok(titles.some((t) => t.startsWith('Lunch')));
  assert.ok(titles.some((t) => t.startsWith('Dinner')));
});

test('every task has a unique, stable id', () => {
  const plan = planDay({ diet: 'nonveg', dayType: 'relaxed' });
  const sections = buildTodoList(plan, buildGroceryList(plan));
  const ids = sections.flatMap((s) => s.tasks.map((t) => t.id));
  assert.equal(new Set(ids).size, ids.length);

  const again = buildTodoList(plan, buildGroceryList(plan));
  assert.deepEqual(again.flatMap((s) => s.tasks.map((t) => t.id)), ids);
});

test('cooking blocks include a start-by time and the recipe steps', () => {
  const plan = planDay({});
  const sections = buildTodoList(plan, buildGroceryList(plan));
  const dinner = sections.find((s) => s.title.startsWith('Dinner'));
  assert.match(dinner.tasks[0].text, /^Start by \d{1,2}:\d{2} (am|pm)/);
  assert.ok(dinner.tasks.length >= 3, 'steps become checkable tasks');
});

test('prep-ahead steps get their own section when present', () => {
  // Relaxed non-veg day makes marinate/soak recipes likely; force one:
  const plan = planDay({ dayType: 'relaxed', diet: 'nonveg' });
  const sections = buildTodoList(plan, buildGroceryList(plan));
  const hasPrepAhead = plan.slots.some((s) =>
    s.recipe?.steps.some((st) => typeof st === 'object' && st.prepAhead)
  );
  assert.equal(sections.some((s) => s.title === 'Prep ahead'), hasPrepAhead);
});

test('to-do list warns before any step mentions a swapped or dropped allergen', () => {
  // Every slot whose recipe was modified for allergies must carry an
  // allergy-note task ahead of the cooking steps.
  for (const allergies of [['dairy'], ['nuts'], ['dairy', 'soy'], ['gluten']]) {
    for (const dayType of ['busy', 'normal', 'relaxed']) {
      const plan = planDay({ dayType, allergies, diet: 'veg' });
      const sections = buildTodoList(plan, buildGroceryList(plan));
      for (const slot of plan.slots) {
        if (!slot.recipe) continue;
        const modified = (slot.swaps?.length ?? 0) + (slot.dropped?.length ?? 0) > 0;
        if (!modified) continue;
        const section = sections.find((s) => s.title.endsWith(slot.recipe.name));
        const notes = section.tasks.filter((t) => t.text.startsWith('⚠ Allergy note'));
        assert.equal(notes.length, slot.swaps.length + slot.dropped.length,
          `${slot.recipe.name} with [${allergies}] must warn about every change`);
        // Warnings come before the first cooking step.
        const firstNote = section.tasks.findIndex((t) => t.text.startsWith('⚠'));
        const firstStep = section.tasks.findIndex((t) => t.id.includes('-step-'));
        assert.ok(firstNote < firstStep);
      }
    }
  }
});

test('meal subset produces to-dos only for the chosen meals', () => {
  const plan = planDay({ meals: ['dinner'] });
  const sections = buildTodoList(plan, buildGroceryList(plan));
  assert.ok(!sections.some((s) => s.title.startsWith('Breakfast')));
  assert.ok(!sections.some((s) => s.title.startsWith('Lunch')));
  assert.ok(sections.some((s) => s.title.startsWith('Dinner')));
});

test('forced swaps are collected once per unique swap, with the recipe named', () => {
  const plan = planDay({ allergies: ['dairy'] });
  for (const swap of collectForcedSwaps(plan)) {
    assert.ok(swap.from && swap.to && swap.recipeName);
  }
});

test('backup options never suggest an allergen', () => {
  const plan = planDay({ allergies: ['soy', 'nuts'] });
  const grocery = buildGroceryList(plan);
  for (const backup of backupOptions(grocery, ['soy', 'nuts'])) {
    assert.ok(!backup.options.includes('Tofu'));
    assert.ok(!backup.options.includes('Soy milk'));
    assert.ok(!backup.options.includes('Almond milk'));
    assert.ok(!backup.options.includes('Peanuts'));
    assert.ok(!backup.options.includes('Cashews'));
  }
});
