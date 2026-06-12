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

/** Fetch a user's settings, normalized so every field has a safe default. */
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

/** Fetch a user's transactions (expenses + income rows). */
export async function fetchExpenses(userId: string): Promise<Expense[]> {
    const res = await fetch(`${API_BASE}/expenses/${userId}`);
    if (!res.ok) return [];
    return res.json();
}

/** Fetch the available categories and expense types. */
export async function fetchExpenseConfig(): Promise<ExpenseConfig> {
    const res = await fetch(`${API_BASE}/expense-config`);
    return res.json();
}

/**
 * Ask the backend to materialize any missing recurring-transaction occurrences
 * (up to today). Idempotent — safe to call on load. Resolves once done.
 */
export async function syncRecurring(userId: string): Promise<void> {
    if (!userId) return;
    try {
        await fetch(`${API_BASE}/expenses/sync-recurring/${userId}`, { method: 'POST' });
    } catch (err) {
        console.error('Failed to sync recurring transactions:', err);
    }
}
