import { describe, it, expect } from 'vitest';
import {
    sumSpent, sumIncome, sumNet, computeBalance,
    toLocalDateStr, getWeekStart, monthKey, pctOrZero,
    countOccurrences, calcIncome, makeExpenseFilter, computeMonthlyMetrics,
} from '../utils/finance';
import type { Expense, RegularTransaction, Budget } from '../types';

// Fixtures
function exp(amount: number, category = 'Food', date = '2026-06-01', extra: Partial<Expense> = {}): Expense {
    return { id: Math.random().toString(), description: 'x', amount, category, date, type: 'One-time', userId: 'u1', ...extra };
}
function rt(o: Partial<RegularTransaction>): RegularTransaction {
    return { id: '1', description: 'r', amount: 100, isIncome: true, category: 'Other', frequency: 'monthly', date: '2026-01-15', ...o };
}

// Signed-amount money helpers
describe('sumSpent / sumIncome / sumNet', () => {
    const rows = [exp(100), exp(50), exp(-200) /* income */, exp(-30) /* income */];

    it('sumSpent counts only positive amounts', () => {
        expect(sumSpent(rows)).toBe(150);
    });
    it('sumIncome counts the magnitude of negative amounts', () => {
        expect(sumIncome(rows)).toBe(230);
    });
    it('sumNet = income − spending', () => {
        expect(sumNet(rows)).toBe(230 - 150); // 80
    });
    it('all return 0 for an empty list', () => {
        expect(sumSpent([])).toBe(0);
        expect(sumIncome([])).toBe(0);
        expect(sumNet([])).toBe(0);
    });
    it('handles string amounts', () => {
        expect(sumSpent([exp('40' as unknown as number)])).toBe(40);
    });
    it('a zero amount contributes to neither spend nor income', () => {
        expect(sumSpent([exp(0)])).toBe(0);
        expect(sumIncome([exp(0)])).toBe(0);
    });
});

describe('computeBalance', () => {
    it('starting balance + income − spending', () => {
        // start 1000, spend 150, income 230 -> 1080
        expect(computeBalance(1000, [exp(100), exp(50), exp(-230)])).toBe(1080);
    });
    it('returns the starting balance when there are no transactions', () => {
        expect(computeBalance(500, [])).toBe(500);
    });
    it('can go negative when spending exceeds balance + income', () => {
        expect(computeBalance(0, [exp(100)])).toBe(-100);
    });
});

// Date helpers
describe('toLocalDateStr', () => {
    it('formats as YYYY-MM-DD with zero-padding', () => {
        expect(toLocalDateStr(new Date(2026, 0, 5))).toBe('2026-01-05');
        expect(toLocalDateStr(new Date(2026, 11, 31))).toBe('2026-12-31');
    });
});

describe('getWeekStart', () => {
    it('returns the Monday of the week (Wednesday input)', () => {
        // 2026-06-10 is a Wednesday -> Monday is 2026-06-08
        expect(toLocalDateStr(getWeekStart(new Date(2026, 5, 10)))).toBe('2026-06-08');
    });
    it('returns the same day when input is a Monday', () => {
        // 2026-06-08 is a Monday
        expect(toLocalDateStr(getWeekStart(new Date(2026, 5, 8)))).toBe('2026-06-08');
    });
    it('Sunday maps back to the previous Monday', () => {
        // 2026-06-14 is a Sunday -> Monday is 2026-06-08
        expect(toLocalDateStr(getWeekStart(new Date(2026, 5, 14)))).toBe('2026-06-08');
    });
});

describe('monthKey', () => {
    it('formats YYYY-MM', () => {
        expect(monthKey(new Date(2026, 2, 9))).toBe('2026-03');
    });
});

describe('pctOrZero', () => {
    it('computes percentage change to one decimal', () => {
        expect(pctOrZero(150, 100)).toBe('50.0');
        expect(pctOrZero(50, 100)).toBe('-50.0');
    });
    it('returns "0" when previous is null/undefined/zero (no baseline)', () => {
        expect(pctOrZero(100, null)).toBe('0');
        expect(pctOrZero(100, undefined)).toBe('0');
        expect(pctOrZero(100, 0)).toBe('0');
    });
    it('uses the absolute previous value as the denominator', () => {
        expect(pctOrZero(0, -100)).toBe('100.0'); // (0 - (-100)) / 100
    });
});

