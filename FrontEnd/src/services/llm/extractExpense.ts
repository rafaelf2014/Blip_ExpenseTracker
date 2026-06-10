import type { NewExpense } from '../../types';
import { toLocalDateStr } from '../../utils/finance';
import { CATEGORY_KEYWORDS, TYPE_KEYWORDS } from '../../constants/keywords';
import { normalizeText, classifyByKeywords, normalizeToList } from './textUtils';
import { getLLMDescription, getLLMCategoryAndDescription } from './engine';

const STORAGE_KEY_UNKNOWN_TERMS = 'blip_unknown_terms';

/** Extrai um montante de texto, suportando prefixo (€10) ou sufixo (10€) e vírgula decimal. */
function extractAmount(text: string): number | null {
    const m = text.match(/(?:€|\$|£|eur(?:os?)?)\s*(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s*(?:€|\$|£|eur(?:os?)?)/i);
    if (!m) return null;
    return parseFloat((m[1] ?? m[2]).replace(',', '.'));
}

/** Resolve uma data a partir de texto (hoje/ontem, dia da semana, ou data explícita); default: hoje. */
function extractDate(text: string): string {
    const today = new Date();
    const lower = normalizeText(text);

    if (lower.includes('hoje') || lower.includes('today')) return toLocalDateStr(today);

    if (lower.includes('ontem') || lower.includes('yesterday')) {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        return toLocalDateStr(d);
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
            return toLocalDateStr(d);
        }
    }

    const explicit = text.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (explicit) {
        if (explicit[1]) return explicit[1];
        return `${explicit[4]}-${explicit[3]!.padStart(2, '0')}-${explicit[2]!.padStart(2, '0')}`;
    }

    return toLocalDateStr(today);
}

/** Descrição de recurso: remove montantes e palavras de data, deixando o resto do texto. */
function fallbackDescription(userInput: string): string {
    return userInput
        .replace(/\d+[.,]?\d*\s*[€$£]/g, '')
        .replace(/[€$£]\s*\d+[.,]?\d*/g, '')
        .replace(/\b(hoje|ontem|today|yesterday|segunda|terca|quarta|quinta|sexta|sabado|domingo)\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 40);
}

/** Guarda termos que as palavras-chave não reconheceram, para análise futura. */
function rememberUnknownTerm(term: string): void {
    if (!term) return;
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_UNKNOWN_TERMS) ?? '[]') as string[];
    if (!stored.includes(term)) {
        stored.push(term);
        localStorage.setItem(STORAGE_KEY_UNKNOWN_TERMS, JSON.stringify(stored));
    }
}

/**
 * Converte texto livre numa despesa estruturada.
 * Montante/data/tipo vêm de regex+palavras-chave; a categoria usa palavras-chave
 * e recorre ao LLM apenas quando estas não chegam a uma categoria.
 */
export async function extractExpenseFromText(
    userInput: string,
    categories: string[],
    types: string[],
): Promise<NewExpense> {
    const amount     = extractAmount(userInput);
    const date       = extractDate(userInput);
    const type       = normalizeToList(classifyByKeywords(userInput, TYPE_KEYWORDS, 'One-time'), types);
    const kwCategory = classifyByKeywords(userInput, CATEGORY_KEYWORDS, '');

    let category: string;
    let description: string;

    if (kwCategory) {
        category    = normalizeToList(kwCategory, categories);
        description = (await getLLMDescription(userInput)) ?? fallbackDescription(userInput);
    } else {
        rememberUnknownTerm(fallbackDescription(userInput));
        const llmResult = await getLLMCategoryAndDescription(userInput);
        category    = llmResult ? normalizeToList(llmResult.category, categories) : 'Other';
        description = llmResult?.description ?? fallbackDescription(userInput);
    }

    return { description, amount: amount ?? 0, date, category, type };
}
