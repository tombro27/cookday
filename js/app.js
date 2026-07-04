/**
 * UI wiring — reads the form, runs the engine, renders results.
 *
 * All rendering goes through the `el()` helper, which only ever sets
 * textContent (never innerHTML), so nothing a user types — or an AI
 * returns — can inject markup.
 */

import { INGREDIENTS, PANTRY_STAPLE_IDS } from './data/ingredients.js';
import { TIME_DEFAULTS } from './engine/context.js';
import { planDay } from './engine/planner.js';
import { buildGroceryList } from './engine/grocery.js';
import { assessBudget, formatINR } from './engine/budget.js';
import { buildTodoList } from './engine/todo.js';
import { collectForcedSwaps, budgetSwapSuggestions, backupOptions } from './engine/substitutions.js';
import { parseDayDescription } from './ai/gemini.js';

const CHECKS_KEY = 'cookday:checks:v1';
const CONTEXT_KEY = 'cookday:context:v1';
const GEMINI_KEY = 'cookday:gemini-key';

const $ = (sel) => document.querySelector(sel);

/** Create an element; strings become text nodes — no HTML parsing anywhere. */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function readJSON(storage, key, fallback) {
  try {
    return JSON.parse(storage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

// ── Form ↔ context ───────────────────────────────────────────────────

function readContextFromForm() {
  const form = $('#day-form');
  const data = new FormData(form);
  return {
    dayType: data.get('dayType'),
    diet: data.get('diet'),
    allergies: data.getAll('allergies'),
    servings: $('#servings').value,
    budget: $('#budget').value,
    pantry: [...form.querySelectorAll('input[name="pantry"]:checked')].map((i) => i.value),
    time: {
      breakfast: $('#time-breakfast').value,
      lunch: $('#time-lunch').value,
      dinner: $('#time-dinner').value,
    },
  };
}

function applyContextToForm(ctx) {
  const form = $('#day-form');
  const set = (name, value) => {
    const input = form.querySelector(`input[name="${name}"][value="${CSS.escape(String(value))}"]`);
    if (input) input.checked = true;
  };
  if (ctx.dayType) { set('dayType', ctx.dayType); syncTimeDefaults(ctx.dayType); }
  if (ctx.diet) set('diet', ctx.diet);
  for (const box of form.querySelectorAll('input[name="allergies"]')) {
    box.checked = (ctx.allergies ?? []).includes(box.value);
  }
  if (ctx.servings != null) $('#servings').value = ctx.servings;
  if (ctx.budget != null) $('#budget').value = ctx.budget;
  if (ctx.pantry) {
    for (const box of form.querySelectorAll('input[name="pantry"]')) {
      box.checked = ctx.pantry.includes(box.value);
    }
  }
  if (ctx.time) {
    $('#time-breakfast').value = ctx.time.breakfast;
    $('#time-lunch').value = ctx.time.lunch;
    $('#time-dinner').value = ctx.time.dinner;
  }
}

function syncTimeDefaults(dayType) {
  const defaults = TIME_DEFAULTS[dayType];
  if (!defaults) return;
  $('#time-breakfast').value = defaults.breakfast;
  $('#time-lunch').value = defaults.lunch;
  $('#time-dinner').value = defaults.dinner;
}

// ── Rendering ────────────────────────────────────────────────────────

const SLOT_EMOJI = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };

function renderPlan(plan, grocery, budget, cheaperReplanExists) {
  const cards = $('#plan-cards');
  cards.replaceChildren();

  for (const slot of plan.slots) {
    if (!slot.recipe) {
      cards.append(
        el('article', { class: 'card empty' }, [
          el('h3', {}, `${SLOT_EMOJI[slot.slot]} ${slot.slot}`),
          el('p', {}, slot.note),
        ])
      );
      continue;
    }
    cards.append(
      el('article', { class: 'card' }, [
        el('p', { class: 'slot-label' }, `${SLOT_EMOJI[slot.slot]} ${slot.slot}`),
        el('h3', {}, slot.recipe.name),
        el('p', { class: 'meta' },
          `⏱ ${slot.recipe.timeMins} min · 🛒 ${formatINR(slot.spend)} to buy` +
          (slot.timeRelaxed ? ' · runs past your window' : '')),
        el('ul', { class: 'reasons' }, slot.reasons.map((r) => el('li', {}, r))),
        slot.alternatives.length
          ? el('p', { class: 'muted small' },
              'Also fits: ' + slot.alternatives
                .map((a) => `${a.name} (${a.timeMins} min, ${formatINR(a.spend)})`)
                .join(' · '))
          : '',
      ])
    );
  }

  const banner = $('#budget-banner');
  banner.replaceChildren(
    el('div', { class: `banner ${budget.status}` }, [
      el('strong', {}, budget.message),
      plan.budgetFirst ? el('span', { class: 'pill' }, 'budget-first plan') : '',
      budget.status === 'over' && cheaperReplanExists
        ? el('button', { type: 'button', class: 'primary', onclick: () => generate({ budgetFirst: true }) },
            'Optimize for budget')
        : '',
      budget.status === 'over' && !cheaperReplanExists && !plan.budgetFirst
        ? el('span', {}, 'This is already the cheapest dish combination for your constraints — use the swaps below, or raise the budget.')
        : '',
    ])
  );
}

function renderTodo(plan, grocery) {
  const container = $('#todo-sections');
  container.replaceChildren();
  const checks = readJSON(localStorage, CHECKS_KEY, {});

  for (const section of buildTodoList(plan, grocery)) {
    const list = el('ul', { class: 'todo' });
    for (const task of section.tasks) {
      const box = el('input', { type: 'checkbox', id: `task-${task.id}` });
      box.checked = Boolean(checks[task.id]);
      box.addEventListener('change', () => {
        const state = readJSON(localStorage, CHECKS_KEY, {});
        state[task.id] = box.checked;
        try { localStorage.setItem(CHECKS_KEY, JSON.stringify(state)); } catch { /* storage full/blocked — ticks just won't persist */ }
      });
      list.append(el('li', {}, [box, el('label', { for: `task-${task.id}` }, task.text)]));
    }
    container.append(el('section', { class: 'todo-block' }, [el('h4', {}, section.title), list]));
  }
}

function renderGrocery(grocery) {
  const container = $('#grocery-list');
  container.replaceChildren();

  if (grocery.toBuy.length === 0) {
    container.append(el('p', {}, 'Nothing to buy — everything is already in your kitchen. 🎉'));
    return;
  }

  for (const group of grocery.groups) {
    container.append(
      el('h4', {}, group.category),
      el('ul', { class: 'grocery' }, group.items.map((item) =>
        el('li', {}, [
          el('span', {}, `${item.name} — ${item.displayQty}`),
          el('span', { class: 'muted small' }, ` for ${item.usedIn.join(', ')} `),
          el('strong', {}, formatINR(item.estCost)),
        ])
      ))
    );
  }
  container.append(el('p', { class: 'total' }, [
    el('strong', {}, `Estimated total: ${formatINR(grocery.toBuyTotal)}`),
  ]));

  if (grocery.inPantry.length > 0) {
    container.append(
      el('p', { class: 'muted small' },
        'From your kitchen (free): ' + grocery.inPantry.map((i) => i.name).join(', '))
    );
  }
}

function renderSubs(plan, grocery) {
  const container = $('#subs-list');
  container.replaceChildren();
  const forced = collectForcedSwaps(plan);
  const savers = budgetSwapSuggestions(grocery, plan.context.allergies);
  const backups = backupOptions(grocery, plan.context.allergies);

  if (forced.length) {
    container.append(
      el('h4', {}, 'Applied for your allergies'),
      el('ul', {}, forced.map((s) =>
        el('li', {}, `${s.from} → ${s.to} (${s.reason}) in ${s.recipeName}`)))
    );
  }
  if (savers.length) {
    container.append(
      el('h4', {}, 'Want to spend less?'),
      el('ul', {}, savers.map((s) =>
        el('li', {}, `Swap ${s.from} → ${s.to} and save about ${formatINR(s.saving)}`)))
    );
  }
  if (backups.length) {
    container.append(
      el('h4', {}, 'Shop out of stock? Safe backups'),
      el('ul', {}, backups.map((b) => el('li', {}, `${b.item}: ${b.options.join(' or ')}`)))
    );
  }
  if (!forced.length && !savers.length && !backups.length) {
    container.append(el('p', { class: 'muted' }, 'No substitutions needed for this plan.'));
  }
}

// ── Generate ─────────────────────────────────────────────────────────

let lastPlanSignature = readJSON(localStorage, `${CHECKS_KEY}:sig`, null);

function generate({ budgetFirst = false } = {}) {
  const raw = readContextFromForm();
  const plan = planDay(raw, { budgetFirst });
  const grocery = buildGroceryList(plan);
  const budget = assessBudget(plan, grocery);

  // Offer the budget-first re-plan only when it genuinely lowers the bill —
  // a button that produces the same plan would just erode trust.
  let cheaperReplanExists = false;
  if (budget.status === 'over' && !budgetFirst) {
    const thrifty = buildGroceryList(planDay(raw, { budgetFirst: true }));
    cheaperReplanExists = thrifty.toBuyTotal < grocery.toBuyTotal;
  }

  // A different plan means the old ticks are meaningless — reset them.
  const signature = JSON.stringify({
    recipes: plan.slots.map((s) => s.recipe?.id ?? null),
    servings: plan.context.servings,
  });
  if (signature !== lastPlanSignature) {
    try {
      localStorage.setItem(CHECKS_KEY, '{}');
      localStorage.setItem(`${CHECKS_KEY}:sig`, JSON.stringify(signature));
    } catch { /* private mode — fine */ }
    lastPlanSignature = signature;
  }
  try { localStorage.setItem(CONTEXT_KEY, JSON.stringify(raw)); } catch { /* fine */ }

  renderPlan(plan, grocery, budget, cheaperReplanExists);
  renderTodo(plan, grocery);
  renderGrocery(grocery);
  renderSubs(plan, grocery);

  const results = $('#results');
  results.hidden = false;
  $('#results-heading').focus({ preventScroll: false });
}

// ── AI quick-fill ────────────────────────────────────────────────────

async function handleAiParse() {
  const status = $('#ai-status');
  const text = $('#ai-text').value.trim();
  const key = $('#ai-key').value.trim();

  if (!text) { status.textContent = 'Describe your day first.'; return; }
  if (!key) { status.textContent = 'Paste your Gemini API key (or just use the form below).'; return; }

  const button = $('#ai-parse');
  button.disabled = true;
  status.textContent = 'Asking Gemini…';
  try {
    const parsed = await parseDayDescription(text, key);
    try { sessionStorage.setItem(GEMINI_KEY, key); } catch { /* fine */ }
    applyContextToForm(parsed);
    status.textContent = 'Form filled from your description — review it, then plan.';
    generate();
  } catch (err) {
    status.textContent = err.message; // honest failure, no fabricated result
  } finally {
    button.disabled = false;
  }
}

// ── Init ─────────────────────────────────────────────────────────────

function init() {
  const pantryBox = $('#pantry-options');
  for (const id of PANTRY_STAPLE_IDS) {
    pantryBox.append(
      el('label', {}, [
        el('input', { type: 'checkbox', name: 'pantry', value: id }),
        ` ${INGREDIENTS[id].name}`,
      ])
    );
  }

  for (const radio of document.querySelectorAll('input[name="dayType"]')) {
    radio.addEventListener('change', () => syncTimeDefaults(radio.value));
  }

  $('#day-form').addEventListener('submit', (event) => {
    event.preventDefault();
    generate();
  });

  $('#ai-parse').addEventListener('click', handleAiParse);
  $('#ai-clear-key').addEventListener('click', () => {
    $('#ai-key').value = '';
    try { sessionStorage.removeItem(GEMINI_KEY); } catch { /* fine */ }
    $('#ai-status').textContent = 'Key forgotten.';
  });

  const savedKey = (() => { try { return sessionStorage.getItem(GEMINI_KEY); } catch { return null; } })();
  if (savedKey) $('#ai-key').value = savedKey;

  const savedContext = readJSON(localStorage, CONTEXT_KEY, null);
  if (savedContext) applyContextToForm(savedContext);
}

init();
