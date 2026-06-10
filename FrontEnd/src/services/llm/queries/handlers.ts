import { calcIncome } from '../../../utils/finance';
import { levenshtein, normalizeText } from '../textUtils';
import type { QueryContext } from './context';

export type QueryHandler = (ctx: QueryContext) => string;

export function handleIncome(ctx: QueryContext): string {
    const { m, regularTransactions, dateCtx, dateResultStr, today } = ctx;
    const { tYear, tMonth, minDate, maxDate } = dateCtx;

    if (regularTransactions.length === 0) return m.noIncome;

    const incomeStart = tMonth && tYear ? new Date(tYear, tMonth - 1, 1)
        : tYear   ? new Date(tYear, 0, 1)
        : minDate ? new Date(minDate)
        : new Date(today.getFullYear(), today.getMonth(), 1);
    const incomeEnd = tMonth && tYear ? new Date(tYear, tMonth, 0)
        : tYear   ? new Date(tYear, 11, 31)
        : maxDate ? new Date(maxDate)
        : today;

    return m.incomeEstimate(dateResultStr, calcIncome(regularTransactions, incomeStart, incomeEnd).toFixed(2));
}

export function handleBudget(ctx: QueryContext): string {
    const { m, budgets, expenses, targetCategory, dateCtx, today, currentMonth, currentYear } = ctx;

    if (budgets.length === 0) return m.noBudgets;

    let relevantBudgets = budgets;
    if (targetCategory !== 'ALL') {
        const exact = budgets.filter(b => b.category.toLowerCase() === targetCategory.toLowerCase());
        if (exact.length > 0) {
            relevantBudgets = exact;
        } else {
            const nc = normalizeText(targetCategory);
            const fuzzy = budgets.filter(b => {
                const bn = normalizeText(b.category);
                return bn.includes(nc) || nc.includes(bn) || levenshtein(bn, nc) <= 2;
            });
            relevantBudgets = fuzzy.length > 0 ? fuzzy : budgets;
        }
    }

    const budgetMonth = dateCtx.tMonth ?? currentMonth;
    const budgetYear  = dateCtx.tYear  ?? currentYear;

    const scored = relevantBudgets.map(b => {
        const spent = expenses
            .filter(exp => {
                if (exp.category !== b.category) return false;
                const ds = exp.date.includes('T') ? exp.date.split('T')[0] : exp.date;
                const [y, mo] = ds.split('-').map(Number);
                if (b.period === 'monthly') return y === budgetYear && mo === budgetMonth;
                if (b.period === 'yearly')  return y === budgetYear;
                return new Date(ds) >= new Date(new Date(today).setDate(today.getDate() - 7));
            })
            .reduce((s, e) => s + Number(e.amount), 0);
        const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
        return { b, spent, pct };
    }).sort((a, z) => z.pct - a.pct);

    const lines = scored.map(({ b, spent, pct }) => {
        const status = pct >= 100 ? m.budgetStatusOver : pct >= 80 ? m.budgetStatusNear : m.budgetStatusOk;
        return `• ${b.category}: ${spent.toFixed(2)}€ / ${b.limit.toFixed(2)}€ (${pct}%) ${status}`;
    });
    return `${m.budgetStatusHeader}\n${lines.join('\n')}`;
}

export function handleMostFrequent(ctx: QueryContext): string {
    const { m, filteredExpenses, dateResultStr } = ctx;
    if (filteredExpenses.length === 0) return m.noExpenses(dateResultStr);

    const counts: Record<string, number> = {};
    for (const e of filteredExpenses) counts[e.category] = (counts[e.category] ?? 0) + 1;
    const lines = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, n]) => m.mostUsedLine(cat, n))
        .join('\n');
    return `${m.mostUsedHeader(dateResultStr)}\n${lines}`;
}

export function handleDistinctCategories(ctx: QueryContext): string {
    const { m, filteredExpenses, dateResultStr } = ctx;
    const cats = new Set(filteredExpenses.map(e => e.category));
    if (cats.size === 0) return m.noExpenses(dateResultStr);
    return m.distinctCategories(cats.size, dateResultStr, [...cats].join(', '));
}

export function handlePercentage(ctx: QueryContext): string {
    const { m, targetCategory, expenses, filterByDate, totalSpent, catStr, dateResultStr } = ctx;
    if (targetCategory === 'ALL') return m.percentageNeedsCategory;
    const allTotal = expenses.filter(filterByDate).reduce((s, e) => s + Number(e.amount), 0);
    if (allTotal === 0) return m.noExpensesShort(dateResultStr);
    const pct = Math.round((totalSpent / allTotal) * 100);
    return m.percentageResult(catStr, pct, dateResultStr, totalSpent.toFixed(2), allTotal.toFixed(2));
}

