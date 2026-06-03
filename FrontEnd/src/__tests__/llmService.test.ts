import { describe, it, expect, vi } from 'vitest';
import { detectChatIntent, askFinancialQuestion } from '../services/llmService';
import type { Expense, RegularTransaction, Budget } from '../types';

// The service imports @mlc-ai/web-llm which uses browser Worker — stub it out
vi.mock('@mlc-ai/web-llm', () => ({ CreateWebWorkerMLCEngine: vi.fn() }));

// ── Fixtures ──────────────────────────────────────────────────────────────────

function exp(id: string, description: string, amount: number, category: string, date: string): Expense {
    return { id, description, amount: amount as any, category, date, type: 'One-time', userId: 'u1' } as Expense;
}

// 2026 expenses (current year — used in year/quarter/month tests)
// Q2 2026 (Apr–Jun): Supermercado, Restaurante, Netflix, Uber, Electricidade, Farmácia
// 2025 expenses: Housing, Clothes, McDonald's duplicates, Spotify
const EXPENSES: Expense[] = [
    exp('1', 'Supermercado',    120,  'Food',           '2026-06-01'),  // Jun 2026
    exp('2', 'Restaurante',      45,  'Food',           '2026-06-02'),  // Jun 2026
    exp('3', 'Netflix',          15,  'Entertainment',  '2026-06-01'),  // Jun 2026
    exp('4', 'Uber',             22,  'Transportation', '2026-05-20'),  // May 2026 (Q2)
    exp('5', 'Renda',           700,  'Housing',        '2025-05-01'),  // 2025
    exp('6', 'Farmácia',         30,  'Health',         '2026-06-02'),  // Jun 2026
    exp('7', 'Zara',             80,  'Clothes',        '2025-04-10'),  // 2025
    exp('8', 'Electricidade',    60,  'Utilities',      '2026-05-15'),  // May 2026 (Q2)
    exp('9', 'McDonald\'s',      50,  'Food',           '2025-05-20'),  // 2025 — duplicate pair
    exp('a', 'McDonald\'s',      50,  'Food',           '2025-05-20'),  // 2025 — duplicate pair
    exp('b', 'Spotify',          10,  'Entertainment',  '2025-04-01'),  // 2025
];
// 2026 total: 120+45+15+22+30+60 = 292  |  Food 2026: 120+45 = 165
// Q2 2026 total: 120+45+15+22+30+60 = 292  |  All-time total: 1182

const BUDGETS: Budget[] = [
    { id: 'b1', category: 'Food',          limit: 200, period: 'monthly' },
    { id: 'b2', category: 'Entertainment', limit: 30,  period: 'monthly' },
];

const NO_REGULAR: RegularTransaction[] = [];

// Helper — call askFinancialQuestion with a fixed "today"
async function ask(q: string, expenses = EXPENSES) {
    // inject a fixed date by mocking Date — simpler: just call the function
    // (parseDateContext uses `new Date()` internally, so results are date-sensitive;
    //  for time-independent queries we use explicit dates in the question)
    return askFinancialQuestion(q, expenses, NO_REGULAR, []);
}

async function askBudget(q: string) {
    return askFinancialQuestion(q, EXPENSES, NO_REGULAR, BUDGETS);
}

// ── detectChatIntent ──────────────────────────────────────────────────────────

describe('detectChatIntent', () => {
    it('detects English queries', () => {
        expect(detectChatIntent('How much did I spend last month?')).toBe('QUERY');
        expect(detectChatIntent('Show me my food transactions')).toBe('QUERY');
        expect(detectChatIntent('What is my largest expense?')).toBe('QUERY');
        expect(detectChatIntent('Are there any duplicate transactions?')).toBe('QUERY');
        expect(detectChatIntent('What percentage of spending is food?')).toBe('QUERY');
    });

    it('detects Portuguese queries', () => {
        expect(detectChatIntent('Quanto gastei este mês?')).toBe('QUERY');
        expect(detectChatIntent('Mostra as minhas despesas de comida')).toBe('QUERY');
        expect(detectChatIntent('Qual foi o meu maior gasto?')).toBe('QUERY');
        expect(detectChatIntent('Existem transações duplicadas?')).toBe('QUERY');
        expect(detectChatIntent('Mostra despesas com valor redondo')).toBe('QUERY');
        expect(detectChatIntent('Qual a categoria mais frequente?')).toBe('QUERY');
    });

    it('returns UNKNOWN for unrecognised input', () => {
        expect(detectChatIntent('Hello there!')).toBe('UNKNOWN');
        expect(detectChatIntent('Add coffee 3€')).toBe('UNKNOWN');
        expect(detectChatIntent('')).toBe('UNKNOWN');
    });
});

