import { toLocalDateStr } from '../../utils/finance';
import { normalizeText } from './textUtils';
import type { Messages } from './queries/messages';

export type QueryType =
    | 'TOTAL' | 'MAX' | 'AVERAGE' | 'LIST' | 'BUDGET' | 'INCOME' | 'COUNT'
    | 'MOST_FREQUENT' | 'DISTINCT_CATEGORIES' | 'PERCENTAGE' | 'DUPLICATES' | 'ROUND_AMOUNTS';

/** Resultado da interpretação da janela temporal de uma pergunta. */
export type DateContext = {
    tYear: number | null;
    tMonth: number | null;
    tDay: number | null;
    minDate: string | null;
    maxDate: string | null;
    customDateContext: string;
};

/** Classifica a intenção da pergunta a partir das suas palavras-chave. */
export function detectQueryType(norm: string): QueryType {
    if (/duplicat|repetid|mesmo valor|same amount/.test(norm))                                               return 'DUPLICATES';
    if (/round amount|exact amount|exact dollar|montante redondo|numero redondo|valor redondo/.test(norm))   return 'ROUND_AMOUNTS';
    if (/percent|percentagem|quota|share of|parte do total/.test(norm))                                     return 'PERCENTAGE';
    if (/most[\s-]?(?:used|frequent|common)|categoria mais usada|mais frequen/.test(norm))                  return 'MOST_FREQUENT';
    if (/distinct categor|different categor|how many categor|quantas categorias diferentes/.test(norm))     return 'DISTINCT_CATEGORIES';
    if (/maior|mais caro|maximo|maior gasto|largest|biggest|highest|most expensive/.test(norm))             return 'MAX';
    if (/media|medio|average|avg|gasto medio/.test(norm))                                                   return 'AVERAGE';
    if (/lista|listar|mostrar|ver|quais|transacoes|ultimas despesas|show|list|display/.test(norm))          return 'LIST';
    if (/orcamento|budget|limite|posso gastar|quanto falta|remaining|room left/.test(norm))                 return 'BUDGET';
    if (/recebi|rendimento|income|ganho|salario|ganhei|earn|salary/.test(norm))                              return 'INCOME';
    if (/quantas|quantos|numero de|vezes|how many|count|number of/.test(norm))                              return 'COUNT';
    return 'TOTAL';
}

