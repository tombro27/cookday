# 🍳 CookDay — a cooking to-do list that plans around *your* day

**Vertical:** Cooking / personal meal planning (warm-up challenge).

CookDay is a micro app that turns one question — *"what does your day look
like?"* — into a complete, actionable cooking plan:

1. **Breakfast / lunch / dinner plan** — for whichever of the three meals you
   choose to cook (all by default), chosen for the time, diet, allergies,
   budget and pantry you actually have, with the *reasons* for every pick
   shown. Plan only dinner and the whole budget goes to dinner.
2. **Grocery list** — ingredients aggregated across the day, scaled to your
   servings, priced in ₹, grouped for a natural shop walk-through, minus what
   you already own.
3. **Substitutions** — allergy swaps applied automatically, cheaper swaps with
   the rupee saving, and "shop was out of stock" backups. Every suggestion is
   re-checked against your allergies.
4. **Budget feasibility** — the day's shopping estimate vs your budget, with a
   concrete route back under when it doesn't fit (ingredient swaps + cheaper
   dishes), and a one-click **budget-first re-plan**.
5. **The to-do list itself** — a checkable task list: shopping run, prep-ahead
   work (soak the rajma tonight!), and step-by-step cooking blocks with
   *start-by* times worked backwards from typical mealtimes. If an allergy
   swap or drop touched a recipe, the meal's tasks open with an explicit
   **allergy note** so no original step can mislead the cook.

## Quick start

```bash
npm start        # zero dependencies — serves at http://localhost:8080
npm test         # unit tests via Node's built-in test runner
```

Requires Node ≥ 18. Nothing to install; there is no build step.

## How the solution works

```
free text ──(optional Gemini call)──►┐
                                     ▼
structured form ────────────► normalizeContext()          js/engine/context.js
                                     │  validated, clamped context
                                     ▼
                              planDay()                    js/engine/planner.js
                                     │  filter: diet → allergies (with
                                     │  substitution rescue) → time window
                                     │  score: cost / time / pantry / variety,
                                     │  weights shifted by day type
                                     ▼
              ┌──────────────┬───────┴────────┬─────────────────┐
              ▼              ▼                ▼                 ▼
      buildGroceryList  assessBudget   substitutions      buildTodoList
      (grocery.js)      (budget.js)    (substitutions.js) (todo.js)
```

### The decision logic (the interesting part)

- **Diet hierarchy** `vegan ⊂ veg ⊂ egg ⊂ nonveg` — a vegetarian is offered
  vegan dishes, never the reverse.
- **Allergy handling is substitution-first**: a clashing optional ingredient is
  dropped, a required one is swapped to the first catalog substitute that is
  *itself* safe for the user (paneer → tofu, but paneer → mushroom if the user
  also avoids soy). Only when no safe swap exists is the recipe excluded.
- **Context-aware scoring**: candidates are scored on cost, time, pantry
  overlap and variety (a penalty for repeating the same hero ingredient across
  meals), with weights *and semantics* that shift with the day:
  - Cost is a **constraint, not a race to the bottom** — anything within the
    meal's budget share (25% breakfast / 37.5% lunch / 37.5% dinner,
    renormalized across whichever meals you selected) scores
    full marks, then tapers as the overshoot grows. So a family with a
    comfortable budget gets chicken curry, not the cheapest khichdi every day.
  - The **budget-first re-plan** switches cost to "cheapest of the pool", which
    keeps a gradient even when every option busts the budget. The UI only
    offers this re-plan when it would actually lower the bill.
  - A *busy* day weights speed heavily; a *relaxed* day inverts the time score
    entirely — more elaborate dishes become a feature, not a cost.
- **Deterministic by design**: ties break on price then name, so the same
  inputs always produce the same plan — inspectable, testable, and impossible
  to fake. If nothing fits a tight time window, the closest recipe is offered
  and honestly labelled "runs past your window".
- **Budget feasibility** classifies the day (≤85% comfortable / ≤100% tight /
  over) and, when over, quantifies the way back: allergy-safe cheaper
  ingredient swaps (with savings) plus cheaper dish alternatives per slot.

### The optional GenAI layer

The "describe your day in plain words" box makes a **real Gemini API call**
(`gemini-3.5-flash`, falling back to `gemini-3.1-flash-lite` if the key lacks
access; JSON-schema-constrained) to parse free text like
*"crazy busy Tuesday, cooking for 3, ₹400, no dairy — just dinner tonight"*
into the same structured context the form produces (including which meals to
plan). Deliberate choices:

- **It is an enhancement, not a dependency.** Every feature works without a
  key; the form drives the identical engine.
- **No fabricated AI output, ever.** If the call fails (bad key, offline,
  rate-limited), the UI shows the real error and points to the form.
- **Defense in depth**: the schema-constrained response is *still* passed
  through `normalizeContext()`, so a malformed model reply cannot corrupt a
  plan.
- The key is user-supplied at runtime, sent only to Google's endpoint, kept at
  most in the tab's session storage, and clearable with one click. It never
  appears in code, storage on a server, or the repository.

## Security notes

- Strict Content-Security-Policy (`default-src 'none'`; connections allowed
  only to the Gemini endpoint).
- No `innerHTML` anywhere — all rendering builds DOM nodes with `textContent`,
  so user- or AI-supplied strings cannot inject markup.
- All inputs validated and clamped in one place (`normalizeContext`); unknown
  allergens/pantry ids are dropped, junk numbers fall back to defaults.
- `localStorage`/`sessionStorage` reads are wrapped — corrupted or blocked
  storage degrades gracefully.
- The dev server whitelists MIME types, sends `X-Content-Type-Options:
  nosniff`, and blocks path traversal.

## Accessibility

Semantic landmarks and fieldsets, labels on every control, a skip link,
`aria-live` status regions, keyboard-operable throughout with visible focus,
dark-mode and reduced-motion support, and a print stylesheet that outputs just
the to-do list and grocery list for the fridge door.

## Project layout

```
index.html            app shell (form + results skeleton)
css/styles.css        styles: light/dark, print
js/app.js             DOM wiring and rendering (no business logic)
js/engine/            pure, tested decision logic (no DOM)
  context.js          input validation + day-type defaults
  planner.js          candidate filtering, scoring, explanations
  grocery.js          aggregation, pricing, formatting
  substitutions.js    allergy / budget / backup swaps
  budget.js           feasibility + savings routes
  todo.js             task generation with start-by times
js/data/              ingredient catalog (₹ prices, allergens, substitutes)
                      and the recipe catalog
js/ai/gemini.js       optional real Gemini call (free-text → context)
tests/                unit tests (node --test, no frameworks)
server.mjs            zero-dependency static server for npm start
```

## Assumptions

- Prices are **typical Indian retail estimates** baked into the catalog — the
  app is honest about this in the footer; it is a planning aid, not a live
  price feed.
- Recipes are Indian home-cooking staples; quantities are per serving and
  scale linearly with servings (1–8).
- The budget covers **what you'd buy today**: pantry items you tick are free,
  and piece-goods (lemons, eggs, bread slices) are costed whole because that's
  how you buy them.
- Mealtimes for the start-by calculator: breakfast 8:30, lunch 13:00,
  dinner 20:00.
- Checked to-dos persist per browser via `localStorage` and reset when a
  different plan is generated (old ticks would be meaningless).

## Built with AI

Built through prompting with Claude Code as the AI coding platform; the
runtime AI integration (Gemini) is real, optional, and documented above.