// ── TOTAL queries ─────────────────────────────────────────────────────────────

describe('askFinancialQuestion — TOTAL', () => {
    it('returns total for a specific month/year', async () => {
        const res = await ask('how much did I spend in June 2026?');
        // June expenses: 120 + 45 + 15 + 30 = 210
        expect(res).toContain('210.00');
    });

    it('returns total for a specific category and year', async () => {
        const res = await ask('total food spending in 2026');
        // Food in 2026: Supermercado(120) + Restaurante(45) = 165
        expect(res).toContain('165.00');
    });

    it('returns total for all categories in a year', async () => {
        const res = await ask('how much did I spend in 2026?');
        // 2026: 120+45+15+22+30+60 = 292
        expect(res).toContain('292.00');
    });

    it('returns no-expenses message when nothing found', async () => {
        const res = await ask('how much did I spend in 2020?');
        expect(res).toMatch(/não encontrei|no.*found/i);
    });
});

// ── MAX queries ───────────────────────────────────────────────────────────────

describe('askFinancialQuestion — MAX', () => {
    it('finds the largest expense across all categories and shows its category', async () => {
        const res = await ask('what was my largest expense?');
        expect(res).toContain('700.00');
        expect(res.toLowerCase()).toContain('housing');
    });

    it('finds the largest expense within a category', async () => {
        const res = await ask('largest food expense');
        expect(res).toContain('120.00');
    });
});

// ── AVERAGE queries ───────────────────────────────────────────────────────────

describe('askFinancialQuestion — AVERAGE', () => {
    it('calculates average for a category', async () => {
        const res = await ask('average food spending');
        // Food: 120 + 45 + 50 + 50 = 265, count = 4, avg = 66.25
        expect(res).toContain('66.25');
    });
});

// ── COUNT queries ─────────────────────────────────────────────────────────────

describe('askFinancialQuestion — COUNT', () => {
    it('counts all transactions', async () => {
        const res = await ask('how many transactions do I have?');
        expect(res).toContain('11');
    });

    it('counts transactions in a category', async () => {
        const res = await ask('how many food transactions?');
        expect(res).toContain('4'); // 4 Food records
    });
});

// ── LIST queries ──────────────────────────────────────────────────────────────

describe('askFinancialQuestion — LIST', () => {
    it('lists transactions for a category', async () => {
        const res = await ask('show my entertainment expenses');
        expect(res).toContain('Netflix');
    });

    it('limits list output to 5 items', async () => {
        const res = await ask('show all transactions');
        const bulletCount = (res.match(/•/g) ?? []).length;
        expect(bulletCount).toBeLessThanOrEqual(5);
    });
});

// ── MOST_FREQUENT queries ─────────────────────────────────────────────────────

describe('askFinancialQuestion — MOST_FREQUENT', () => {
    it('identifies the most used category', async () => {
        const res = await ask('what is my most used category?');
        // Food appears 4 times — most frequent
        expect(res.toLowerCase()).toContain('food');
        expect(res).toContain('4');
    });
});

// ── DISTINCT_CATEGORIES queries ───────────────────────────────────────────────

describe('askFinancialQuestion — DISTINCT_CATEGORIES', () => {
    it('counts distinct categories', async () => {
        const res = await ask('how many distinct categories did I use?');
        // Food, Entertainment, Transportation, Housing, Health, Clothes, Utilities = 7
        expect(res).toContain('7');
    });
});

// ── PERCENTAGE queries ────────────────────────────────────────────────────────

