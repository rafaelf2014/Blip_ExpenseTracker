# Blip Expense Tracker — AI-Powered Personal Finance App

A full-stack personal expense tracking web application developed by a 2-person team.

The app combines a clean financial dashboard with a hybrid AI pipeline that lets users log expenses through natural language — by typing or speaking in Portuguese or English.

---

## Features

### Expense Management
- Add, edit, and delete expenses with category, type, date, and amount
- Expense types: One-time, Monthly, Yearly, Subscription
- Categories: Food, Health, Clothes, Housing, Transportation, Entertainment, Other
- Sortable, paginated transaction table with multi-filter support (category, type, date range, amount range, search)

### AI — Natural Language Expense Logging
Two interfaces for AI-assisted expense entry:

**Inline AI Bar** (Transactions page)
- Type a natural language description (e.g. *"Paguei 40€ de eletricidade ontem"*)
- Optional Quick Insert mode — skips confirmation and saves immediately
- Confirmation modal to review and edit AI-extracted data before saving

**Floating AI Chatbot** (all pages)
- Intent detection distinguishes between expense logging and financial queries
- Expense logging: extracts and confirms expense data from conversational input
- Financial Q&A: answers questions about spending (e.g. *"Quanto gastei em comida este mês?"*) with natural language date parsing (relative ranges, weekdays, month/year references)
- Both interfaces support **voice input** via the Web Speech API (pt-PT)

### AI Pipeline — How It Works
Expense parsing runs through a 3-stage hybrid pipeline:

1. **Keyword matching** — instant categorization using an extensive bilingual (PT/EN) keyword list with brand/store names, covering all expense categories
2. **Levenshtein fuzzy matching** — handles typos and partial words by computing edit distance against keywords
3. **WebLLM (Qwen2.5-1.5B)** — locally-run language model via Web Worker, used for ambiguous inputs where keyword matching fails; generates a clean English description and infers the correct category

Unknown terms are stored in `localStorage` for iterative improvement of the keyword list.

### Dashboard
- Summary cards: current balance, monthly income, monthly expenses with month-over-month % change
- Spending chart (week / month / year toggle) with Recharts bar chart
- Quick stats: average daily spend, largest expense, budget utilization %, savings rate %
- Recent transactions list

### Analytics
- Donut chart — expense breakdown by category with percentages
- Line chart — income vs expenses trend over time
- Top spending categories ranked with progress bars
- All charts respect the active filter state (date range, category, type, amount)

### Settings
- **Profile** — username update, profile picture upload (base64)
- **Security** — password change with current password verification
- **Financial Setup** — set current balance; configure recurring transactions (salary, rent, subscriptions) with weekly/monthly/yearly frequency
- **Budgets** — set per-category spending caps with period (weekly/monthly/yearly); budget utilization tracked on dashboard
- **Preferences** — currency (EUR, USD, GBP, BRL), language (EN/PT via react-i18next), date format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, SCSS, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | lowdb (JSON file-based) |
| AI — Local LLM | WebLLM (Qwen2.5-1.5B-Instruct via Web Worker) |
| AI — NLP | Custom keyword matcher + Levenshtein fuzzy matching |
| Voice Input | Web Speech API |
| i18n | react-i18next (EN / PT) |
| Routing | React Router v6 |

---

## Architecture

```
FrontEnd/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── AiExpenseBar    # Inline NL expense entry bar
│   │   ├── AiChatBot       # Floating chatbot with intent detection
│   │   ├── ConfirmAiModal  # Review/edit AI-extracted expense before saving
│   │   ├── ExpenseTable    # Sortable, paginated transaction table
│   │   ├── FilterControl   # Multi-filter panel
│   │   ├── SummaryBoxes    # KPI cards
│   │   └── settings/       # Profile, Security, Financial, Budgets, Preferences
│   ├── pages/              # Dashboard, Transactions, Analytics, Settings
│   ├── hooks/              # useDashboard, useTransactions, useAnalytics, useSettings
│   ├── services/           # llmService (NLP pipeline + WebLLM)
│   ├── Context/            # CurrencyContext, DateContext, i18n
│   ├── constants/          # API base URL, categories, keyword lists
│   └── utils/              # finance.ts (income calc, date helpers), iconMapping

BackEnd/
└── src/
    ├── routes/
    │   ├── expense.routes.ts   # CRUD for expenses
    │   └── user.routes.ts      # Auth, profile, settings, budgets
    ├── db.ts                   # lowdb setup and type definitions
    └── db.json                 # Persistent JSON store
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Backend

```bash
cd BackEnd
npm install
npm run dev
```

Server runs on `http://localhost:5000`

### Frontend

```bash
cd FrontEnd
npm install
npm run dev
```

App runs on `http://localhost:5173`

> **Note:** The WebLLM model (~950MB) is downloaded from the web on first use and cached in the browser. Keyword matching runs instantly while the model loads in the background.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Login |
| GET | `/api/expenses/:userId` | Get all expenses for a user |
| POST | `/api/expenses` | Add a new expense |
| PUT | `/api/expenses/:id` | Update an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |
| GET | `/api/users/:userId/settings` | Get user settings |
| PUT | `/api/users/:userId/settings` | Update user settings |
| PUT | `/api/users/update` | Update username |
| PUT | `/api/users/update-password` | Update password |
| GET | `/api/expense-config` | Get categories and expense types |
