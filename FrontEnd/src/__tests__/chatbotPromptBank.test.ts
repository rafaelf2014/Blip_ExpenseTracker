import { describe, it, expect, vi } from 'vitest';
import { detectChatIntent, askFinancialQuestion } from '../services/llmService';
import type { Expense, RegularTransaction, Budget } from '../types';

vi.mock('@mlc-ai/web-llm', () => ({ CreateWebWorkerMLCEngine: vi.fn() }));

function exp(id: string, description: string, amount: number, category: string, date: string): Expense {
    return { id, description, amount, category, date, type: 'One-time', userId: 'u1' };
}

// A richer fixture than the base suite — multiple categories, months, duplicates.
const EXPENSES: Expense[] = [
    exp('1', 'Supermercado',  120, 'Food',           '2026-06-01'),
    exp('2', 'Restaurante',    45, 'Food',           '2026-06-02'),
    exp('3', 'Netflix',        15, 'Entertainment',  '2026-06-01'),
    exp('4', 'Uber',           22, 'Transportation', '2026-05-20'),
    exp('5', 'Renda',         700, 'Housing',        '2026-06-05'),
    exp('6', 'Farmacia',       30, 'Health',         '2026-06-02'),
    exp('7', 'Eletricidade',   60, 'Utilities',      '2026-05-15'),
    exp('8', 'McDonalds',      50, 'Food',           '2026-05-10'),
    exp('9', 'McDonalds',      50, 'Food',           '2026-05-10'),  // duplicate pair
];

const REGULAR: RegularTransaction[] = [
    { id: 'r1', description: 'Salary', amount: 2000, isIncome: true, category: 'Other', frequency: 'monthly', date: '2026-01-05' },
];
const BUDGETS: Budget[] = [
    { id: 'b1', category: 'Food',          limit: 300, period: 'monthly' },
    { id: 'b2', category: 'Entertainment', limit: 20,  period: 'monthly' },
];

const askEN = (q: string) => askFinancialQuestion(q, EXPENSES, REGULAR, BUDGETS, 'en');
const askPT = (q: string) => askFinancialQuestion(q, EXPENSES, REGULAR, BUDGETS, 'pt');

// INTENT DETECTION
describe('detectChatIntent — broad phrasings', () => {
    const queries = [
        'How much did I spend last month?', 'show my food expenses', 'what is my biggest expense',
        'average daily spend', 'how is my budget', 'what did I earn', 'how many transactions',
        'quanto gastei este mês', 'mostra as minhas despesas', 'qual o maior gasto',
        'média diária', 'estado do orçamento', 'quanto recebi', 'quantas transações',
    ];
    for (const q of queries) {
        it(`QUERY: "${q}"`, () => expect(detectChatIntent(q)).toBe('QUERY'));
    }
    const nonQueries = ['hello there', 'add coffee 3€', 'thanks!', ''];
    for (const q of nonQueries) {
        it(`UNKNOWN: "${q}"`, () => expect(detectChatIntent(q)).toBe('UNKNOWN'));
    }
});

// TOTAL
describe('TOTAL queries', () => {
    it('total food in June 2026 (120+45 = 165)', async () => {
        expect(await askEN('how much did I spend on food in June 2026?')).toContain('165');
    });
    it('total all categories June 2026 (120+45+15+700+30 = 910)', async () => {
        expect(await askEN('how much did I spend in June 2026?')).toContain('910');
    });
    it('PT phrasing works too', async () => {
        expect(await askPT('quanto gastei em comida em junho de 2026?')).toContain('165');
    });
    it('no-data window returns a "not found" message', async () => {
        expect(await askEN('how much did I spend in 2020?')).toMatch(/no expenses|found no/i);
        expect(await askPT('quanto gastei em 2020?')).toMatch(/não encontrei/i);
    });
});

