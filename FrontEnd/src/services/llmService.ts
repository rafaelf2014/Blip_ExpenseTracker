import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type { NewExpense } from '../types';
import { CATEGORY_KEYWORDS, QUERY_CATEGORY_KEYWORDS, TYPE_KEYWORDS } from '../constants/keywords';

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

// function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
//     return Promise.race([
//         promise,
//         new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
//     ]);
// }

// keyword matched — only ask LLM for description

async function getLLMDescription(userInput: string): Promise<string | null> {
    if (!engine) return null;
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
        return raw.replace(/^["'.]+|["'.]+$/g, '') || null;
    } catch {
        return null;
    }
}

// no keyword match — ask LLM for both category and description in one call

async function getLLMCategoryAndDescription(
    userInput: string
): Promise<{ category: string; description: string } | null> {
    if (!engine) return null;
    try {
        const reply = await engine.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content:
                        'You categorize expenses written in any language (often Portuguese or English). ' +
                        'Reply with JSON only: {"description":"1-4 word English summary","category":"exact category name"}.\n' +
                        'Categories and what they cover:\n' +
                        '- Food: restaurants, groceries, delivery apps, fast food, drinks, coffee, supermarkets\n' +
                        '- Transportation: taxi, ride-hailing, fuel, flights, public transport, parking, car repairs\n' +
                        '- Entertainment: sports activities, streaming services, games, cinema, concerts, books, hobbies, gambling\n' +
                        '- Utilities: electricity, water, internet, phone bills, gas, insurance\n' +
                        '- Health: pharmacy, doctor visits, gym, supplements, therapy, dental, eye care\n' +
                        '- Housing: rent, mortgage, repairs, furniture, appliances, cleaning supplies\n' +
                        '- Clothes: clothing, shoes, accessories, fashion brands, jewellery, bags\n' +
                        '- Other: anything that does not fit the above\n',
                },
                { role: 'user',      content: 'basketball €90'                                                    },
                { role: 'assistant', content: '{"description":"Basketball","category":"Entertainment"}'            },
                { role: 'user',      content: 'jantar no restaurante italiano €35'                                 },
                { role: 'assistant', content: '{"description":"Italian restaurant dinner","category":"Food"}'      },
                { role: 'user',      content: 'uber para o aeroporto €22'                                         },
                { role: 'assistant', content: '{"description":"Uber to airport","category":"Transportation"}'      },
                { role: 'user',      content: userInput },
            ],
            temperature: 0.1,
            max_tokens: 48,
        });
        const raw   = (reply.choices[0].message.content ?? '').trim();
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) return null;
        const parsed = JSON.parse(match[0]);
        if (!parsed.description || !parsed.category) return null;
        return { description: String(parsed.description), category: String(parsed.category) };
    } catch (e) {
        console.error('[LLM category+description error]', e);
        return null;
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
    const amount     = extractAmount(userInput);
    const date       = extractDate(userInput);
    const type       = normalizeToList(classifyByKeywords(userInput, TYPE_KEYWORDS, 'One-time'), types);
    const kwCategory = classifyByKeywords(userInput, CATEGORY_KEYWORDS, '');

    let category: string;
    let description: string;

    if (kwCategory) {
        // keyword or Levenshtein matched — only ask LLM for description
        category = normalizeToList(kwCategory, categories);
        const llmDesc = await getLLMDescription(userInput);
        description = llmDesc ?? fallbackDescription(userInput);
    } else {
        // log unmatched input for future keyword expansion
        const stored  = JSON.parse(localStorage.getItem('blip_unknown_terms') ?? '[]') as string[];
        const cleaned = fallbackDescription(userInput);
        if (cleaned && !stored.includes(cleaned)) {
            stored.push(cleaned);
            localStorage.setItem('blip_unknown_terms', JSON.stringify(stored));
        }

        // no match — ask LLM for both
        const llmResult = await getLLMCategoryAndDescription(userInput);
        category    = llmResult ? normalizeToList(llmResult.category, categories) : 'Other';
        description = llmResult?.description ?? fallbackDescription(userInput);
    }

    return { description, amount: amount ?? 0, date, category, type };
}
