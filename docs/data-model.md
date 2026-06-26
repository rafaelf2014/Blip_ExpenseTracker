# Data Model

## The signed-amount money model (read this first)

Every transaction is a single row with **one signed `amount`**:

- **positive = spending** (an expense)
- **negative = income**

There is no separate "income" table and no `isExpense` flag driving the math. This one convention collapses income and expenses into a single code path:

```ts
// utils/finance.ts
sumSpent(rows)   // sum of positive amounts
sumIncome(rows)  // magnitude of negative amounts
sumNet(rows)     // income − spending  (= −Σ signed amounts)
computeBalance(start, rows)  // start + net
```

`isIncome` exists on rows, but it's a convenience marker for income rows generated from recurring templates — the *sign* of `amount` is the source of truth. When you write code that touches money, respect the sign; don't assume amounts are positive.

All the shared money/date helpers live in `utils/finance.ts` and are covered by `__tests__/finance.test.ts`.

## Storage

The "database" is a single JSON file, `BackEnd/src/db.json`, managed by [lowdb](https://github.com/typicode/lowdb). On import, `db.ts` loads the whole file into memory (`db.data`); route handlers mutate `db.data` and call `await db.write()` to flush back to disk.

Implications worth knowing:
- It's the entire DB in memory — fine for a demo, not concurrent-safe or scalable.
- **Don't hand-edit `db.json` while the server is running** — the in-memory copy will overwrite your edits on the next `db.write()`. Stop the server first. (See [development.md](development.md#gotchas).)

## Schema

Top-level shape (`DatabaseSchema` in `db.ts`):

```ts
{
  users: User[],
  expenses: Expense[],
  categories: string[],      // canonical category names
  expenseTypes: string[],    // canonical type names
}
```

### Expense

```ts
type Expense = {
  id: string;
  userId: string;
  description: string;
  amount: number;       // signed: + spending, − income
  category: string;     // canonical English, e.g. "Food"
  type: string;         // "One-time" | "Monthly" | "Yearly" | "Recurring" | ...
  date: string;         // ISO
  isIncome?: boolean;   // true on income rows generated from recurring templates
  sourceId?: string;    // id of the RegularTransaction that generated this row (if any)
}
```

`category` and `type` are stored as **canonical English values**. The UI translates only the displayed label (`t('categories.food')`), so filtering and data stay language-independent.

### User

The `User` carries the profile plus per-user financial config:

```ts
type User = {
  id: string;
  username: string;
  password: string;          // plain text — demo only
  profilePicture?: string;   // base64
  currentBalance?: number;   // starting balance baseline
  regularTransactions?: RegularTransaction[];
  budgets?: Budget[];
  balanceHistory?: BalanceEntry[];       // [{ month: "YYYY-MM", balance }]
  budgetUtilHistory?: BudgetUtilEntry[]; // [{ month, utilization }]
  savingsRateHistory?: SavingsRateEntry[];
  recurringSkips?: RecurringSkip[];      // deleted/edited occurrences not to regenerate
}
```

The `*History` arrays are snapshots written by the app when settings are saved — they're **not** recomputed from raw expenses on read. If you bulk-edit expenses, the history won't update until the next save.

### RegularTransaction (recurring template)

```ts
type RegularTransaction = {
  id: string;
  description: string;
  amount: number;       // stored positive; sign is applied when materialized
  isIncome: boolean;
  category: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  date: string;         // ISO date of the FIRST occurrence — defines which
                        // day-of-month/week/year it repeats on
}
```

## Recurring transactions

Templates are **materialized into real `Expense` rows** rather than computed on the fly. This happens via `POST /api/expenses/sync-recurring/:userId`, which the frontend calls on load (it's idempotent, so calling it repeatedly is safe).

How the sync works (`expense.routes.ts` + `recurring.ts`):

1. **`occurrenceDates(template, today)`** (pure, in `recurring.ts`) returns every date the template should have fired, from its start date up to today.
2. For each occurrence, a row is created with a deterministic id `${templateId}|${date}` so duplicates can't happen. Income rows are written with a **negative** amount and `isIncome: true`.
3. **Skip list** — if the user deletes or edits a generated occurrence, a `RecurringSkip` (`{ sourceId, date }`) is recorded so the sync never regenerates that one. ("Skip this month's rent.")
4. **Detach on template delete** — if a template is removed, its already-generated rows are *kept* (so history and balance stay intact) but detached: their `sourceId` is cleared and they become normal one-off rows. No new occurrences are generated.

### The monthly edge case

Stepping a monthly recurrence naively (add 1 month) breaks on month-ends: a template starting the 31st would skip February or loop. Both `recurring.ts` and `finance.ts` (`countOccurrences`) handle this by stepping an **absolute month index** and **clamping the day** to each month's length (`new Date(y, m+1, 0)` = last day of month `m`). So a "31st" template fires on Feb 28/29 without drifting or looping. This is covered by tests — keep it that way if you touch the stepping logic.