// MAX / COUNT / AVERAGE / LIST
describe('MAX', () => {
    it('largest overall is the 700 rent', async () => {
        const r = await askEN('what was my largest expense in June 2026?');
        expect(r).toContain('700.00');
        expect(r.toLowerCase()).toContain('housing');
    });
    it('largest within food is 120', async () => {
        expect(await askEN('largest food expense in June 2026')).toContain('120.00');
    });
});

describe('COUNT', () => {
    it('counts all June 2026 transactions (5)', async () => {
        expect(await askEN('how many transactions in June 2026?')).toContain('5');
    });
    it('counts food in May 2026 (2 McDonalds)', async () => {
        expect(await askEN('how many food transactions in May 2026?')).toContain('2');
    });
});

describe('AVERAGE', () => {
    it('average per food transaction June 2026 = (120+45)/2 = 82.50', async () => {
        expect(await askEN('average food spending in June 2026')).toContain('82.50');
    });
});

describe('LIST', () => {
    it('lists food and caps at 5 bullets', async () => {
        const r = await askEN('show my food expenses in June 2026');
        expect(r).toContain('Supermercado');
        expect((r.match(/•/g) ?? []).length).toBeLessThanOrEqual(5);
    });
});

// MOST_FREQUENT / DISTINCT / PERCENTAGE
describe('MOST_FREQUENT', () => {
    it('food is the most-used category in 2026', async () => {
        const r = await askEN('what is my most used category in 2026?');
        expect(r.toLowerCase()).toContain('food');
    });
});

describe('DISTINCT_CATEGORIES', () => {
    it('counts distinct categories in June 2026 (Food, Entertainment, Housing, Health = 4)', async () => {
        expect(await askEN('how many distinct categories in June 2026?')).toContain('4');
    });
});

describe('PERCENTAGE', () => {
    it('housing share of June 2026 (700/910 ≈ 76%)', async () => {
        const r = await askEN('what percentage of spending was housing in June 2026?');
        expect(r).toMatch(/7[0-9]%/);
    });
    it('asks to specify a category when none given', async () => {
        expect(await askEN('what percentage of my spending in June 2026?')).toMatch(/specify/i);
    });
});

// DUPLICATES
describe('DUPLICATES', () => {
    it('finds the McDonalds duplicate pair in May 2026', async () => {
        const r = await askEN('any duplicate transactions in May 2026?');
        expect(r).toContain('50.00');
        expect(r).toMatch(/duplicate/i);
    });
});

// INCOME / BUDGET (use REGULAR + BUDGETS)
describe('INCOME', () => {
    it('reports estimated income from the salary template', async () => {
        const r = await askEN('how much did I earn in June 2026?');
        expect(r).toContain('2000');
    });
    it('PT income phrasing', async () => {
        expect(await askPT('quanto recebi em junho de 2026?')).toContain('2000');
    });
});

describe('BUDGET', () => {
    it('shows budget status with Food and Entertainment', async () => {
        const r = await askEN('what is my budget status?');
        expect(r).toContain('Food');
        expect(r).toContain('Entertainment');
    });
});

// OUTPUT FORMAT / ROBUSTNESS
describe('output formatting & robustness', () => {
    it('multi-line answers separate the header from the list with a blank line', async () => {
        const r = await askEN('list my food expenses in June 2026');
        expect(r).toContain('\n\n'); // header paragraph then bullets
    });
    it('amounts are formatted to 2 decimals', async () => {
        expect(await askEN('how much on food in June 2026?')).toMatch(/\d+\.\d{2}/);
    });
    it('never throws on empty data', async () => {
        const r = await askFinancialQuestion('how much did I spend this month?', [], [], [], 'en');
        expect(typeof r).toBe('string');
        expect(r.length).toBeGreaterThan(0);
    });
    it('PT and EN produce different language output for the same query', async () => {
        const en = await askEN('how much on food in June 2026?');
        const pt = await askPT('quanto em comida em junho de 2026?');
        expect(en).not.toBe(pt); // different phrasing/words
    });
});
