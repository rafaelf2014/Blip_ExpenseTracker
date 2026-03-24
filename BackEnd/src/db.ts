// backend/src/db.ts
import { JSONFilePreset } from 'lowdb/node';

// 1. Tell TypeScript exactly what a "User" looks like
export type User = {
  id: string;
  username: string;
  password: string; 
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

// 2. Tell TypeScript what the entire db.json file looks like
export type DatabaseSchema = {
  users: User[];
  expenses: Expense[];
  categories: string[];
  expenseTypes: string[];
};

// 3. Set the default empty state just in case db.json is deleted
const defaultData: DatabaseSchema = { 
  users: [], 
  expenses: [],
  categories: ['Food', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Housing', 'Other'],
  expenseTypes: ['One-time', 'Monthly', 'Yearly', 'Trimesterly', 'Semi-Annual']
};

// 4. Connect to the db.json file (make sure the path matches where your file is!)
export const db = await JSONFilePreset<DatabaseSchema>('src/db.json', defaultData);