const QUERY_KEYWORDS = [
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

/** Distingue uma pergunta financeira de input não reconhecido. */
export function detectChatIntent(userInput: string): 'QUERY' | 'UNKNOWN' {
    const norm = normalizeText(userInput);
    return QUERY_KEYWORDS.some(kw => norm.includes(kw)) ? 'QUERY' : 'UNKNOWN';
}

/** Último dia do mês `month` (1-12) do ano `year`. */
function lastDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

/** Interpreta a janela temporal pedida na pergunta (mês, trimestre, "últimos N dias", etc.). */
export function parseDateContext(norm: string, today: Date, m: Messages): DateContext {
    const currentYear  = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const fmt = toLocalDateStr;
    const D = m.date;

    let tYear: number | null = null;
    let tMonth: number | null = null;
    let tDay: number | null = null;

    // Data numérica explícita (YYYY-MM-DD ou DD/MM/YYYY)
    const explicit = norm.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (explicit) {
        if (explicit[1]) {
            const p = explicit[1].split('-');
            tYear = +p[0]; tMonth = +p[1]; tDay = +p[2];
        } else {
            tDay = +explicit[2]; tMonth = +explicit[3]; tYear = +explicit[4];
        }
        return { tYear, tMonth, tDay, minDate: null, maxDate: null, customDateContext: D.onDate(tDay!, tMonth!, tYear!) };
    }

    // Trimestres
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
            const maxDate = `${qYear}-${String(em).padStart(2, '0')}-${String(lastDayOfMonth(qYear, em)).padStart(2, '0')}`;
            return { tYear, tMonth, tDay, minDate, maxDate, customDateContext: D.inQuarter(q, qYear) };
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
            maxDate: `${ly}-${String(em).padStart(2, '0')}-${String(lastDayOfMonth(ly, em)).padStart(2, '0')}`,
            customDateContext: D.lastQuarter,
        };
    }
    if (/this quarter|este trimestre/.test(norm)) {
        const cq = Math.ceil(currentMonth / 3);
        const sm = (cq - 1) * 3 + 1; const em = cq * 3;
        return {
            tYear, tMonth, tDay,
            minDate: `${currentYear}-${String(sm).padStart(2, '0')}-01`,
            maxDate: `${currentYear}-${String(em).padStart(2, '0')}-${String(lastDayOfMonth(currentYear, em)).padStart(2, '0')}`,
            customDateContext: D.thisQuarter,
        };
    }

    // "últimos N dias/semanas/meses"
    const matchDias    = norm.match(/(?:ultim[oa]s?|utlim[oa]s?|last|past)\s+(\d+)\s+(?:dias?|days?)/);
    const matchSemanas = norm.match(/(?:ultim[oa]s?|utlim[oa]s?|last|past)\s+(\d+)\s+(?:semanas?|weeks?)/);
    const matchMeses   = norm.match(/(?:ultim[oa]s?|utlim[oa]s?|last|past)\s+(\d+)\s+(?:meses?|months?)/);
    if (matchDias) {
        const n = +matchDias[1]; const d = new Date(today); d.setDate(d.getDate() - n);
        return { tYear, tMonth, tDay, minDate: fmt(d), maxDate: fmt(today), customDateContext: D.lastNDays(n) };
    }
    if (matchSemanas) {
        const n = +matchSemanas[1]; const d = new Date(today); d.setDate(d.getDate() - n * 7);
        return { tYear, tMonth, tDay, minDate: fmt(d), maxDate: fmt(today), customDateContext: D.lastNWeeks(n) };
    }
    if (matchMeses) {
        const n = +matchMeses[1]; const d = new Date(today); d.setMonth(d.getMonth() - n);
        return { tYear, tMonth, tDay, minDate: fmt(d), maxDate: fmt(today), customDateContext: D.lastNMonths(n) };
    }

    // Períodos relativos nomeados
    if (/\bhoje\b|\btoday\b/.test(norm))
        return { tYear: currentYear, tMonth: currentMonth, tDay: today.getDate(), minDate: null, maxDate: null, customDateContext: D.today };
    if (/\bontem\b|\byesterday\b/.test(norm)) {
        const d = new Date(today); d.setDate(d.getDate() - 1);
        return { tYear: d.getFullYear(), tMonth: d.getMonth() + 1, tDay: d.getDate(), minDate: null, maxDate: null, customDateContext: D.yesterday };
    }
    if (/ultimo ano|ano passado|last year/.test(norm))
        return { tYear: currentYear - 1, tMonth, tDay, minDate: null, maxDate: null, customDateContext: D.lastYear };
    if (/este ano|this year/.test(norm))
        return { tYear: currentYear, tMonth, tDay, minDate: null, maxDate: null, customDateContext: D.thisYear };
    if (/ultimo mes|mes passado|last month/.test(norm)) {
        const m2 = currentMonth === 1 ? 12 : currentMonth - 1;
        const y = currentMonth === 1 ? currentYear - 1 : currentYear;
        return { tYear: y, tMonth: m2, tDay, minDate: null, maxDate: null, customDateContext: D.lastMonth };
    }
    if (/este mes|neste mes|this month/.test(norm))
        return { tYear: currentYear, tMonth: currentMonth, tDay, minDate: null, maxDate: null, customDateContext: D.thisMonth };
    if (/ultima semana|semana passada|last week/.test(norm)) {
        const d = new Date(today); d.setDate(d.getDate() - 7);
        return { tYear, tMonth, tDay, minDate: fmt(d), maxDate: fmt(today), customDateContext: D.lastWeek };
    }
    if (/this week|esta semana/.test(norm)) {
        const d = new Date(today);
        const dayOfWeek = today.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0 offset
        d.setDate(d.getDate() - daysFromMonday);
        return { tYear, tMonth, tDay, minDate: fmt(d), maxDate: fmt(today), customDateContext: D.thisWeek };
    }

    // Dia da semana
    const dayMap: Record<string, number> = {
        domingo: 0, sunday: 0, segunda: 1, monday: 1, terca: 2, tuesday: 2,
        quarta: 3, wednesday: 3, quinta: 4, thursday: 4, sexta: 5, friday: 5, sabado: 6, saturday: 6,
    };
    for (const [name, dow] of Object.entries(dayMap)) {
        if (norm.includes(name)) {
            const d = new Date(today);
            const diff = (today.getDay() - dow + 7) % 7 || 7;
            d.setDate(today.getDate() - diff);
            return { tYear: d.getFullYear(), tMonth: d.getMonth() + 1, tDay: d.getDate(), minDate: null, maxDate: null, customDateContext: D.lastWeekday(name) };
        }
    }

    // Linguagem natural: "dia 22", "22 de abril", "April 14th"
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
    if (tDay && tMonth && tYear)  customDateContext = D.onDate(tDay, tMonth, tYear);
    else if (tMonth && tYear)     customDateContext = D.inMonthYear(tMonth, tYear);
    else if (tYear)               customDateContext = D.inYear(tYear);

    return { tYear, tMonth, tDay, minDate: null, maxDate: null, customDateContext };
}
