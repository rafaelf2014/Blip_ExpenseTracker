import { describe, it, expect, vi, beforeAll } from 'vitest';
import { extractExpenseFromText } from '../services/llmService';

vi.mock('@mlc-ai/web-llm', () => ({ CreateWebWorkerMLCEngine: vi.fn() }));

// localStorage doesn't exist in Node — stub it so the "unknown terms" path doesn't crash
beforeAll(() => {
    vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => '[]'),
        setItem: vi.fn(),
    });
});

const CATEGORIES = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Health', 'Housing', 'Clothes', 'Other'];
const TYPES      = ['One-time', 'Monthly', 'Yearly'];

// ── Amount parsing ────────────────────────────────────────────────────────────

describe('extractExpenseFromText — amount', () => {
    it('parses € prefix', async () => {
        const r = await extractExpenseFromText('coffee €3.50 food', CATEGORIES, TYPES);
        expect(r.amount).toBe(3.5);
    });

    it('parses € suffix', async () => {
        const r = await extractExpenseFromText('lunch 12€ food', CATEGORIES, TYPES);
        expect(r.amount).toBe(12);
    });

    it('parses comma as decimal separator', async () => {
        const r = await extractExpenseFromText('uber 8,50€ transport', CATEGORIES, TYPES);
        expect(r.amount).toBe(8.5);
    });

    it('parses $ symbol', async () => {
        const r = await extractExpenseFromText('groceries $25 food', CATEGORIES, TYPES);
        expect(r.amount).toBe(25);
    });

    it('returns 0 when no amount found', async () => {
        const r = await extractExpenseFromText('just some food text no number', CATEGORIES, TYPES);
        expect(r.amount).toBe(0);
    });
});

// ── Category classification ───────────────────────────────────────────────────

describe('extractExpenseFromText — category', () => {
    it('classifies food — English keyword', async () => {
        const r = await extractExpenseFromText('lunch at restaurant €15', CATEGORIES, TYPES);
        expect(r.category).toBe('Food');
    });

    it('classifies food — Portuguese keyword', async () => {
        const r = await extractExpenseFromText('almoço €10', CATEGORIES, TYPES);
        expect(r.category).toBe('Food');
    });

    it('classifies food — delivery app', async () => {
        const r = await extractExpenseFromText('ubereats €18', CATEGORIES, TYPES);
        expect(r.category).toBe('Food');
    });

    it('classifies transportation — ride-hailing', async () => {
        const r = await extractExpenseFromText('uber ride €12', CATEGORIES, TYPES);
        expect(r.category).toBe('Transportation');
    });

    it('classifies transportation — fuel', async () => {
        const r = await extractExpenseFromText('gasolina €55', CATEGORIES, TYPES);
        expect(r.category).toBe('Transportation');
    });

    it('classifies entertainment — streaming', async () => {
        const r = await extractExpenseFromText('netflix €10', CATEGORIES, TYPES);
        expect(r.category).toBe('Entertainment');
    });

    it('classifies entertainment — gaming', async () => {
        const r = await extractExpenseFromText('xbox game €30', CATEGORIES, TYPES);
        expect(r.category).toBe('Entertainment');
    });

    it('classifies health — pharmacy', async () => {
        const r = await extractExpenseFromText('farmacia €8', CATEGORIES, TYPES);
        expect(r.category).toBe('Health');
    });

    it('classifies health — gym', async () => {
        const r = await extractExpenseFromText('gym membership €40', CATEGORIES, TYPES);
        expect(r.category).toBe('Health');
    });

    it('classifies housing — rent', async () => {
        const r = await extractExpenseFromText('renda apartamento €700', CATEGORIES, TYPES);
        expect(r.category).toBe('Housing');
    });

    it('classifies clothes — brand name', async () => {
        const r = await extractExpenseFromText('zara jacket €45', CATEGORIES, TYPES);
        expect(r.category).toBe('Clothes');
    });

    it('classifies utilities — internet', async () => {
        const r = await extractExpenseFromText('internet nos €30', CATEGORIES, TYPES);
        expect(r.category).toBe('Utilities');
    });

    it('classifies utilities — electricity', async () => {
        const r = await extractExpenseFromText('eletricidade edp €60', CATEGORIES, TYPES);
        expect(r.category).toBe('Utilities');
    });

    it('falls back to Other when no keyword matches', async () => {
        const r = await extractExpenseFromText('xyz unknown thing €5', CATEGORIES, TYPES);
        expect(r.category).toBe('Other');
    });
});

// ── Date parsing ──────────────────────────────────────────────────────────────

describe('extractExpenseFromText — date', () => {
    it('parses YYYY-MM-DD', async () => {
        const r = await extractExpenseFromText('coffee €3 2026-03-15 food', CATEGORIES, TYPES);
        expect(r.date).toBe('2026-03-15');
    });

    it('parses DD/MM/YYYY', async () => {
        const r = await extractExpenseFromText('coffee €3 15/03/2026 food', CATEGORIES, TYPES);
        expect(r.date).toBe('2026-03-15');
    });

    it('defaults to today when no date given', async () => {
        const d = new Date();
        const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const r = await extractExpenseFromText('coffee €3 food', CATEGORIES, TYPES);
        expect(r.date).toBe(expected);
    });

    it('parses "hoje" as today', async () => {
        const d = new Date();
        const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const r = await extractExpenseFromText('coffee €3 food hoje', CATEGORIES, TYPES);
        expect(r.date).toBe(expected);
    });

    it('parses "today" as today', async () => {
        const d = new Date();
        const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const r = await extractExpenseFromText('lunch €10 food today', CATEGORIES, TYPES);
        expect(r.date).toBe(expected);
    });

    it('parses "yesterday" as yesterday', async () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const r = await extractExpenseFromText('lunch €10 food yesterday', CATEGORIES, TYPES);
        expect(r.date).toBe(expected);
    });
});

// ── Type classification ───────────────────────────────────────────────────────

describe('extractExpenseFromText — type', () => {
    it('classifies monthly subscription', async () => {
        const r = await extractExpenseFromText('netflix monthly €10 entertainment', CATEGORIES, TYPES);
        expect(r.type).toBe('Monthly');
    });

    it('classifies yearly', async () => {
        const r = await extractExpenseFromText('insurance yearly €200 utilities', CATEGORIES, TYPES);
        expect(r.type).toBe('Yearly');
    });

    it('classifies recurring keyword', async () => {
        const r = await extractExpenseFromText('gym subscription €40 health', CATEGORIES, TYPES);
        expect(r.type).toBe('Monthly');
    });

    it('defaults to One-time', async () => {
        const r = await extractExpenseFromText('coffee €3 food', CATEGORIES, TYPES);
        expect(r.type).toBe('One-time');
    });
});
