import type { Expense, RegularTransaction, Budget } from '../../../types';
import { classifyByKeywords, normalizeText } from '../textUtils';
import { QUERY_CATEGORY_KEYWORDS } from '../../../constants/keywords';
import { parseDateContext, type DateContext } from '../dateContext';
import { getMessages, type Lang, type Messages } from './messages';

/**
 * Tudo o que um handler de query precisa: a pergunta normalizada, a janela
 * temporal interpretada, os dados filtrados, os totais derivados e formatadores.
 * Construído uma vez em `buildQueryContext` e partilhado por todos os handlers.
 */
export type QueryContext = {
    norm: string;
    today: Date;
    currentYear: number;
    currentMonth: number;

    lang: Lang;
    m: Messages;

    targetCategory: string;
    catStr: string;
    dateResultStr: string;
    dateCtx: DateContext;

    filterMin: number | null;
    filterMax: number | null;
    roundOnly: boolean;

    expenses: Expense[];
    regularTransactions: RegularTransaction[];
    budgets: Budget[];

    filterByDate: (exp: Expense) => boolean;
    filteredExpenses: Expense[];
    totalSpent: number;

    /** "DD/MM" a partir de uma data ISO. */
    fmtD: (s: string) => string;
};

export function buildQueryContext(
    userInput: string,
    expenses: Expense[],
    regularTransactions: RegularTransaction[],
    budgets: Budget[],
    lang: Lang,
): QueryContext {
    const m = getMessages(lang);
    const norm = normalizeText(userInput);
    const targetCategory = classifyByKeywords(userInput, QUERY_CATEGORY_KEYWORDS, 'ALL');

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const dateCtx = parseDateContext(norm, today, m);
    const { tYear, tMonth, tDay, minDate, maxDate, customDateContext } = dateCtx;

    // Filtros de montante — o lookahead impede "over 2 months" de contar como montante
    const noTimeUnit = '(?!\\s*(?:days?|weeks?|months?|years?|dias?|semanas?|meses?|anos?))';
    const aboveM = norm.match(new RegExp(`(?:over|above|more than|greater than|acima de|mais de)\\s*[$€£]?\\s*(\\d+(?:[.,]\\d{1,2})?)${noTimeUnit}`));
    const belowM = norm.match(new RegExp(`(?:under|below|less than|lower than|abaixo de|menos de)\\s*[$€£]?\\s*(\\d+(?:[.,]\\d{1,2})?)${noTimeUnit}`));
    const filterMin = aboveM ? parseFloat(aboveM[1].replace(',', '.')) : null;
    const filterMax = belowM ? parseFloat(belowM[1].replace(',', '.')) : null;
    const roundOnly = /round amount|exact amount|exact dollar|montante redondo|numero redondo|valor redondo/.test(norm);

    const filterByDate = (exp: Expense): boolean => {
        const dateStr = exp.date.includes('T') ? exp.date.split('T')[0] : exp.date;
        const parts = dateStr.split('-');
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
        if (Number(exp.amount) < 0)                                      return false; // income rows handled separately
        if (targetCategory !== 'ALL' && exp.category !== targetCategory) return false;
        if (!filterByDate(exp))                                          return false;
        if (filterMin !== null && Number(exp.amount) <= filterMin)       return false;
        if (filterMax !== null && Number(exp.amount) >= filterMax)       return false;
        if (roundOnly && Number(exp.amount) % 1 !== 0)                   return false;
        return true;
    });

    const totalSpent = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const fmtD = (s: string) => {
        const d = new Date(s);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    return {
        norm, today, currentYear, currentMonth,
        lang, m,
        targetCategory,
        catStr: targetCategory === 'ALL' ? m.allCategories : targetCategory,
        dateResultStr: customDateContext || m.historicTotal,
        dateCtx,
        filterMin, filterMax, roundOnly,
        expenses, regularTransactions, budgets,
        filterByDate, filteredExpenses, totalSpent,
        fmtD,
    };
}
