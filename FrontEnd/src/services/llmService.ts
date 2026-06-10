import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type { NewExpense, Expense, RegularTransaction, Budget } from '../types';
import { calcIncome } from '../utils/finance';
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
        const worker = new Worker(new URL('./webllm-worker.ts', import.meta.url), { type: 'module' });
        try {
            engine = await CreateWebWorkerMLCEngine(
                worker,
                selectedModel,
                { initProgressCallback }
            );
            console.log("Modelo carregado.");
        } catch (e) {
            worker.terminate();
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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
    return Promise.race([
        promise,
        new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
    ]);
}

async function getLLMDescription(userInput: string): Promise<string | null> {
    if (!engine) return null;
    try {
        const reply = await withTimeout(engine.chat.completions.create({
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
        }) as Promise<any>, 15000);
        if (!reply) return null;
        const raw = (reply.choices[0].message.content ?? '').trim();
        return raw.replace(/^["'.]+|["'.]+$/g, '') || null;
    } catch {
        return null;
    }
}


async function getLLMCategoryAndDescription(
    userInput: string
): Promise<{ category: string; description: string } | null> {
    if (!engine) return null;
    try {
        const reply = await withTimeout(engine.chat.completions.create({
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
        }) as Promise<any>, 30000);
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
        category = normalizeToList(kwCategory, categories);
        const llmDesc = await getLLMDescription(userInput);
        description = llmDesc ?? fallbackDescription(userInput);
    } else {
        const stored  = JSON.parse(localStorage.getItem('blip_unknown_terms') ?? '[]') as string[];
        const cleaned = fallbackDescription(userInput);
        if (cleaned && !stored.includes(cleaned)) {
            stored.push(cleaned);
            localStorage.setItem('blip_unknown_terms', JSON.stringify(stored));
        }
        const llmResult = await getLLMCategoryAndDescription(userInput);
        category    = llmResult ? normalizeToList(llmResult.category, categories) : 'Other';
        description = llmResult?.description ?? fallbackDescription(userInput);
    }

    return { description, amount: amount ?? 0, date, category, type };
}

type QueryType = 'TOTAL' | 'MAX' | 'AVERAGE' | 'LIST' | 'BUDGET' | 'INCOME' | 'COUNT'
    | 'MOST_FREQUENT' | 'DISTINCT_CATEGORIES' | 'PERCENTAGE' | 'DUPLICATES' | 'ROUND_AMOUNTS';

function detectQueryType(norm: string): QueryType {
    if (/duplicat|repetid|mesmo valor|same amount/.test(norm))                                               return 'DUPLICATES';
    if (/round amount|exact amount|exact dollar|montante redondo|numero redondo|valor redondo/.test(norm))   return 'ROUND_AMOUNTS';
    if (/percent|percentagem|quota|share of|parte do total/.test(norm))                                     return 'PERCENTAGE';
    if (/most[\s-]?(?:used|frequent|common)|categoria mais usada|mais frequen/.test(norm))                  return 'MOST_FREQUENT';
    if (/distinct categor|different categor|how many categor|quantas categorias diferentes/.test(norm))     return 'DISTINCT_CATEGORIES';
    if (/maior|mais caro|maximo|maior gasto|largest|biggest|highest|most expensive/.test(norm))             return 'MAX';
    if (/media|medio|average|avg|gasto medio/.test(norm))                                                   return 'AVERAGE';
    if (/lista|listar|mostrar|ver|quais|transacoes|ultimas despesas|show|list|display/.test(norm))          return 'LIST';
    if (/orcamento|budget|limite|posso gastar|quanto falta|remaining|room left/.test(norm))                 return 'BUDGET';
    if (/recebi|rendimento|income|ganho|salario|ganhei|earned|salary/.test(norm))                           return 'INCOME';
    if (/quantas|quantos|numero de|vezes|how many|count|number of/.test(norm))                              return 'COUNT';
    return 'TOTAL';
}

export function detectChatIntent(userInput: string): 'QUERY' | 'UNKNOWN' {
    const norm = normalizeText(userInput);
    const queryKeywords = [
        // Portuguese
        'quanto', 'qual', 'quais', 'lista', 'mostra', 'analisa', 'resumo', 'total',
        'media', 'maior', 'menor', 'orcamento', 'recebi', 'rendimento', 'quantas', 'quantos',
        'historico', 'maximo', 'duplicad', 'repetid', 'redondo', 'frequen', 'gastei', 'gasto',
        'transac', 'abaixo', 'acima', 'despesa', 'despesas',
        // English
        'how much', 'how many', 'show', 'list', 'what', 'which', 'largest', 'biggest',
        'average', 'budget', 'income', 'salary', 'percentage', 'percent', 'duplicate',
        'most used', 'frequent', 'distinct', 'spent', 'spend', 'transactions', 'expenses',
    ];
    if (queryKeywords.some(kw => norm.includes(kw))) return 'QUERY';
    return 'UNKNOWN';
}

function parseDateContext(norm: string, today: Date): {
    tYear: number | null; tMonth: number | null; tDay: number | null;
    minDate: string | null; maxDate: string | null; customDateContext: string;
} {
    const currentYear  = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    let tYear: number | null = null;
    let tMonth: number | null = null;
    let tDay: number | null = null;

    // Explicit numeric date (YYYY-MM-DD or DD/MM/YYYY)
    const explicit = norm.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (explicit) {
        if (explicit[1]) {
            const p = explicit[1].split('-');
            tYear = +p[0]; tMonth = +p[1]; tDay = +p[2];
        } else {
            tDay = +explicit[2]; tMonth = +explicit[3]; tYear = +explicit[4];
        }
        return { tYear, tMonth, tDay, minDate: null, maxDate: null, customDateContext: `a ${tDay}/${tMonth}/${tYear}` };
    }

    // Quarter detection
    const quarterPatterns: [RegExp, number][] = [
        [/\bq1\b|first quarter|1st quarter|primeiro trimestre/, 1],
        [/\bq2\b|second quarter|2nd quarter|segundo trimestre/, 2],
        [/\bq3\b|third quarter|3rd quarter|terceiro trimestre/, 3],
        [/\bq4\b|fourth quarter|4th quarter|quarto trimestre/, 4],
    ];
    for (const [pattern, q] of quarterPatterns) {
        if (pattern.test(norm)) {
            const ym = norm.match(/\b(20\d{2})\b/);
            const qYear = ym ? +ym[1] : currentYear;
            const sm = (q - 1) * 3 + 1;
            const em = q * 3;
            const minDate = `${qYear}-${String(sm).padStart(2, '0')}-01`;
            const maxDate = `${qYear}-${String(em).padStart(2, '0')}-${String(new Date(qYear, em, 0).getDate()).padStart(2, '0')}`;
            return { tYear, tMonth, tDay, minDate, maxDate, customDateContext: `no Q${q} de ${qYear}` };
        }
    }
    if (/last quarter|ultimo trimestre/.test(norm)) {
        const cq = Math.ceil(currentMonth / 3);
        const lq = cq === 1 ? 4 : cq - 1;
        const ly = cq === 1 ? currentYear - 1 : currentYear;
        const sm = (lq - 1) * 3 + 1; const em = lq * 3;
        return {
            tYear, tMonth, tDay,
            minDate: `${ly}-${String(sm).padStart(2, '0')}-01`,
            maxDate: `${ly}-${String(em).padStart(2, '0')}-${String(new Date(ly, em, 0).getDate()).padStart(2, '0')}`,
            customDateContext: 'no último trimestre',
        };
    }
    if (/this quarter|este trimestre/.test(norm)) {
        const cq = Math.ceil(currentMonth / 3);
        const sm = (cq - 1) * 3 + 1; const em = cq * 3;
        return {
            tYear, tMonth, tDay,
            minDate: `${currentYear}-${String(sm).padStart(2, '0')}-01`,
            maxDate: `${currentYear}-${String(em).padStart(2, '0')}-${String(new Date(currentYear, em, 0).getDate()).padStart(2, '0')}`,
            customDateContext: 'neste trimestre',
        };
    }

    // "last/past N days/weeks/months"
    const matchDias    = norm.match(/(?:ultim[oa]s?|utlim[oa]s?|last|past)\s+(\d+)\s+(?:dias?|days?)/);
    const matchSemanas = norm.match(/(?:ultim[oa]s?|utlim[oa]s?|last|past)\s+(\d+)\s+(?:semanas?|weeks?)/);
    const matchMeses   = norm.match(/(?:ultim[oa]s?|utlim[oa]s?|last|past)\s+(\d+)\s+(?:meses?|months?)/);
    if (matchDias) {
        const n = +matchDias[1]; const d = new Date(today); d.setDate(d.getDate() - n);
        return { tYear, tMonth, tDay, minDate: fmt(d), maxDate: fmt(today), customDateContext: `nos últimos ${n} dias` };
    }
    if (matchSemanas) {
        const n = +matchSemanas[1]; const d = new Date(today); d.setDate(d.getDate() - n * 7);
        return { tYear, tMonth, tDay, minDate: fmt(d), maxDate: fmt(today), customDateContext: `nas últimas ${n} semanas` };
    }
    if (matchMeses) {
        const n = +matchMeses[1]; const d = new Date(today); d.setMonth(d.getMonth() - n);
        return { tYear, tMonth, tDay, minDate: fmt(d), maxDate: fmt(today), customDateContext: `nos últimos ${n} meses` };
    }

    // Named relative periods
    if (/\bhoje\b|\btoday\b/.test(norm))
        return { tYear: currentYear, tMonth: currentMonth, tDay: today.getDate(), minDate: null, maxDate: null, customDateContext: 'hoje' };
    if (/\bontem\b|\byesterday\b/.test(norm)) {
        const d = new Date(today); d.setDate(d.getDate() - 1);
        return { tYear: d.getFullYear(), tMonth: d.getMonth() + 1, tDay: d.getDate(), minDate: null, maxDate: null, customDateContext: 'ontem' };
    }
    if (/ultimo ano|ano passado|last year/.test(norm))
        return { tYear: currentYear - 1, tMonth, tDay, minDate: null, maxDate: null, customDateContext: 'no último ano' };
    if (/este ano|this year/.test(norm))
        return { tYear: currentYear, tMonth, tDay, minDate: null, maxDate: null, customDateContext: 'este ano' };
    if (/ultimo mes|mes passado|last month/.test(norm)) {
        const m = currentMonth === 1 ? 12 : currentMonth - 1;
        const y = currentMonth === 1 ? currentYear - 1 : currentYear;
        return { tYear: y, tMonth: m, tDay, minDate: null, maxDate: null, customDateContext: 'no último mês' };
    }
    if (/este mes|neste mes|this month/.test(norm))
        return { tYear: currentYear, tMonth: currentMonth, tDay, minDate: null, maxDate: null, customDateContext: 'este mês' };
    if (/ultima semana|semana passada|last week/.test(norm)) {
        const d = new Date(today); d.setDate(d.getDate() - 7);
        return { tYear, tMonth, tDay, minDate: fmt(d), maxDate: fmt(today), customDateContext: 'na última semana' };
    }
    if (/this week|esta semana/.test(norm)) {
        const d = new Date(today);
        const dayOfWeek = today.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0 offset
        d.setDate(d.getDate() - daysFromMonday);
        return { tYear, tMonth, tDay, minDate: fmt(d), maxDate: fmt(today), customDateContext: 'esta semana' };
    }

    // Day of week
    const dayMap: Record<string, number> = {
        domingo: 0, sunday: 0, segunda: 1, monday: 1, terca: 2, tuesday: 2,
        quarta: 3, wednesday: 3, quinta: 4, thursday: 4, sexta: 5, friday: 5, sabado: 6, saturday: 6,
    };
    for (const [name, dow] of Object.entries(dayMap)) {
        if (norm.includes(name)) {
            const d = new Date(today);
            const diff = (today.getDay() - dow + 7) % 7 || 7;
            d.setDate(today.getDate() - diff);
            return { tYear: d.getFullYear(), tMonth: d.getMonth() + 1, tDay: d.getDate(), minDate: null, maxDate: null, customDateContext: `na última ${name}` };
        }
    }

    // Natural language: "dia 22", "22 de abril", "April 14th"
    const ordinalMatch = norm.match(/\b(\d{1,2})(?:st|nd|rd|th)\b/);
    const dayMatch     = norm.match(/\bdia\s+(\d{1,2})\b/);
    const dayDeMatch   = norm.match(/\b(\d{1,2})\s+de\b/);
    if (ordinalMatch)    tDay = +ordinalMatch[1];
    else if (dayMatch)   tDay = +dayMatch[1];
    else if (dayDeMatch) tDay = +dayDeMatch[1];

    const monthNames: string[][] = [
        ['janeiro', 'january'],  ['fevereiro', 'february'], ['marco', 'march'],
        ['abril', 'april'],      ['maio', 'may'],            ['junho', 'june'],
        ['julho', 'july'],       ['agosto', 'august'],       ['setembro', 'september'],
        ['outubro', 'october'],  ['novembro', 'november'],   ['dezembro', 'december'],
    ];
    for (let i = 0; i < monthNames.length; i++) {
        if (monthNames[i].some(name => norm.includes(name))) { tMonth = i + 1; break; }
    }

    const yearMatch = norm.match(/\b(20\d{2})\b/);
    if (yearMatch) tYear = +yearMatch[1];

    if (tDay !== null && tMonth === null) tMonth = currentMonth;
    if (tMonth !== null && tYear === null) tYear = currentYear;

    let customDateContext = '';
    if (tDay && tMonth && tYear)  customDateContext = `a ${tDay}/${tMonth}/${tYear}`;
    else if (tMonth && tYear)     customDateContext = `no mês ${tMonth} de ${tYear}`;
    else if (tYear)               customDateContext = `no ano ${tYear}`;

    return { tYear, tMonth, tDay, minDate: null, maxDate: null, customDateContext };
}

export async function askFinancialQuestion(
    userInput: string,
    expenses: Expense[],
    regularTransactions: RegularTransaction[],
    budgets: Budget[]
): Promise<string> {
    const norm = normalizeText(userInput);
    const targetCategory = classifyByKeywords(userInput, QUERY_CATEGORY_KEYWORDS, 'ALL');

    const today        = new Date();
    const currentYear  = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const { tYear, tMonth, tDay, minDate, maxDate, customDateContext } = parseDateContext(norm, today);

    // Amount filters — negative lookahead prevents "over 2 months" from matching as an amount
    const noTimeUnit = '(?!\\s*(?:days?|weeks?|months?|years?|dias?|semanas?|meses?|anos?))';
    const aboveM    = norm.match(new RegExp(`(?:over|above|more than|greater than|acima de|mais de)\\s*[$€£]?\\s*(\\d+(?:[.,]\\d{1,2})?)${noTimeUnit}`));
    const belowM    = norm.match(new RegExp(`(?:under|below|less than|lower than|abaixo de|menos de)\\s*[$€£]?\\s*(\\d+(?:[.,]\\d{1,2})?)${noTimeUnit}`));
    const filterMin = aboveM ? parseFloat(aboveM[1].replace(',', '.')) : null;
    const filterMax = belowM ? parseFloat(belowM[1].replace(',', '.')) : null;
    const roundOnly = /round amount|exact amount|exact dollar|montante redondo|numero redondo|valor redondo/.test(norm);

    const filterByDate = (exp: Expense): boolean => {
        const dateStr = exp.date.includes('T') ? exp.date.split('T')[0] : exp.date;
        const parts   = dateStr.split('-');
        let ey: number, em: number, ed: number;
        if (parts[0].length === 4) { ey = +parts[0]; em = +parts[1]; ed = +parts[2]; }
        else                       { ed = +parts[0]; em = +parts[1]; ey = +parts[2]; }
        if (minDate && maxDate) {
            const nd = `${ey}-${String(em).padStart(2, '0')}-${String(ed).padStart(2, '0')}`;
            return nd >= minDate && nd <= maxDate;
        }
        if (tYear  !== null && ey !== tYear)  return false;
        if (tMonth !== null && em !== tMonth) return false;
        if (tDay   !== null && ed !== tDay)   return false;
        return true;
    };

    const filteredExpenses = expenses.filter(exp => {
        if (targetCategory !== 'ALL' && exp.category !== targetCategory) return false;
        if (!filterByDate(exp))                                           return false;
        if (filterMin !== null && Number(exp.amount) <= filterMin)        return false;
        if (filterMax !== null && Number(exp.amount) >= filterMax)        return false;
        if (roundOnly && Number(exp.amount) % 1 !== 0)                   return false;
        return true;
    });

    const totalSpent    = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const catStr        = targetCategory === 'ALL' ? 'todas as categorias' : targetCategory;
    const dateResultStr = customDateContext || 'no total histórico';
    const queryType     = detectQueryType(norm);

    const fmtD = (s: string) => {
        const d = new Date(s);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    // INCOME
    if (queryType === 'INCOME') {
        if (regularTransactions.length === 0)
            return 'Não tens receitas regulares configuradas. Define-as nas Definições.';
        const incomeStart = tMonth && tYear ? new Date(tYear, tMonth - 1, 1)
            : tYear   ? new Date(tYear, 0, 1)
            : minDate ? new Date(minDate)
            : new Date(today.getFullYear(), today.getMonth(), 1);
        const incomeEnd = tMonth && tYear ? new Date(tYear, tMonth, 0)
            : tYear   ? new Date(tYear, 11, 31)
            : maxDate ? new Date(maxDate)
            : today;
        return `A tua receita estimada ${dateResultStr}: ${calcIncome(regularTransactions, incomeStart, incomeEnd).toFixed(2)}€.`;
    }

    // BUDGET
    if (queryType === 'BUDGET') {
        if (budgets.length === 0)
            return 'Não tens orçamentos definidos. Define-os nas Definições.';

        let relevantBudgets = budgets;
        if (targetCategory !== 'ALL') {
            const exact = budgets.filter(b => b.category.toLowerCase() === targetCategory.toLowerCase());
            if (exact.length > 0) {
                relevantBudgets = exact;
            } else {
                const nc    = normalizeText(targetCategory);
                const fuzzy = budgets.filter(b => {
                    const bn = normalizeText(b.category);
                    return bn.includes(nc) || nc.includes(bn) || levenshtein(bn, nc) <= 2;
                });
                relevantBudgets = fuzzy.length > 0 ? fuzzy : budgets;
            }
        }

        const budgetMonth = tMonth ?? currentMonth;
        const budgetYear  = tYear  ?? currentYear;

        const scored = relevantBudgets.map(b => {
            const spent = expenses
                .filter(exp => {
                    if (exp.category !== b.category) return false;
                    const ds = exp.date.includes('T') ? exp.date.split('T')[0] : exp.date;
                    const [y, m] = ds.split('-').map(Number);
                    if (b.period === 'monthly') return y === budgetYear && m === budgetMonth;
                    if (b.period === 'yearly')  return y === budgetYear;
                    return new Date(ds) >= new Date(new Date(today).setDate(today.getDate() - 7));
                })
                .reduce((s, e) => s + Number(e.amount), 0);
            const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
            return { b, spent, pct };
        }).sort((a, z) => z.pct - a.pct);

        const lines = scored.map(({ b, spent, pct }) => {
            const status = pct >= 100 ? '(Excedido!)' : pct >= 80 ? '(Quase no limite)' : '(OK)';
            return `• ${b.category}: ${spent.toFixed(2)}€ / ${b.limit.toFixed(2)}€ (${pct}%) ${status}`;
        });
        return `Estado dos teus orçamentos:\n${lines.join('\n')}`;
    }

    // MOST FREQUENT CATEGORY
    if (queryType === 'MOST_FREQUENT') {
        if (filteredExpenses.length === 0) return `Não encontrei despesas ${dateResultStr}.`;
        const counts: Record<string, number> = {};
        for (const e of filteredExpenses) counts[e.category] = (counts[e.category] ?? 0) + 1;
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const lines  = sorted.slice(0, 5).map(([cat, n]) => `• ${cat}: ${n} transação/ões`).join('\n');
        return `Categorias mais usadas ${dateResultStr}:\n${lines}`;
    }

    // DISTINCT CATEGORIES
    if (queryType === 'DISTINCT_CATEGORIES') {
        const cats = new Set(filteredExpenses.map(e => e.category));
        if (cats.size === 0) return `Não encontrei despesas ${dateResultStr}.`;
        return `Usaste ${cats.size} categoria(s) ${dateResultStr}: ${[...cats].join(', ')}.`;
    }

    // PERCENTAGE OF TOTAL
    if (queryType === 'PERCENTAGE') {
        if (targetCategory === 'ALL')
            return 'Especifica uma categoria para calcular a percentagem (ex: "percentage of food this month").';
        const allTotal = expenses.filter(filterByDate).reduce((s, e) => s + Number(e.amount), 0);
        if (allTotal === 0) return `Não tens despesas ${dateResultStr}.`;
        const pct = Math.round((totalSpent / allTotal) * 100);
        return `${catStr} representa ${pct}% do total gasto ${dateResultStr} (${totalSpent.toFixed(2)}€ de ${allTotal.toFixed(2)}€).`;
    }

    // DUPLICATE DETECTION
    if (queryType === 'DUPLICATES') {
        const groups: Record<string, number> = {};
        for (const e of filteredExpenses) {
            const key = `${e.date.split('T')[0]}_${e.category}_${Number(e.amount).toFixed(2)}`;
            groups[key] = (groups[key] ?? 0) + 1;
        }
        const dupes = Object.entries(groups).filter(([, n]) => n > 1);
        if (dupes.length === 0) return `Não encontrei transações duplicadas ${dateResultStr}.`;
        const lines = dupes.map(([key, n]) => {
            const [date, cat, amount] = key.split('_');
            return `• ${amount}€ em ${cat} a ${date} (${n}x)`;
        }).join('\n');
        return `Encontrei ${dupes.length} grupo(s) de duplicados ${dateResultStr}:\n${lines}`;
    }

    if (filteredExpenses.length === 0)
        return `Não encontrei despesas em ${catStr} ${dateResultStr}.`;

    // ROUND AMOUNTS
    if (queryType === 'ROUND_AMOUNTS') {
        const rows = filteredExpenses.slice(0, 10).map(e => `• ${e.description} — ${Number(e.amount).toFixed(2)}€ (${fmtD(e.date)})`).join('\n');
        const more = filteredExpenses.length > 10 ? `\n... e mais ${filteredExpenses.length - 10}.` : '';
        return `${filteredExpenses.length} transação/ões com montante redondo ${dateResultStr}:\n${rows}${more}`;
    }

    if (queryType === 'COUNT')
        return `Encontrei ${filteredExpenses.length} despesa(s) em ${catStr} ${dateResultStr}.`;

    if (queryType === 'MAX') {
        const maxExp  = filteredExpenses.reduce((a, b) => Number(a.amount) >= Number(b.amount) ? a : b);
        const catInfo = targetCategory === 'ALL' ? ` — categoria: ${maxExp.category}` : '';
        return `A maior despesa ${dateResultStr}: "${maxExp.description}" com ${Number(maxExp.amount).toFixed(2)}€${catInfo}.`;
    }

    if (queryType === 'AVERAGE') {
        const isDaily   = /\b(?:daily|per day|por dia|diario|diaria|media diaria)\b/.test(norm);
        const isWeekly  = /\b(?:weekly|per week|por semana|semanal|media semanal)\b/.test(norm);
        const isMonthly = /\b(?:monthly|per month|por mes|mensal|media mensal)\b/.test(norm);
        const isYearly  = /\b(?:yearly|annual|per year|por ano|anual|media anual)\b/.test(norm);

        if (isDaily || isWeekly || isMonthly || isYearly) {
            let divisor = 1;
            let unit = '';

            const periodDays = (() => {
                if (minDate && maxDate)
                    return Math.round((new Date(maxDate).getTime() - new Date(minDate).getTime()) / 86_400_000) + 1;
                if (tMonth && tYear) return new Date(tYear, tMonth, 0).getDate();
                if (tYear) return 365;
                // all-time: use actual date range from expenses
                if (filteredExpenses.length === 0) return 1;
                const dates = filteredExpenses.map(e => new Date(e.date.split('T')[0]).getTime());
                return Math.round((Math.max(...dates) - Math.min(...dates)) / 86_400_000) + 1;
            })();

            if (isDaily)   { divisor = Math.max(1, periodDays);        unit = 'dia'; }
            if (isWeekly)  { divisor = Math.max(1, periodDays / 7);    unit = 'semana'; }
            if (isMonthly) { divisor = Math.max(1, periodDays / 30.44); unit = 'mês'; }
            if (isYearly)  { divisor = Math.max(1, periodDays / 365);  unit = 'ano'; }

            const avg = totalSpent / divisor;
            return `Gasto médio por ${unit} em ${catStr} ${dateResultStr}: ${avg.toFixed(2)}€.`;
        }

        const avg = totalSpent / filteredExpenses.length;
        return `Gasto médio por transação em ${catStr} ${dateResultStr}: ${avg.toFixed(2)}€ (${filteredExpenses.length} transação/ões).`;
    }

    if (queryType === 'LIST') {
        const sorted = [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const rows   = sorted.slice(0, 5).map(e => `• ${e.description} — ${Number(e.amount).toFixed(2)}€ (${fmtD(e.date)})`).join('\n');
        const more   = filteredExpenses.length > 5 ? `\n... e mais ${filteredExpenses.length - 5} despesa(s).` : '';
        return `${filteredExpenses.length} despesa(s) em ${catStr} ${dateResultStr}:\n${rows}${more}`;
    }

    return `O teu gasto foi de ${totalSpent.toFixed(2)}€ em ${catStr} ${dateResultStr}. (${filteredExpenses.length} registo/s).`;
}
