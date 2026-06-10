import type { Expense, RegularTransaction, Budget } from '../../types';
import { detectQueryType, type QueryType } from './dateContext';
import { buildQueryContext } from './queries/context';
import type { Lang } from './queries/messages';
import {
    handleIncome, handleBudget, handleMostFrequent, handleDistinctCategories,
    handlePercentage, handleDuplicates, handleRoundAmounts, handleCount,
    handleMax, handleAverage, handleList, handleTotal, type QueryHandler,
} from './queries/handlers';

// Handlers que produzem uma resposta mesmo sem despesas no período
// (consultam receitas/orçamentos, ou descrevem a ausência de dados).
const HANDLERS_BEFORE_EMPTY_GUARD: Partial<Record<QueryType, QueryHandler>> = {
    INCOME:              handleIncome,
    BUDGET:              handleBudget,
    MOST_FREQUENT:       handleMostFrequent,
    DISTINCT_CATEGORIES: handleDistinctCategories,
    PERCENTAGE:          handlePercentage,
    DUPLICATES:          handleDuplicates,
};

// Handlers que pressupõem pelo menos uma despesa filtrada. Qualquer tipo não
// tratado antes do guard cai aqui; TOTAL é o default.
const HANDLERS_AFTER_EMPTY_GUARD: Partial<Record<QueryType, QueryHandler>> = {
    ROUND_AMOUNTS: handleRoundAmounts,
    COUNT:         handleCount,
    MAX:           handleMax,
    AVERAGE:       handleAverage,
    LIST:          handleList,
};

export async function askFinancialQuestion(
    userInput: string,
    expenses: Expense[],
    regularTransactions: RegularTransaction[],
    budgets: Budget[],
    lang: Lang = 'pt',
): Promise<string> {
    const ctx = buildQueryContext(userInput, expenses, regularTransactions, budgets, lang);
    const queryType = detectQueryType(ctx.norm);

    const earlyHandler = HANDLERS_BEFORE_EMPTY_GUARD[queryType];
    if (earlyHandler) return earlyHandler(ctx);

    if (ctx.filteredExpenses.length === 0)
        return ctx.m.noExpensesInCat(ctx.catStr, ctx.dateResultStr);

    return (HANDLERS_AFTER_EMPTY_GUARD[queryType] ?? handleTotal)(ctx);
}