// Recurring occurrence engine
describe('countOccurrences', () => {
    it('monthly: counts each month from start to end inclusive', () => {
        // 15th of Jan..Jun = 6 occurrences
        const n = countOccurrences(rt({ frequency: 'monthly', date: '2026-01-15' }),
            new Date(2026, 0, 1), new Date(2026, 5, 30));
        expect(n).toBe(6);
    });
    it('monthly: does not count before the start date', () => {
        // template starts Mar 15; window Jan–Jun -> Mar,Apr,May,Jun = 4
        const n = countOccurrences(rt({ frequency: 'monthly', date: '2026-03-15' }),
            new Date(2026, 0, 1), new Date(2026, 5, 30));
        expect(n).toBe(4);
    });
    it('weekly: counts every 7 days within the window', () => {
        // start Mon 2026-06-01; window through 2026-06-30 -> 1,8,15,22,29 = 5
        const n = countOccurrences(rt({ frequency: 'weekly', date: '2026-06-01' }),
            new Date(2026, 5, 1), new Date(2026, 5, 30));
        expect(n).toBe(5);
    });
    it('yearly: counts one per year in range', () => {
        const n = countOccurrences(rt({ frequency: 'yearly', date: '2024-02-10' }),
            new Date(2024, 0, 1), new Date(2026, 11, 31));
        expect(n).toBe(3); // 2024, 2025, 2026
    });
    it('returns 0 when the template starts after the window ends', () => {
        const n = countOccurrences(rt({ frequency: 'monthly', date: '2026-12-01' }),
            new Date(2026, 0, 1), new Date(2026, 5, 30));
        expect(n).toBe(0);
    });
    it('monthly: a future-month window past the start still counts (later occurrences unaffected by the start-day boundary)', () => {
        // Start Jan 15; window Apr–Jun -> Apr,May,Jun = 3 (the start-day TZ quirk
        // only ever affects the very first occurrence, not subsequent months).
        const n = countOccurrences(rt({ frequency: 'monthly', date: '2026-01-15' }),
            new Date(2026, 3, 1), new Date(2026, 5, 30));
        expect(n).toBe(3);
    });
});

describe('calcIncome', () => {
    it('sums occurrences × amount for income templates only', () => {
        const txns = [
            rt({ id: 'a', isIncome: true,  amount: 1000, frequency: 'monthly', date: '2026-01-01' }),
            rt({ id: 'b', isIncome: false, amount: 500,  frequency: 'monthly', date: '2026-01-01' }), // expense, ignored
        ];
        // Jan–Mar = 3 months × 1000 income; the expense template is excluded
        expect(calcIncome(txns, new Date(2026, 0, 1), new Date(2026, 2, 31))).toBe(3000);
    });
    it('returns 0 with no income templates', () => {
        expect(calcIncome([rt({ isIncome: false })], new Date(2026, 0, 1), new Date(2026, 11, 31))).toBe(0);
    });
});

// Combined expense filter
describe('makeExpenseFilter', () => {
    const base = { searchTerm: '', filterCategory: '', filterType: '', filterTime: '', filterMin: '', filterMax: '' };
    const rows = [
        exp(120, 'Food', '2026-06-01', { description: 'Supermarket' }),
        exp(45,  'Food', '2026-06-02', { description: 'Restaurant' }),
        exp(30,  'Health', '2026-06-03', { description: 'Pharmacy' }),
    ];

    it('matches everything with empty filters', () => {
        expect(rows.filter(makeExpenseFilter(base))).toHaveLength(3);
    });
    it('filters by case-insensitive search', () => {
        expect(rows.filter(makeExpenseFilter({ ...base, searchTerm: 'super' }))).toHaveLength(1);
    });
    it('filters by category', () => {
        expect(rows.filter(makeExpenseFilter({ ...base, filterCategory: 'Health' }))).toHaveLength(1);
    });
    it('filters by min and max amount', () => {
        expect(rows.filter(makeExpenseFilter({ ...base, filterMin: '40' }))).toHaveLength(2);
        expect(rows.filter(makeExpenseFilter({ ...base, filterMax: '40' }))).toHaveLength(1);
    });
    it('combines filters (AND)', () => {
        const r = rows.filter(makeExpenseFilter({ ...base, filterCategory: 'Food', filterMin: '100' }));
        expect(r).toHaveLength(1);
        expect(r[0].description).toBe('Supermarket');
    });
});

// Monthly metrics
describe('computeMonthlyMetrics', () => {
    const budgets: Budget[] = [{ id: 'b1', category: 'Food', limit: 200, period: 'monthly' }];

    it('computes spend and income from signed rows', () => {
        const m = computeMonthlyMetrics([exp(100, 'Food'), exp(-1000, 'Other')], budgets);
        expect(m.monthSpent).toBe(100);
        expect(m.monthIncome).toBe(1000);
    });
    it('budget utilization = spent / limit (spending only, per category)', () => {
        const m = computeMonthlyMetrics([exp(100, 'Food'), exp(50, 'Health')], budgets);
        // only Food counts toward the Food budget: 100/200 = 50%
        expect(m.budgetUtilization).toBe(50);
    });
    it('savings rate = (income − spent) / income', () => {
        const m = computeMonthlyMetrics([exp(200, 'Food'), exp(-1000, 'Other')], budgets);
        // (1000 - 200) / 1000 = 80%
        expect(m.savingsRate).toBe(80);
    });
    it('null budgetUtilization when no monthly budgets', () => {
        expect(computeMonthlyMetrics([exp(100)], []).budgetUtilization).toBeNull();
    });
    it('null savingsRate when there is no income', () => {
        expect(computeMonthlyMetrics([exp(100)], budgets).savingsRate).toBeNull();
    });
});
