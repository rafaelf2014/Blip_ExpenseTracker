# AI Pipeline

The "AI" in is two separate features. The most important thing to understand: **the LLM does very little.** Most of the behavior is plain keyword/regex matching. This was a deliberate choice after a pure-LLM approach proved slow and unreliable on a small in-browser model.

Everything lives in `src/services/llm/`. The public surface is re-exported from `src/services/llmService.ts` (a barrel), so components/tests import from there.

## The two features

| Feature | Entry point | Uses the LLM? |
|---|---|---|
| Natural-language expense entry | `extractExpenseFromText` | Only as a fallback (description, or category when keywords miss) |
| Financial chatbot | `askFinancialQuestion` | **No.** 100% deterministic. |

## 1. Natural-language expense entry

File: `services/llm/extractExpense.ts`.

Given a sentence like *"Almoço no restaurante €15 ontem"*, it produces a structured expense `{ amount, date, category, type, description }`. It does this by running **deterministic parsers first**, and only reaching for the LLM when they're not enough.

```
text ──► extractAmount             (regex: €15, 15€, "15 euros", comma decimals)
     ──► extractDate               (keywords: hoje/ontem/today/yesterday, weekday names,
     │                              explicit YYYY-MM-DD / DD-MM-YYYY)
     ──► classifyType              (keywords → One-time / Monthly / Yearly)
     ──► classifyCategory          (keyword + fuzzy match against the keyword bank)
              │
              ├─ keywords found a category  ──► LLM only for a short description
              └─ keywords found nothing     ──► LLM for {category, description}
                                                (and the unknown term is logged)
```

- **Amount** - a single regex handles prefix/suffix currency symbols (`€ $ £`), spelled-out currency words (`eur`, `euros`, `dollar(s)`, `dólar(es)`, `pound(s)`, `libra(s)`), and comma decimals. A number with **no** currency token is intentionally *not* parsed (returns 0) - the currency anchor is what disambiguates the amount from years/quantities in a sentence.
- **Date** - relative words, weekday names (PT + EN), or an explicit date. Defaults to today.
- **Category** - matched against `constants/keywords.ts`, an expandable bilingual list with brand/store names (Continente, Uber, Netflix, …). Matching is accent-insensitive and typo-tolerant (Levenshtein) - see `textUtils.ts`.
- **The LLM's job is small**: if keywords already nailed the category, the LLM just writes a tidy 1–4 word English description. If keywords found *no* category, the LLM is asked for `{category, description}` as JSON (few-shot prompted). Either way, every LLM call has a timeout - if it's slow or fails, the code falls back to a description derived from the raw text.

**Net effect:** the common case is fast, deterministic, and fully testable with the LLM mocked. The model only handles the long tail, and the feature still works if the model never loads.

## 2. The chatbot

Files: `services/llm/askFinancialQuestion.ts`, `dateContext.ts`, `queries/`.

The chatbot answers questions like *"How much did I spend on food in June?"* - and it does so **without the LLM at all**. It's a rules engine:

1. **`detectChatIntent`** - keyword check to tell a financial question apart from noise.
2. **`detectQueryType`** - regex classifier into one of 12 query types: `TOTAL`, `MAX`, `AVERAGE`, `LIST`, `BUDGET`, `INCOME`, `COUNT`, `MOST_FREQUENT`, `DISTINCT_CATEGORIES`, `PERCENTAGE`, `DUPLICATES`, `ROUND_AMOUNTS`.
3. **`parseDateContext`** - interprets the time window from the question (months, years, quarters, "last N days", weekdays - PT + EN).
4. **A handler per query type** (`queries/handlers.ts`) computes the answer from the real data and formats a bilingual response (strings in `queries/messages.ts`).

**Why deterministic:** financial answers have to be correct and instant. A 1.5B model hallucinates arithmetic and a bigger model would be unsustainable on a lower performing device, rules don't. The trade-off is that the chatbot only understands the 12 query types - a phrasing outside the keyword/regex coverage falls through to an "I didn't understand" message. That's an acceptable price for answers you can trust.

## The WebLLM engine

File: `services/llm/engine.ts`.

- Model: **Qwen2.5-1.5B-Instruct (q4f16_1, ~950 MB)**, chosen as a balance of size, PT/EN quality, and reliability.
- It runs in a **Web Worker** (`services/webllm-worker.ts`) so inference never blocks the UI thread. The worker file is tiny - it just wires WebLLM's handler to the worker's message port.
- The engine exposes a small status API: `initLLM`, `getLLMStatus` (`idle | loading | ready | error`), `getLLMProgress` (0–1), and `subscribeLLM` for the UI to show a download spinner. The `useLLMStatus` hook wraps this for components.
- Loading is **lazy and single-flight**: the model loads once (triggered after a successful login), and concurrent callers share one init promise.
- Every inference call is wrapped in `withTimeout`, so a slow/failed call degrades gracefully to the deterministic path.

## Where to change things

- Add/adjust category detection → `constants/keywords.ts`.
- Add a new chatbot query type → add a regex branch in `detectQueryType`, a handler in `queries/handlers.ts`, and its strings in `queries/messages.ts`.
- Change the model → `SELECTED_MODEL` in `engine.ts`.
- Tune extraction → `extractExpense.ts` (and update the prompt-bank tests in `__tests__/`).
