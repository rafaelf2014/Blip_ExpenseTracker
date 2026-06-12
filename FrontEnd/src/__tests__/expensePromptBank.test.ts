import { describe, it, expect, vi, beforeAll } from 'vitest';
import { extractExpenseFromText } from '../services/llmService';

// Engine is mocked -> the LLM description path returns null and the deterministic
// regex/keyword pipeline (amount, date, type, category) is what we assert here.
vi.mock('@mlc-ai/web-llm', () => ({ CreateWebWorkerMLCEngine: vi.fn() }));

beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => '[]'), setItem: vi.fn() });
});

const CATEGORIES = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Health', 'Housing', 'Clothes', 'Other'];
const TYPES = ['One-time', 'Monthly', 'Yearly'];

const parse = (text: string) => extractExpenseFromText(text, CATEGORIES, TYPES);

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function yesterdayStr() {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// AMOUNTS
describe('amount parsing — prompt bank', () => {
    const cases: [string, number][] = [
        ['coffee €3 food', 3],
        ['coffee €3.50 food', 3.5],
        ['lunch 12€ food', 12],
        ['uber 8,50€ transport', 8.5],          // comma decimal
        ['groceries $25 food', 25],
        ['book £9.99 entertainment', 9.99],
        ['eur 40 electricity', 40],             // "eur" word
        ['paguei 1000 euros de renda', 1000],   // "euros" word
        ['netflix €7.99 monthly', 7.99],
        ['big purchase €1234.56 furniture', 1234.56],
        ['just some food text no number', 0],   // no amount -> 0
        ['€0 food', 0],
    ];
    for (const [text, expected] of cases) {
        it(`"${text}" -> ${expected}`, async () => {
            expect((await parse(text)).amount).toBe(expected);
        });
    }

    it('a bare number with NO currency symbol is not parsed (documents the requirement)', async () => {
        // The amount regex requires €/$/£/eur — "netflix 7.99" alone yields 0.
        expect((await parse('netflix 7.99 monthly')).amount).toBe(0);
    });
});

// DATES
describe('date parsing — prompt bank', () => {
    it('explicit ISO date', async () => {
        expect((await parse('coffee €3 2026-03-15 food')).date).toBe('2026-03-15');
    });
    it('explicit DD/MM/YYYY', async () => {
        expect((await parse('coffee €3 15/03/2026 food')).date).toBe('2026-03-15');
    });
    it('explicit DD-MM-YYYY', async () => {
        expect((await parse('coffee €3 15-03-2026 food')).date).toBe('2026-03-15');
    });
    it('"hoje" -> today', async () => {
        expect((await parse('cafe €3 hoje')).date).toBe(todayStr());
    });
    it('"today" -> today', async () => {
        expect((await parse('lunch €10 today')).date).toBe(todayStr());
    });
    it('"ontem" -> yesterday', async () => {
        expect((await parse('almoço €10 ontem')).date).toBe(yesterdayStr());
    });
    it('"yesterday" -> yesterday', async () => {
        expect((await parse('lunch €10 yesterday')).date).toBe(yesterdayStr());
    });
    it('no date -> defaults to today', async () => {
        expect((await parse('coffee €3 food')).date).toBe(todayStr());
    });
});

// TYPE
describe('type classification — prompt bank', () => {
    const cases: [string, string][] = [
        ['netflix monthly €10 entertainment', 'Monthly'],
        ['spotify subscription €7 music', 'Monthly'],
        ['gym mensal €40 health', 'Monthly'],
        ['insurance yearly €200 utilities', 'Yearly'],
        ['seguro anual €300 health', 'Yearly'],
        ['coffee €3 food', 'One-time'],
        ['supermarket €50 food', 'One-time'],
    ];
    for (const [text, expected] of cases) {
        it(`"${text}" -> ${expected}`, async () => {
            expect((await parse(text)).type).toBe(expected);
        });
    }
});

// CATEGORY (keyword path, PT + EN + brands)
describe('category classification — prompt bank', () => {
    const cases: [string, string][] = [
        // Food
        ['almoço no restaurante €15', 'Food'],
        ['continente €60', 'Food'],
        ['mcdonalds €8', 'Food'],
        ['starbucks coffee €5', 'Food'],
        ['ubereats €18', 'Food'],
        ['pizza hut €20', 'Food'],
        ['groceries at lidl €45', 'Food'],
        // Transportation
        ['uber ride €12', 'Transportation'],
        ['gasolina €55', 'Transportation'],
        ['comboio para o porto €18', 'Transportation'],
        ['ryanair flight €90', 'Transportation'],
        ['parking €4', 'Transportation'],
        // Entertainment
        ['netflix €10', 'Entertainment'],
        ['spotify €7', 'Entertainment'],
        ['xbox game pass €13', 'Entertainment'],
        ['video games €40', 'Entertainment'],   // generic 'games' keyword
        ['cinema bilhete €9', 'Entertainment'],
        ['ginásio crossfit €40', 'Health'],     // gym/fitness is Health, not Entertainment
        ['fitness class €25', 'Health'],
        ['yoga studio €30', 'Health'],
        // Utilities
        ['eletricidade edp €60', 'Utilities'],
        ['internet nos €30', 'Utilities'],
        ['vodafone telemovel €15', 'Utilities'],
        ['galp gas €25', 'Utilities'],
        // Health
        ['farmacia €8', 'Health'],
        ['consulta dentista €50', 'Health'],
        ['whey protein €30', 'Health'],
        // Housing
        ['renda apartamento €700', 'Housing'],
        ['ikea mobilia €120', 'Housing'],
        ['leroy merlin obras €80', 'Housing'],
        // Clothes
        ['zara jacket €45', 'Clothes'],
        ['nike sneakers €90', 'Clothes'],
        ['decathlon €35', 'Clothes'],
        ['h&m shirt €20', 'Clothes'],
    ];
    for (const [text, expected] of cases) {
        it(`"${text}" -> ${expected}`, async () => {
            expect((await parse(text)).category).toBe(expected);
        });
    }

    it('accent-insensitive (farmácia)', async () => {
        expect((await parse('farmácia €8')).category).toBe('Health');
    });

    it('typo tolerance (restaurnte)', async () => {
        expect((await parse('jantar no restaurnte €25')).category).toBe('Food');
    });

    it('unknown term with mocked LLM falls back to Other', async () => {
        expect((await parse('xyz quux thing €5')).category).toBe('Other');
    });
});

// FULL STRUCTURED OUTPUT (the "is it displayed correctly" check)
describe('full extraction shape', () => {
    it('produces a complete NewExpense ready to save', async () => {
        const r = await parse('jantar no restaurante italiano €35 ontem');
        expect(r).toMatchObject({
            amount: 35,
            date: yesterdayStr(),
            category: 'Food',
            type: 'One-time',
        });
        expect(typeof r.description).toBe('string');
        expect(r.description.length).toBeGreaterThan(0);
    });

    it('never returns NaN amount or empty category', async () => {
        for (const text of ['', 'random', '€', 'food food food', '99999']) {
            const r = await parse(text);
            expect(Number.isNaN(r.amount)).toBe(false);
            expect(r.category).toBeTruthy();
            expect(TYPES).toContain(r.type);
        }
    });
});
