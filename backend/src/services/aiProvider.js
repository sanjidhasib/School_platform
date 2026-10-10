/**
 * The one place that talks to the AI model provider (Google Gemini).
 *
 * Everything else asks this module three questions: is a model available,
 * embed these texts, and generate an answer. Keeping it here means switching
 * provider or model later is a change to this file and .env, nothing else.
 *
 * Calls go over REST rather than the SDK so the request shape (notably
 * outputDimensionality for embeddings) doesn't depend on the SDK version.
 */
const env = require('../config/env');

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const CHAT_MODEL = () => env.GEMINI_MODEL || 'gemini-3.8-flash';
const EMBED_MODEL = () => env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
// 768 keeps a whole library of books small enough to score in memory, and
// the provider's own guidance is that quality barely drops from the full size.
const EMBED_DIMS = 768;

// A rejected key is remembered until a call succeeds, so the admin page can
// say so. Calls are skipped for a cooldown after a rejection — every question
// would otherwise wait on a round trip that can't work — then tried again, in
// case the key was fixed.
let keyRejected = false;
let retryAfter = 0;
let lastError = '';

function isConfigured() {
  return Boolean(env.GEMINI_API_KEY) && Date.now() >= retryAfter;
}

function status() {
  if (!env.GEMINI_API_KEY) return { available: false, reason: 'No GEMINI_API_KEY is set in backend/.env' };
  if (keyRejected) return { available: false, reason: lastError };
  return { available: true, chatModel: CHAT_MODEL(), embeddingModel: EMBED_MODEL() };
}

function recordFailure(res, json) {
  const message = json?.error?.message || `HTTP ${res.status}`;
  const reason = json?.error?.details?.find?.((d) => d.reason)?.reason || json?.error?.status;
  // A bad key or a disabled API won't fix itself between requests.
  if ((res.status === 400 && /API key/i.test(message)) || res.status === 401 || res.status === 403) {
    keyRejected = true;
    retryAfter = Date.now() + 10 * 60_000;
    lastError = `The AI provider rejected the API key (${reason || res.status})`;
  }
  const err = new Error(message);
  err.status = res.status;
  return err;
}

async function call(path, body, method = 'POST', timeoutMs = 60_000) {
  const res = await fetch(`${BASE}/${path}${path.includes('?') ? '&' : '?'}key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw recordFailure(res, json);
  keyRejected = false;
  retryAfter = 0;
  return json;
}

/**
 * Checked once at startup, so the admin page shows a rejected key straight
 * away instead of only after the first student question fails.
 */
async function verify() {
  if (!env.GEMINI_API_KEY) {
    console.warn('[ai] No GEMINI_API_KEY set — students get textbook passages instead of AI answers.');
    return;
  }
  try {
    await call(`models/${CHAT_MODEL()}`, null, 'GET');
    console.log(`[ai] Using ${CHAT_MODEL()} and ${EMBED_MODEL()}.`);
  } catch (err) {
    console.warn(`[ai] ${lastError || err.message} — students get textbook passages instead of AI answers.`);
  }
}

/**
 * Embeds texts in batches. taskType is RETRIEVAL_DOCUMENT for book passages
 * and RETRIEVAL_QUERY for a student's question — the pair is trained to match.
 */
async function embed(texts, taskType = 'RETRIEVAL_DOCUMENT') {
  const model = `models/${EMBED_MODEL()}`;
  const out = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const json = await call(`${model}:batchEmbedContents`, {
      requests: batch.map((text) => ({
        model,
        content: { parts: [{ text: text.slice(0, 8000) }] },
        taskType,
        outputDimensionality: EMBED_DIMS
      }))
    });
    out.push(...json.embeddings.map((e) => e.values));
  }
  return out;
}

/**
 * history: [{ role: 'user' | 'assistant', content }], oldest first, ending
 * with the student's current question.
 */
// The website forwards API calls with a ~30 s limit (Next.js locally, Vercel
// when hosted), so an answer must be back well inside that, retry included.
const ANSWER_BUDGET_MS = 26_000;

// "High demand", rate limits and timeouts usually pass within seconds.
const isTransient = (err) =>
  [429, 500, 502, 503, 504].includes(err.status) || err.name === 'TimeoutError' || /high demand|overloaded|try again/i.test(err.message);

async function generate({ system, history }) {
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })),
    generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
  };
  const deadline = Date.now() + ANSWER_BUDGET_MS;
  let json;
  for (let attempt = 1; ; attempt++) {
    try {
      json = await call(`models/${CHAT_MODEL()}:generateContent`, body, 'POST', Math.max(1_000, deadline - Date.now()));
      break;
    } catch (err) {
      // One quick retry, only if there's still time for it to finish.
      if (attempt >= 2 || !isTransient(err) || deadline - Date.now() < 8_000) throw err;
      await new Promise((r) => setTimeout(r, 1_500));
    }
  }
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
  if (!text) {
    const why = json?.candidates?.[0]?.finishReason || json?.promptFeedback?.blockReason || 'empty';
    throw new Error(`The model returned no answer (${why})`);
  }
  return text;
}

function logFailure(what, err) {
  console.warn(`[ai] ${what} failed: ${err.message}`);
}

module.exports = { isConfigured, status, verify, embed, generate, logFailure, EMBED_DIMS };
