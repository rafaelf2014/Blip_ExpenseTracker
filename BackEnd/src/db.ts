import { JSONFilePreset } from 'lowdb/node';

export type RegularTransaction = {
  id: string;
  description: string;
  amount: number;
  isIncome: boolean;
  category: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  date: string; // data ISO da 1ª ocorrência — define o dia do mês/semana/ano em que repete
};

export type Budget = {
  id: string;
  category: string;
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
};

export type BalanceEntry = {
  month: string; // 'YYYY-MM'
  balance: number;
};

export type BudgetUtilEntry = {
  month: string;
  utilization: number; // percentagem, pode passar de 100
};

export type SavingsRateEntry = {
  month: string;
  rate: number; // percentagem, pode ser negativa
};

// Uma ocorrência apagada de um recorrente, para o sync não a voltar a criar.
export type RecurringSkip = {
  sourceId: string;
  date: string; // YYYY-MM-DD da ocorrência saltada
};

export type User = {
  id: string;
  username: string;
  password: string;
  profilePicture?: string;
  currentBalance?: number;
  regularTransactions?: RegularTransaction[];
  budgets?: Budget[];
  balanceHistory?: BalanceEntry[];
  budgetUtilHistory?: BudgetUtilEntry[];
  savingsRateHistory?: SavingsRateEntry[];
  recurringSkips?: RecurringSkip[];
};

export type Expense = {
  id: string;
  userId: string;
  description: string;
  amount: number;       // gastos positivos; rendimento guardado como negativo
  category: string;
  type: string;
  date: string;
  isIncome?: boolean;   // true nas linhas de rendimento (valor negativo)
  sourceId?: string;    // id do recorrente que gerou esta linha (se houver)
};

export type DatabaseSchema = {
  users: User[];
  expenses: Expense[];
  categories: string[];
  expenseTypes: string[];
};

const defaultData: DatabaseSchema = {
  users: [],
  expenses: [],
  categories: ['Food', 'Health', 'Clothes', 'Housing', 'Transportation', 'Entertainment', 'Utilities', 'Other'],
  expenseTypes: ['One-time', 'Monthly', 'Yearly', 'Subscription']
};

export const db = await JSONFilePreset<DatabaseSchema>('src/db.json', defaultData);
