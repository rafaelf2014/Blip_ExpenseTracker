import { describe, it, expect, vi } from 'vitest';
import { askFinancialQuestion } from '../services/llmService';
import type { Expense, RegularTransaction } from '../types';

// Stub the WebLLM worker (the service imports it at module load).
vi.mock('@mlc-ai/web-llm', () => ({ CreateWebWorkerMLCEngine: vi.fn() }));

// Regression coverage for the signed-amount model: income rows are stored with a
// NEGATIVE amount (e.g. salary -2000). Spending queries must ignore them.

function exp(id: string, description: string, amount: number, category: string, date: string, extra: Partial<Expense> = {}): Expense {
    return { id, description, amount, category, date, type: 'One-time', userId: 'u1', ...extra };
}

const NO_REGULAR: RegularTransaction[] = [];

// June 2026: two real expenses (120 + 45 = 165) plus a recurring income row (-2000).
const ROWS: Expense[] = [
    exp('1', 'Supermarket', 120, 'Food', '2026-06-01'),
    exp('2', 'Restaurant',   45, 'Food', '2026-06-02'),
    exp('i', 'Salary',    -2000, 'Other', '2026-06-01', { isIncome: true, sourceId: 'tpl1', type: 'Recurring' }),
];

const ask = (q: string) => askFinancialQuestion(q, ROWS, NO_REGULAR, [], 'en');

describe('income rows (negative amounts) are excluded from spending queries', () => {
    it('TOTAL spending ignores the income row', async () => {
        const res = await ask('how much did I spend on food in June 2026?');
        expect(res).toContain('165'); // 120 + 45, NOT reduced by the -2000 income
    });

    it('total across all categories ignores income', async () => {
        const res = await ask('how much did I spend in June 2026?');
        expect(res).toContain('165.00');
        expect(res).not.toContain('2000'); // income must not appear as spending
    });

    it('MAX expense never picks the income row', async () => {
        const res = await ask('what was my largest expense in June 2026?');
        expect(res).toContain('120.00');         // the supermarket, not the -2000 salary
        expect(res).not.toContain('Salary');
    });

    it('COUNT does not include the income row', async () => {
        const res = await ask('how many transactions in June 2026?');
        expect(res).toContain('2'); // two real expenses, income excluded
    });

    it('LIST does not surface the income row', async () => {
        const res = await ask('show my June 2026 expenses');
        expect(res).toContain('Supermarket');
        expect(res).not.toContain('Salary');
    });

    it('AVERAGE per transaction is over the 2 real expenses only', async () => {
        const res = await ask('average spending in June 2026');
        // (120 + 45) / 2 = 82.50
        expect(res).toContain('82.50');
    });
});

describe('all-income month reads as no spending', () => {
    const incomeOnly: Expense[] = [
        exp('i', 'Salary', -2000, 'Other', '2026-06-01', { isIncome: true, sourceId: 'tpl1' }),
    ];
    it('reports no expenses found, not a negative total', async () => {
        const res = await askFinancialQuestion('how much did I spend in June 2026?', incomeOnly, NO_REGULAR, [], 'en');
        expect(res).toMatch(/no expenses|found no/i);
        expect(res).not.toContain('-2000');
    });
});