export function handleDuplicates(ctx: QueryContext): string {
    const { m, filteredExpenses, dateResultStr } = ctx;
    const groups: Record<string, number> = {};
    for (const e of filteredExpenses) {
        const key = `${e.date.split('T')[0]}_${e.category}_${Number(e.amount).toFixed(2)}`;
        groups[key] = (groups[key] ?? 0) + 1;
    }
    const dupes = Object.entries(groups).filter(([, n]) => n > 1);
    if (dupes.length === 0) return m.noDuplicates(dateResultStr);
    const lines = dupes.map(([key, n]) => {
        const [date, cat, amount] = key.split('_');
        return m.duplicateLine(amount, cat, date, n);
    }).join('\n');
    return `${m.duplicatesHeader(dupes.length, dateResultStr)}\n${lines}`;
}

export function handleRoundAmounts(ctx: QueryContext): string {
    const { m, filteredExpenses, dateResultStr, fmtD } = ctx;
    const rows = filteredExpenses.slice(0, 10).map(e => m.expenseLine(e.description, Number(e.amount).toFixed(2), fmtD(e.date))).join('\n');
    const more = filteredExpenses.length > 10 ? m.listMore(filteredExpenses.length - 10) : '';
    return `${m.roundHeader(filteredExpenses.length, dateResultStr)}\n${rows}${more}`;
}

export function handleCount(ctx: QueryContext): string {
    const { m, filteredExpenses, catStr, dateResultStr } = ctx;
    return m.countResult(filteredExpenses.length, catStr, dateResultStr);
}

export function handleMax(ctx: QueryContext): string {
    const { m, filteredExpenses, targetCategory, dateResultStr } = ctx;
    const maxExp = filteredExpenses.reduce((a, b) => Number(a.amount) >= Number(b.amount) ? a : b);
    const catInfo = targetCategory === 'ALL' ? m.maxCatInfo(maxExp.category) : '';
    return m.maxResult(dateResultStr, maxExp.description, Number(maxExp.amount).toFixed(2), catInfo);
}

export function handleAverage(ctx: QueryContext): string {
    const { m, norm, filteredExpenses, totalSpent, catStr, dateResultStr, dateCtx } = ctx;
    const { tMonth, tYear, minDate, maxDate } = dateCtx;

    const isDaily   = /\b(?:daily|per day|por dia|diario|diaria|media diaria)\b/.test(norm);
    const isWeekly  = /\b(?:weekly|per week|por semana|semanal|media semanal)\b/.test(norm);
    const isMonthly = /\b(?:monthly|per month|por mes|mensal|media mensal)\b/.test(norm);
    const isYearly  = /\b(?:yearly|annual|per year|por ano|anual|media anual)\b/.test(norm);

    if (isDaily || isWeekly || isMonthly || isYearly) {
        const periodDays = (() => {
            if (minDate && maxDate)
                return Math.round((new Date(maxDate).getTime() - new Date(minDate).getTime()) / 86_400_000) + 1;
            if (tMonth && tYear) return new Date(tYear, tMonth, 0).getDate();
            if (tYear) return 365;
            // all-time: usa o intervalo real de datas das despesas
            if (filteredExpenses.length === 0) return 1;
            const dates = filteredExpenses.map(e => new Date(e.date.split('T')[0]).getTime());
            return Math.round((Math.max(...dates) - Math.min(...dates)) / 86_400_000) + 1;
        })();

        let divisor = 1;
        let unit = '';
        if (isDaily)   { divisor = Math.max(1, periodDays);         unit = m.unitDay; }
        if (isWeekly)  { divisor = Math.max(1, periodDays / 7);     unit = m.unitWeek; }
        if (isMonthly) { divisor = Math.max(1, periodDays / 30.44); unit = m.unitMonth; }
        if (isYearly)  { divisor = Math.max(1, periodDays / 365);   unit = m.unitYear; }

        return m.avgPerPeriod(unit, catStr, dateResultStr, (totalSpent / divisor).toFixed(2));
    }

    const avg = totalSpent / filteredExpenses.length;
    return m.avgPerTransaction(catStr, dateResultStr, avg.toFixed(2), filteredExpenses.length);
}

export function handleList(ctx: QueryContext): string {
    const { m, filteredExpenses, catStr, dateResultStr, fmtD } = ctx;
    const sorted = [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const rows = sorted.slice(0, 5).map(e => m.expenseLine(e.description, Number(e.amount).toFixed(2), fmtD(e.date))).join('\n');
    const more = filteredExpenses.length > 5 ? m.listMoreExpenses(filteredExpenses.length - 5) : '';
    return `${m.listHeader(filteredExpenses.length, catStr, dateResultStr)}\n${rows}${more}`;
}

export function handleTotal(ctx: QueryContext): string {
    const { m, totalSpent, catStr, dateResultStr, filteredExpenses } = ctx;
    return m.totalResult(totalSpent.toFixed(2), catStr, dateResultStr, filteredExpenses.length);
}
