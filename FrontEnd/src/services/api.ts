import { API_BASE } from '../constants/api';
import type { Expense, UserSettings, ExpenseConfig } from '../types';

const EMPTY_SETTINGS: UserSettings = {
    profilePicture: null,
    currentBalance: 0,
    regularTransactions: [],
    budgets: [],
    balanceHistory: [],
    budgetUtilHistory: [],
    savingsRateHistory: [],
};

// Vai buscar as settings do user, já com defaults para cada campo.
export async function fetchUserSettings(userId: string): Promise<UserSettings> {
    const res = await fetch(`${API_BASE}/users/${userId}/settings`);
    const data = await res.json();
    return {
        profilePicture:      data.profilePicture ?? null,
        currentBalance:      data.currentBalance ?? 0,
        regularTransactions: data.regularTransactions ?? [],
        budgets:             data.budgets ?? [],
        balanceHistory:      data.balanceHistory ?? [],
        budgetUtilHistory:   data.budgetUtilHistory ?? [],
        savingsRateHistory:  data.savingsRateHistory ?? [],
    };
}

export { EMPTY_SETTINGS };

// Vai buscar as transações do user (despesas + rendimentos).
export async function fetchExpenses(userId: string): Promise<Expense[]> {
    const res = await fetch(`${API_BASE}/expenses/${userId}`);
    if (!res.ok) return [];
    return res.json();
}

// Vai buscar as categorias e os tipos de despesa disponíveis.
export async function fetchExpenseConfig(): Promise<ExpenseConfig> {
    const res = await fetch(`${API_BASE}/expense-config`);
    return res.json();
}

// Pede ao backend para criar as ocorrências de recorrentes que faltam (até hoje).
// É idempotente, dá para chamar no arranque sem problemas.
export async function syncRecurring(userId: string): Promise<void> {
    if (!userId) return;
    try {
        await fetch(`${API_BASE}/expenses/sync-recurring/${userId}`, { method: 'POST' });
    } catch (err) {
        console.error('Failed to sync recurring transactions:', err);
    }
}
