import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type { NewExpense } from '../types';

let engine: any = null;
let initPromise: Promise<void> | null = null;

const initProgressCallback = (p: any) =>
    console.log(`Carregando IA: ${Math.round(p.progress * 100)}%`);

export async function initLLM() {
    if (engine) return;
    if (initPromise) { await initPromise; return; }

    // Qwen2.5-1.5B (~950MB) — bom em PT/EN, fiável e leve
    const selectedModel = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

    initPromise = (async () => {
        try {
            engine = await CreateWebWorkerMLCEngine(
                new Worker(new URL('./webllm-worker.ts', import.meta.url), { type: 'module' }),
                selectedModel,
                { initProgressCallback }
            );
            console.log("Modelo carregado.");
        } catch (e) {
            console.error(e);
            initPromise = null;
        }
    })();
    await initPromise;
}

// normalização de texto

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')  // remove acentos: é→e, ã→a, ç→c
        .replace(/[^a-z0-9\s]/g, ' ');
}

// distância de Levenshtein

function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
}

// extração por regex

function extractAmount(text: string): number | null {
    const m = text.match(/(?:€|\$|£|eur(?:os?)?)\s*(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s*(?:€|\$|£|eur(?:os?)?)/i);
    if (!m) return null;
    return parseFloat((m[1] ?? m[2]).replace(',', '.'));
}

function extractDate(text: string): string {
    const today = new Date();
    const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const lower = normalizeText(text);

    if (lower.includes('hoje') || lower.includes('today')) return fmt(today);

    if (lower.includes('ontem') || lower.includes('yesterday')) {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        return fmt(d);
    }

    const dayMap: Record<string, number> = {
        sunday: 0, domingo: 0,
        monday: 1, segunda: 1,
        tuesday: 2, terca: 2,
        wednesday: 3, quarta: 3,
        thursday: 4, quinta: 4,
        friday: 5, sexta: 5,
        saturday: 6, sabado: 6,
    };
    for (const [name, dow] of Object.entries(dayMap)) {
        if (lower.includes(name)) {
            const d = new Date(today);
            const diff = (today.getDay() - dow + 7) % 7 || 7;
            d.setDate(today.getDate() - diff);
            return fmt(d);
        }
    }

    const explicit = text.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (explicit) {
        if (explicit[1]) return explicit[1];
        return `${explicit[4]}-${explicit[3]!.padStart(2, '0')}-${explicit[2]!.padStart(2, '0')}`;
    }

    return fmt(today);
}

// tabelas de palavras-chave (PT + EN, prefixos para tolerância a erros de digitação)

const CATEGORY_KEYWORDS: [string, string[]][] = [
    ['Food', [
        'comi', 'almo', 'jant', 'restaur', 'cafe', 'cafet', 'pastel', 'padari',
        'super', 'mercear', 'minimercado', 'minipreco', 'continente', 'pingo', 'lidl', 'aldi',
        'pizza', 'hambur', 'sushi', 'snack', 'lanche', 'petisco', 'refeic',
        'grocery', 'food', 'lunch', 'dinner', 'breakfast', 'meal', 'drink', 'coffee', 'bakery',
    ]],
    ['Transportation', [
        'uber', 'bolt', 'taxi', 'taxe', 'cabify',
        'metro', 'autocarro', 'comboio', 'cp ', 'renfe',
        'gasolina', 'combustiv', 'diesel', 'portagem', 'estacion', 'parking',
        'flight', 'voo', 'aviao', 'ryanair', 'tap', 'easyjet',
        'bicicleta', 'trotinete', 'gira',
        'transport', 'fuel', 'bus', 'train', 'car',
    ]],
    ['Entertainment', [
        'cinema', 'netflix', 'spotify', 'hbo', 'disney', 'apple tv', 'prime video',
        'twitch', 'youtube', 'steam', 'playstation', 'xbox', 'nintendo',
        'concerto', 'teatro', 'espetaculo', 'museu', 'parque',
        'jogo', 'game', 'concert', 'show', 'entret', 'filme', 'movie', 'music'
    ]],
    ['Utilities', [
        'eletric', 'energia', 'edp', 'endesa',
        'agua', 'epal', 'aguas',
        'internet', 'fibra', 'wifi', 'nos ', 'meo ', 'vodafone', 'nowo',
        'telef', 'telemo', 'phone', 'mobile',
        'gas', 'galp', 'goldenergy',
        'seguro', 'luz', 'utility', 'electric', 'water',
    ]],
    ['Health', [
        'farmaci', 'medic', 'clinica', 'hospital', 'urgencia',
        'consulta', 'dentist', 'oculist', 'oftalmo', 'ortoped',
        'fisio', 'psicolog', 'nutri', 'analise', 'exame',
        'ginasi', 'gym', 'health', 'saude',
    ]],
    ['Housing', [
        'renda', 'aluguel', 'condomi', 'hipoteca', 'mortgage',
        'obras', 'reparac', 'canalizador', 'eletricista',
        'ikea', 'leroy', 'mobilia', 'movel',
        'rent', 'housing', 'condomin', 'imobili',
    ]],
    ['Clothes', [
        'roupa', 'vestuario', 'calcado', 'sapato', 'tenis', 'bota',
        'zara', 'hm', 'primark', 'mango', 'pull', 'bershka', 'stradivari',
        'nike', 'adidas', 'puma', 'new balance',
        'cloth', 'shirt', 'trouser', 'jacket', 'dress', 'jeans', 'fashion',
    ]],
];

const TYPE_KEYWORDS: [string, string[]][] = [
    ['Monthly',      ['mensal', 'monthly', 'subscri', 'subscription', 'recorrent', 'recurring', 'mes']],
    ['Yearly',       ['anual', 'annual', 'yearly', 'ano']],
    ['Trimesterly',  ['trimestral', 'quarterly', 'trimest']],
    ['Semi-Annual',  ['semestral', 'semi-annual', 'semestr']],
];

// classifica por substring exacto; fallback fuzzy com Levenshtein

function classifyByKeywords(
    text: string,
    rules: [string, string[]][],
    fallback: string
): string {
    const norm = normalizeText(text);
    const words = norm.split(/\s+/).filter(w => w.length > 2);

    for (const [label, keywords] of rules)
        if (keywords.some(kw => norm.includes(kw.trim()))) return label;

    let bestLabel = fallback;
    let bestScore = Infinity;

    for (const [label, keywords] of rules) {
        for (const kw of keywords) {
            const kwTrimmed = kw.trim();
            if (kwTrimmed.length < 4) continue;
            const threshold = Math.max(1, Math.floor(kwTrimmed.length * 0.3));
            for (const word of words) {
                if (Math.abs(word.length - kwTrimmed.length) > threshold + 1) continue;
                const dist = levenshtein(word, kwTrimmed);
                if (dist <= threshold && dist < bestScore) { bestScore = dist; bestLabel = label; }
            }
        }
    }
    return bestLabel;
}

function normalizeToList(value: string, validList: string[]): string {
    if (!value) return validList[0];
    if (validList.includes(value)) return value;
    const ci = validList.find(v => v.toLowerCase() === value.toLowerCase());
    if (ci) return ci;
    let best = validList[0], bestDist = Infinity;
    for (const v of validList) {
        const dist = levenshtein(value.toLowerCase(), v.toLowerCase());
        if (dist < bestDist) { bestDist = dist; best = v; }
    }
    return best;
}

// pede ao LLM só a descrição; não bloqueia se o modelo ainda não estiver carregado

async function getLLMDescription(userInput: string): Promise<string> {
    if (!engine) return '';
    try {
        const reply = await engine.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content:
                        'You receive expense descriptions in any language (often Portuguese). ' +
                        'Reply with a 1-4 word English summary of what was purchased or paid. ' +
                        'Reply with only those words, no punctuation, nothing else.',
                },
                { role: 'user', content: userInput },
            ],
            temperature: 0.1,
            max_tokens: 20,
        });
        const raw = (reply.choices[0].message.content ?? '').trim();
        return raw.replace(/^["'.]+|["'.]+$/g, '');
    } catch {
        return '';
    }
}

function fallbackDescription(userInput: string): string {
    return userInput
        .replace(/\d+[.,]?\d*\s*[€$£]/g, '')
        .replace(/[€$£]\s*\d+[.,]?\d*/g, '')
        .replace(/\b(hoje|ontem|today|yesterday|segunda|terca|quarta|quinta|sexta|sabado|domingo)\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 40);
}

export async function extractExpenseFromText(
    userInput: string,
    categories: string[],
    types: string[]
): Promise<NewExpense> {
    const amount   = extractAmount(userInput);
    const date     = extractDate(userInput);
    const category = normalizeToList(classifyByKeywords(userInput, CATEGORY_KEYWORDS, 'Other'), categories);
    const type     = normalizeToList(classifyByKeywords(userInput, TYPE_KEYWORDS, 'One-time'), types);
    const llmDesc  = await getLLMDescription(userInput);
    const description = llmDesc || fallbackDescription(userInput);

    return { description, amount: amount ?? 0, date, category, type };
}
