# Architecture

## Overview

BLIP is a two-part app:

- **FrontEnd/** - a React single-page app (Vite). All the UI, state, and the AI run here, in the browser.
- **BackEnd/** - a small Express server that persists data to a JSON file (lowdb). It has no business logic to speak of; it's basically typed CRUD + a recurring-transaction sync endpoint.

```
┌──────────────────────────── Browser ──────────────────────────────┐
│  React SPA (Vite, port 5173)                                      │
│                                                                   │
│  pages/ ── render ──► hooks/ ── fetch ──► services/api.ts  ──┐    │
│                          │                                   │    │
│                          └─ AI ─► services/llm/ ─► Web Worker│    │
│                                    (WebLLM, used rarely)     │    │
└──────────────────────────────────────────────────────────────┼────┘
                                                               │ HTTP
                                                               ▼
┌──────────────────────── Node + Express (port 5000) ──────────────┐
│  routes/ ──► db.ts (lowdb) ──► db.json                           │
└──────────────────────────────────────────────────────────────────┘
```

## Frontend layers

The frontend is organized so that **pages stay thin and logic stays in hooks**. From outermost to innermost:

| Layer | Folder | Responsibility |
|---|---|---|
| Pages | `src/pages/` | One file per route. Mostly JSX + wiring. They call a hook for data/state and render it. |
| Hooks | `src/hooks/` | All the real work: data fetching, derived state, memoized calculations. E.g. `useDashboard` computes balance, chart data, and quick stats. |
| Components | `src/components/` | Reusable UI. `modals/` holds the dialogs, `sections/` holds the Planning/Settings panels. |
| Services | `src/services/` | `api.ts` (typed `fetch` wrappers) and `llm/` (the AI pipeline). |
| Context | `src/context/` | App-wide state via React Context: theme, currency, date format, i18n. |
| Utils / constants / types | `src/utils`, `src/constants`, `src/types` | Pure helpers (`finance.ts`), keyword lists, shared TypeScript types. |

**Why this split:** a page like `Dashboard.tsx` should read like a description of the screen. If you need to know *how* the balance is computed, you go to `useDashboard.ts`; if you need the math itself, `utils/finance.ts`. Each layer only knows about the one below it.

### Routing & auth

Routing is React Router (`App.tsx`). Routes are wrapped in a `ProtectedRoute` that checks for a `userId` in `localStorage` and redirects to `/` (the login page) if it's missing.

"Auth" is intentionally minimal: on login the backend returns the user's `id` + `username`, the frontend stores them in `localStorage`, and every API call passes the `userId`. There are **no tokens and no server-side session** - this is a local demo, not production auth. See [development.md](development.md#security).

## Backend

The backend is deliberately thin:

- `index.ts` - sets up Express, CORS, JSON body parsing (limit raised to 5 MB for base64 profile pictures), and mounts the two routers.
- `routes/user.routes.ts` - register, login, username/password updates, and user settings (balance, recurring transactions, budgets, history).
- `routes/expense.routes.ts` - expense CRUD, the expense-config endpoint, and the recurring-sync endpoint.
- `db.ts` - lowdb setup and all the shared types. Importing it reads `db.json` from disk.
- `recurring.ts` - a pure function (`occurrenceDates`) that computes when a recurring template should fire. Kept separate from `db.ts` so it has no file-I/O dependency and is unit-testable.

There's no ORM, no migrations, no controllers/services split - the route handlers read and write `db.data` directly and call `db.write()`. For a project this size that's the right amount of structure.

## Data flow: a typical request

Loading the Transactions page:

1. `Transactions.tsx` renders and calls `useTransactions()`.
2. The hook, on mount, calls `syncRecurring(userId)` (so any due recurring rows exist), then `fetchExpenses(userId)`.
3. Those go through `services/api.ts`, which `fetches` the Express server.
4. Express reads `db.data.expenses`, filters by `userId`, returns JSON.
5. The hook stores the result in state; the page renders the table.

Adding an expense by natural language:

1. User types a sentence in the AI modal.
2. `extractExpenseFromText` (in `services/llm/`) parses it - see [ai-pipeline.md](ai-pipeline.md).
3. The result is shown in a confirmation modal for the user to review/edit.
4. On confirm, `POST /api/expenses` saves it; the list refreshes.

## Key conventions

- **Signed-amount money model** - every transaction is one row with a signed amount (positive = spending, negative = income). See [data-model.md](data-model.md). This touches almost every calculation, so know it before changing finance code.
- **i18n** - all user-facing text goes through `t('key')` (react-i18next), with strings in `src/locales/{en,pt}.json`. Category/type *values* stay canonical English; only their *labels* are translated.
- **Theming** - colors are CSS custom properties that flip on `<html data-theme="light">`. SCSS reads them via tokens in `styles/_tokens.scss`.