describe('askFinancialQuestion — PERCENTAGE', () => {
    it('calculates percentage for a category', async () => {
        const res = await ask('what percentage of spending is housing?');
        // Housing = 700 out of all-time total 1182 ≈ 59%
        expect(res).toMatch(/5[0-9]%/);
        expect(res).toContain('700.00');
    });

    it('asks to specify category when none given', async () => {
        const res = await ask('what percentage of my spending?');
        expect(res).toMatch(/especifica|specify/i);
    });
});

// ── DUPLICATE queries ─────────────────────────────────────────────────────────

describe('askFinancialQuestion — DUPLICATES', () => {
    it('finds duplicate transactions', async () => {
        const res = await ask('are there duplicate transactions?');
        // McDonald's 50€ on 2026-05-20 appears twice
        expect(res).toContain('50.00');
        expect(res).toMatch(/duplicad|duplicat/i);
    });

    it('returns no duplicates when data is clean', async () => {
        const clean = EXPENSES.filter(e => e.id !== 'a'); // remove duplicate
        const res = await askFinancialQuestion('are there duplicate transactions?', clean, [], []);
        expect(res).toMatch(/não encontrei|no.*duplicat/i);
    });
});

// ── ROUND_AMOUNTS queries ─────────────────────────────────────────────────────

describe('askFinancialQuestion — ROUND_AMOUNTS', () => {
    it('finds round-amount transactions', async () => {
        const res = await ask('show me round amount transactions');
        // 120, 700, 50, 50, 60, 80, 30, 15, 22 — most are round
        expect(res).toMatch(/transaç/i);
    });
});

// ── BUDGET queries ────────────────────────────────────────────────────────────

describe('askFinancialQuestion — BUDGET', () => {
    it('shows budget status sorted by most exceeded', async () => {
        const res = await askBudget('what is my budget status?');
        // Entertainment: 15/30 = 50%; Food June: 165/200 = 82.5% — Food is more exceeded
        expect(res).toContain('Food');
        expect(res).toContain('Entertainment');
        // Food should appear before Entertainment (sorted by %)
        expect(res.indexOf('Food')).toBeLessThan(res.indexOf('Entertainment'));
    });

    it('fuzzy-matches budget category by name', async () => {
        const res = await askBudget('how is my food budget?');
        expect(res).toContain('Food');
        expect(res).not.toContain('Entertainment');
    });

    it('returns message when no budgets configured', async () => {
        const res = await ask('what is my budget status?');
        expect(res).toMatch(/não tens orçamentos|no budgets/i);
    });
});

// ── Amount filter edge cases ──────────────────────────────────────────────────

describe('askFinancialQuestion — amount filters', () => {
    it('filters by minimum amount', async () => {
        const res = await ask('show food transactions over 100');
        expect(res).toContain('Supermercado'); // 120 > 100
        expect(res).not.toContain('Restaurante'); // 45 ≤ 100
    });

    it('filters by maximum amount', async () => {
        const res = await ask('show food transactions below 50');
        expect(res).toContain('Restaurante'); // 45 < 50
        expect(res).not.toContain('Supermercado'); // 120 ≥ 50
    });

    it('does not false-positive on "over N months"', async () => {
        // "over 2 months" should NOT set filterMin = 2
        const res = await ask('how much did I spend over the last 2 months?');
        // Should return all expenses from last 2 months — not just those over €2
        expect(res).not.toMatch(/não encontrei/i);
    });
});

// ── Quarter parsing ───────────────────────────────────────────────────────────

describe('askFinancialQuestion — quarter parsing', () => {
    it('parses Q1 correctly', async () => {
        const res = await ask('total spending in Q1 2026');
        // No expenses in Jan-Mar 2026 in our fixture
        expect(res).toMatch(/não encontrei|Q1/i);
    });

    it('parses Q2 correctly', async () => {
        const res = await ask('total spending in Q2 2026');
        // Q2 2026 (Apr-Jun): Uber(22)+Electr(60)+Supermercado(120)+Restaurante(45)+Netflix(15)+Farmácia(30) = 292
        expect(res).toContain('292.00');
    });
});
