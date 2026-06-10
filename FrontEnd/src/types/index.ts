export type Expense = {
  id: string;
  userId?: string;
  description: string;
  amount: number;
  category: string;
  type: string;
  date: string;
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
