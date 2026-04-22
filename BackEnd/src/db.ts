import { JSONFilePreset } from 'lowdb/node';

export type RegularTransaction = {
  id: string;
  description: string;
  amount: number;
  isIncome: boolean;
  category: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  date: string; // ISO date of first occurrence — defines the day-of-month/week/year it repeats
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
  utilization: number; // percentage, can exceed 100
};

export type SavingsRateEntry = {
  month: string;
  rate: number; // percentage, can be negative
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
};

export type Expense = {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  type: string;
  date: string;
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
  categories: ['Food', 'Health', 'Clothes', 'Housing', 'Transportation', 'Entertainment', 'Other'],
  expenseTypes: ['One-time', 'Monthly', 'Yearly', 'Subscription']
};

export const db = await JSONFilePreset<DatabaseSchema>('src/db.json', defaultData);
