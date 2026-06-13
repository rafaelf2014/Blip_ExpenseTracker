export type Expense = {
  id: string;
  userId?: string;
  description: string;
  amount: number;       // gastos positivos; rendimento guardado como negativo
  category: string;
  type: string;
  date: string;
  isIncome?: boolean;   // true nas linhas de rendimento vindas de recorrentes
  sourceId?: string;    // id do recorrente que gerou esta linha
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

// O que vem do GET /users/:id/settings
export type UserSettings = {
  profilePicture: string | null;
  currentBalance: number;
  regularTransactions: RegularTransaction[];
  budgets: Budget[];
  balanceHistory: BalanceEntry[];
  budgetUtilHistory: BudgetUtilEntry[];
  savingsRateHistory: SavingsRateEntry[];
};

// O que vem do GET /expense-config
export type ExpenseConfig = {
  categories: string[];
  expenseTypes: string[];
};
