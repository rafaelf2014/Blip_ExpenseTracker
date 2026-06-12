export type Expense = {
  id: string;
  userId?: string;
  description: string;
  amount: number;       // expenses positive; income stored negative
  category: string;
  type: string;
  date: string;
  isIncome?: boolean;   // true for income rows generated from recurring income
  sourceId?: string;    // id of the RegularTransaction that generated this row
};

export type NewExpense = Omit<Expense, 'id'>;

export type RegularTransaction = {
  id: string;
  description: string;
  amount: number;
  isIncome: boolean;
  category: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  date: string;
};

export type Budget = {
  id: string;
  category: string;
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
};

export type BalanceEntry     = { month: string; balance: number };
export type BudgetUtilEntry  = { month: string; utilization: number };
export type SavingsRateEntry = { month: string; rate: number };

export type CategoryDatum = { name: string; value: number; color: string };
export type TrendDatum    = { month: string; income: number; expenses: number };

// Shape returned by GET /users/:id/settings
export type UserSettings = {
  profilePicture: string | null;
  currentBalance: number;
  regularTransactions: RegularTransaction[];
  budgets: Budget[];
  balanceHistory: BalanceEntry[];
  budgetUtilHistory: BudgetUtilEntry[];
  savingsRateHistory: SavingsRateEntry[];
};

// Shape returned by GET /expense-config
export type ExpenseConfig = {
  categories: string[];
  expenseTypes: string[];
};
