# Development Guide

## Running locally

You need **Node 22+** (the backend runs TypeScript directly via `--experimental-strip-types`).

Two terminals:

```bash
# 1. Backend  (http://localhost:5000)
cd BackEnd
npm install
npm run dev        # node --watch --experimental-strip-types src/index.ts

# 2. Frontend (http://localhost:5173)
cd FrontEnd
npm install
npm run dev
```

The frontend's API base URL is hardcoded to `http://localhost:5000/api` in `FrontEnd/src/constants/api.ts` — change it there if needed.

> First AI use downloads the ~950 MB model into the browser cache. Keyword matching works immediately while it loads in the background; the chatbot never needs the model.

## Scripts

**FrontEnd** (`package.json`):
- `npm run dev` — Vite dev server
- `npm run build` — typecheck (`tsc -b`) + production build
- `npm test` — Vitest (unit/integration)
- `npm run test:e2e` — Playwright
- `npm run lint` — ESLint

**BackEnd**:
- `npm run dev` — server with `--watch` (restarts on change)
- `npm start` — server without watch

## Tests

Vitest suites live in `FrontEnd/src/__tests__/`. They run with the LLM **mocked**, which keeps them fast and — importantly — verifies the deterministic fallback paths work without a model.

Notable suites:
- `finance.test.ts` — the signed-amount math, balance, date helpers, recurring occurrence counting.
- `expensePromptBank.test.ts` — a "prompt bank" asserting amount/date/type/category extraction across many PT/EN/brand phrasings.
- `chatbotPromptBank.test.ts` — every chatbot query type in PT and EN.
- `textUtils.test.ts`, `recurringSync.test.ts`, `incomeModel.test.ts`, plus the base `extractExpense` / `llmService` suites.

Run a single suite: `npx vitest run src/__tests__/finance.test.ts`.

## Conventions

### i18n
- All user-facing strings go through `t('key')` (react-i18next). Strings live in `src/locales/en.json` and `pt.json` — **keep both files in sync** (same keys).
- Category/type **values** stay canonical English in code and the DB. Only the **label** is translated: `t(\`categories.${cat.toLowerCase()}\`, cat)`. The second argument is a fallback, so an unkeyed value (e.g. a `Recurring` type) renders its raw text instead of breaking.
- The active language is persisted in `localStorage` (`app_language`) and initialized in `context/i18n.ts`.

### Theming
- Two themes (dark default, light) implemented as CSS custom properties in `styles/global.scss` (`:root` vs `[data-theme='light']`). `ThemeContext` toggles the `data-theme` attribute on `<html>`.
- SCSS consumes the variables through tokens in `styles/_tokens.scss` — use those tokens, don't hardcode hex.
- **Recharts is the exception**: it needs concrete color strings, not CSS vars. The Dashboard chart maps the theme value directly to a color palette (`CHART_COLORS[theme]`) computed during render — *not* read from the DOM, because reading `getComputedStyle` in an effect lagged a toggle behind (child effects run before the parent context's effect that sets `data-theme`). If you add themed charts, follow the same map-from-`theme` pattern.

### Money
See [data-model.md](data-model.md). Signed amounts, all math in `utils/finance.ts`.

### File organization
Pages thin, logic in hooks, AI in `services/llm/`. See [architecture.md](architecture.md).

## Gotchas

A few things that have bitten us:

- **Don't edit `db.json` while the backend is running.** lowdb keeps the whole DB in memory and rewrites the file on every `db.write()`, so a running server will clobber your manual edits. Stop the server, edit, then start it (it reads the file fresh on boot).
- **`db.json` must be UTF-8 without a BOM.** A BOM makes lowdb's JSON parse fail on startup. Some Windows editors/PowerShell add one — if the server crashes parsing the DB, check for a BOM.
- **Mojibake in seed data.** The seed expenses contain Portuguese accents (Café, Ginásio, Almoço). If they ever show as `CafÃƒÂ©`-style garbage, the file got double-encoded — re-save it as clean UTF-8.
- **Recurring occurrences only go up to today.** The sync won't create future rows, so e.g. a salary dated later this month won't appear until that date arrives. That's intended.

## Security (known, deliberate)

This is an academic project; security was scoped out on purpose. Be aware:
- Passwords are stored and compared in **plain text**.
- There's **no auth middleware** — any client can request any `userId`'s data.
- "Sessions" are just `userId`/`username` in `localStorage`.

Fine for a local demo. If this were ever to go further, the first steps would be: hash passwords (bcrypt/argon2), real auth tokens, and per-user authorization on every route.
