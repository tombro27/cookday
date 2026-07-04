/**
 * Optional GenAI layer — parses a free-text description of the user's day
 * ("crazy busy Tuesday, cooking for 3, ₹400, no dairy") into the planner's
 * structured context via a REAL Gemini API call.
 *
 * Design rules:
 *   - This is an enhancement, never a dependency: the manual form drives
 *     the exact same engine, so the app is fully functional without a key.
 *   - No fabricated output: if the API call fails, we surface the error —
 *     we never pretend the model answered.
 *   - The response is JSON-schema-constrained AND still passed through
 *     normalizeContext() by the caller, so a malformed model reply can
 *     never corrupt a plan.
 */

/** Tried in order — the lite model is the fallback if the key's project
 *  doesn't have access to the primary one. */
const MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
const endpointFor = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const TIMEOUT_MS = 20_000;

/** Structured output contract the model must follow. */
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    dayType: { type: 'STRING', enum: ['busy', 'normal', 'relaxed'] },
    diet: { type: 'STRING', enum: ['vegan', 'veg', 'egg', 'nonveg'] },
    servings: { type: 'INTEGER' },
    budget: { type: 'NUMBER' },
    allergies: {
      type: 'ARRAY',
      items: { type: 'STRING', enum: ['dairy', 'gluten', 'nuts', 'egg', 'soy'] },
    },
    meals: {
      type: 'ARRAY',
      items: { type: 'STRING', enum: ['breakfast', 'lunch', 'dinner'] },
    },
  },
  required: ['dayType', 'diet', 'servings', 'budget', 'allergies', 'meals'],
};

const SYSTEM_PROMPT = [
  'Extract meal-planning context from the user\'s description of their day.',
  'dayType: busy = little time to cook, relaxed = plenty of time, else normal.',
  'diet: vegan | veg (vegetarian) | egg (eggetarian) | nonveg. Default veg if unstated.',
  'servings: how many people are eating. Default 2 if unstated.',
  'budget: grocery budget for the day in Indian rupees. Default 300 if unstated.',
  'allergies: only include allergens the user explicitly mentions.',
  'meals: which meals they want to cook. Include all three (breakfast, lunch,',
  'dinner) unless the user clearly limits it, e.g. "just dinner tonight".',
].join('\n');

/**
 * @param {string} text  the user's free-text day description
 * @param {string} apiKey Gemini API key (kept in memory/session only)
 * @returns {Promise<object>} raw context fields, ready for normalizeContext()
 * @throws {Error} descriptive error when the call fails — callers show it as-is
 */
export async function parseDayDescription(text, apiKey) {
  let response;
  for (const [index, model] of MODELS.entries()) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      response = await fetch(endpointFor(model), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0,
          },
        }),
        signal: controller.signal,
      });
    } catch (err) {
      throw new Error(
        err.name === 'AbortError'
          ? 'The AI request timed out. Please use the form below instead.'
          : 'Could not reach the Gemini API. Check your connection, or use the form below.'
      );
    } finally {
      clearTimeout(timer);
    }
    // Model unavailable for this key? Try the fallback model.
    if (response.status === 404 && index < MODELS.length - 1) continue;
    break;
  }

  if (!response.ok) {
    const hint =
      response.status === 400 || response.status === 403
        ? 'The API key looks invalid.'
        : response.status === 429
          ? 'Rate limit hit — wait a moment and retry.'
          : `Gemini returned HTTP ${response.status}.`;
    throw new Error(`${hint} You can always use the form below.`);
  }

  const data = await response.json();
  const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!jsonText) {
    throw new Error('Gemini returned an empty response. Please use the form below.');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Gemini returned unparseable output. Please use the form below.');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Gemini returned an unexpected shape. Please use the form below.');
  }
  return parsed;
}
