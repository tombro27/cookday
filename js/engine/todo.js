/**
 * To-do list generator — turns the plan into the day's checkable tasks:
 * a shopping run, prep-ahead work, and step-by-step cooking blocks with
 * suggested start times so each meal lands on time.
 */

import { formatINR } from './budget.js';
import { INGREDIENTS } from '../data/ingredients.js';

/** Typical Indian mealtimes the schedule works backwards from (24h). */
const MEAL_TARGET = { breakfast: 8.5, lunch: 13, dinner: 20 };

const SLOT_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

/** 7.75 → "7:45 am" */
export function formatClock(hours) {
  const h24 = ((hours % 24) + 24) % 24;
  const h = Math.floor(h24);
  const m = Math.round((h24 - h) * 60);
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/**
 * Build the day's task sections. Every task has a stable id so the UI
 * can persist checked state across reloads.
 *
 * @param {ReturnType<import('./planner.js').planDay>} plan
 * @param {ReturnType<import('./grocery.js').buildGroceryList>} grocery
 * @returns {Array<{title: string, tasks: Array<{id: string, text: string}>}>}
 */
export function buildTodoList(plan, grocery) {
  const sections = [];

  if (grocery.toBuy.length > 0) {
    sections.push({
      title: 'Shopping run',
      tasks: grocery.groups.map((group) => ({
        id: `shop-${group.category.toLowerCase().replace(/[^a-z]+/g, '-')}`,
        text:
          `${group.category}: ` +
          group.items.map((i) => `${i.name} (${i.displayQty})`).join(', ') +
          ` — about ${formatINR(group.items.reduce((s, i) => s + i.estCost, 0))}`,
      })),
    });
  }

  const prepTasks = [];
  for (const slot of plan.slots) {
    if (!slot.recipe) continue;
    for (const step of slot.recipe.steps) {
      if (typeof step === 'object' && step.prepAhead) {
        prepTasks.push({
          id: `prep-${slot.slot}`,
          text: `${step.text} (for ${SLOT_LABEL[slot.slot].toLowerCase()}: ${slot.recipe.name})`,
        });
      }
    }
  }
  if (prepTasks.length > 0) {
    sections.push({ title: 'Prep ahead', tasks: prepTasks });
  }

  for (const slot of plan.slots) {
    if (!slot.recipe) continue;
    const startAt = MEAL_TARGET[slot.slot] - slot.recipe.timeMins / 60;

    // The recipe steps below are the original text — if the engine swapped
    // or dropped an allergen, say so up front, before any step mentions it.
    const allergyNotes = [
      ...(slot.swaps ?? []).map(
        (s) => `use ${INGREDIENTS[s.to].name} wherever the steps say ${INGREDIENTS[s.from].name} (${s.reason})`
      ),
      ...(slot.dropped ?? []).map(
        (d) => `skip the ${INGREDIENTS[d.id].name} entirely (${d.reason} allergy)`
      ),
    ];

    const tasks = [
      {
        id: `${slot.slot}-start`,
        text:
          `Start by ${formatClock(startAt)} to eat at ` +
          `${formatClock(MEAL_TARGET[slot.slot])} (~${slot.recipe.timeMins} min)`,
      },
      ...allergyNotes.map((note, i) => ({
        id: `${slot.slot}-allergy-${i}`,
        text: `⚠ Allergy note: ${note}`,
      })),
      ...slot.recipe.steps.map((step, i) => ({
        id: `${slot.slot}-step-${i}`,
        text: typeof step === 'object' ? step.text : step,
      })),
    ];
    sections.push({
      title: `${SLOT_LABEL[slot.slot]} — ${slot.recipe.name}`,
      tasks,
    });
  }

  return sections;
}
