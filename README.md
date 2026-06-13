# BLIP Expense Tracker

A full-stack personal expense tracker with an on-device AI assistant. Built as a university final-year project by a 2-person team.

You log expenses the normal way (form) or in plain language by typing or speaking — in Portuguese or English. A small language model runs entirely in the browser (no cloud, no API keys), and a deterministic assistant answers questions about your spending.

## Features

- **Expenses** — add / edit / delete with category, type, date and amount. Sortable, paginated table with filters (search, category, type, date range, amount range).
- **Natural-language entry** — type or dictate something like *"Paguei 40€ de eletricidade ontem"* and review the parsed expense before saving.
- **Chatbot** — a floating assistant that answers spending questions (*"Quanto gastei em comida este mês?"*) with relative-date parsing. Fully deterministic — it doesn't call the LLM.
- **Dashboard** — balance, monthly income/expenses with month-over-month change, a spending chart (week/month/year) and quick stats.
- **Analytics** — category breakdown, income-vs-expense trend, top categories. Respects the active filters.
- **Planning** — recurring transactions (salary, rent, subscriptions; weekly/monthly/yearly) and per-category budgets.
- **Settings** — profile (incl. picture), password change, and preferences (currency, language EN/PT, date format, dark/light theme).
- **Voice input** via the Web Speech API (pt-PT).

### How the AI works

Expense parsing is a hybrid pipeline, fastest path first:

1. **Keywords** — a bilingual (PT/EN) keyword list with brand/store names categorizes most inputs instantly.
2. **Fuzzy matching** — Levenshtein distance covers typos and partial words.
3. **WebLLM (Qwen2.5-1.5B)** — a local model in a Web Worker, used only when keywords fail, to write a short description and infer the category.

The chatbot's financial answers are computed directly from your data (no LLM), so they're fast and exact. Unknown terms are saved to `localStorage` to help improve the keyword list later.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router 7, SCSS, Recharts |
| Backend | Node.js, Express 5, TypeScript |
| Database | lowdb (JSON file) |
| Local LLM | WebLLM — Qwen2.5-1.5B-Instruct, in a Web Worker |
| NLP | Keyword matcher + Levenshtein fuzzy matching |
| Voice | Web Speech API |
| i18n | react-i18next (EN / PT) |
| Tests | Vitest (unit/integration), Playwright (e2e) |

## Project Structure

```
FrontEnd/
└── src/
    ├── components/        # UI components
    │   ├── modals/        # Expense / Edit / AI / Confirm modals
    │   └── sections/      # Profile, Security, Financial, Budgets, Preferences panels
    ├── pages/             # Dashboard, Transactions, Analytics, Planning, Settings
    ├── hooks/             # useDashboard, useTransactions, useAnalytics, useSettings, ...
    ├── services/          # api.ts + llm/ (NLP pipeline, WebLLM engine, chatbot)
    ├── context/           # Currency, Date, Theme, i18n
    ├── constants/         # API base URL, categories, keyword lists
    ├── utils/             # finance.ts (money/date helpers), iconMapping
    └── __tests__/         # Vitest suites

BackEnd/
└── src/
    ├── routes/            # expense.routes.ts, user.routes.ts
    ├── recurring.ts       # recurring-occurrence date logic
    ├── db.ts              # lowdb setup + types
    └── db.json            # JSON store
```

## Getting Started

### Prerequisites
- Node.js 22+ (the backend runs TypeScript directly via `--experimental-strip-types`)
- npm

### Backend
```bash
cd BackEnd
npm install
npm run dev
```
Runs on `http://localhost:5000`.

### Frontend
```bash
cd FrontEnd
npm install
npm run dev
```
Runs on `http://localhost:5173`.

> The WebLLM model (~950 MB) downloads on first use and is cached by the browser. Keyword matching works immediately while the model loads in the background.

### Tests
```bash
cd FrontEnd
npm test          # Vitest
npm run test:e2e  # Playwright
```

## API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Login |
| GET | `/api/expenses/:userId` | Get a user's expenses |
| POST | `/api/expenses` | Add an expense |
| PUT | `/api/expenses/:id` | Update an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |
| POST | `/api/expenses/sync-recurring/:userId` | Materialize due recurring transactions |
| GET | `/api/expense-config` | Get categories and expense types |
| GET | `/api/users/:userId/settings` | Get user settings |
| PUT | `/api/users/:userId/settings` | Update user settings |
| PUT | `/api/users/update` | Update username |
| PUT | `/api/users/update-password` | Update password |

## Notes

This is an academic project: it prioritizes working features and a clean UI over production hardening. Passwords are stored in plain text and there is no auth middleware on the API routes — fine for a local demo, not for real use.
