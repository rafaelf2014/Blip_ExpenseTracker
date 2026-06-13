import { useEffect, useState, useMemo } from 'react';
import { API_BASE } from '../constants/api';
import type { Expense, Budget, BalanceEntry, BudgetUtilEntry, SavingsRateEntry } from '../types';
import { getWeekStart, toLocalDateStr, monthKey, pctOrZero, computeMonthlyMetrics, sumSpent, sumIncome, computeBalance } from '../utils/finance';
import { syncRecurring, fetchExpenses as apiFetchExpenses, fetchUserSettings, fetchExpenseConfig } from '../services/api';

export function useDashboard() {
    const [expenses, setExpenses]                       = useState<Expense[]>([]);
    const [showForm, setShowForm]                       = useState(false);
    const [username, setUsername]                       = useState('');
    const [userId, setUserId]                           = useState('');
    const [categories, setCategories]                   = useState<string[]>([]);
    const [expenseTypes, setExpenseTypes]               = useState<string[]>([]);
    const [currentBalance, setCurrentBalance]           = useState(0);
    const [budgets, setBudgets]                         = useState<Budget[]>([]);
    const [balanceHistory, setBalanceHistory]           = useState<BalanceEntry[]>([]);
    const [budgetUtilHistory, setBudgetUtilHistory]     = useState<BudgetUtilEntry[]>([]);
    const [savingsRateHistory, setSavingsRateHistory]   = useState<SavingsRateEntry[]>([]);
    const [chartPeriod, setChartPeriod]                 = useState<'week' | 'month' | 'year'>('week');

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        const storedUserId   = localStorage.getItem('userId');
        if (!storedUsername || !storedUserId) return;

        setUsername(storedUsername);
        setUserId(storedUserId);

        fetchExpenseConfig().then(cfg => { setCategories(cfg.categories); setExpenseTypes(cfg.expenseTypes); });

        // Cria os recorrentes em atraso antes de ler a lista de despesas.
        syncRecurring(storedUserId)
            .then(() => Promise.all([apiFetchExpenses(storedUserId), fetchUserSettings(storedUserId)]))
            .then(([expenseData, settings]) => {
            const { currentBalance: balance, budgets: budgetList,
                    balanceHistory: balHist, budgetUtilHistory: budUtilHist, savingsRateHistory: savRateHist } = settings;

            setExpenses(expenseData);
            setCurrentBalance(balance);
            setBudgets(budgetList);

            const now      = new Date();
            const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const thisKey   = monthKey(now);

            const thisMonthExps = expenseData.filter(e => { const d = new Date(e.date); return d >= thisStart && d <= now; });
            const { budgetUtilization, savingsRate } = computeMonthlyMetrics(thisMonthExps, budgetList);
            const budgetUtil = budgetUtilization ?? 0;
            const savRate    = savingsRate ?? 0;
            const computedBalance = computeBalance(balance, expenseData);

            const newBalHist     = [...balHist.filter(h => h.month !== thisKey),     { month: thisKey, balance: computedBalance }];
            const newBudUtilHist = [...budUtilHist.filter(h => h.month !== thisKey), { month: thisKey, utilization: budgetUtil }];
            const newSavRateHist = [...savRateHist.filter(h => h.month !== thisKey), { month: thisKey, rate: savRate }];

            setBalanceHistory(newBalHist);
            setBudgetUtilHistory(newBudUtilHist);
            setSavingsRateHistory(newSavRateHist);

            fetch(`${API_BASE}/users/${storedUserId}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ balanceHistory: newBalHist, budgetUtilHistory: newBudUtilHist, savingsRateHistory: newSavRateHist }),
            }).catch(console.error);
        }).catch(console.error);
    }, []);

    const fetchExpenses = async (id: string) => {
        setExpenses(await apiFetchExpenses(id));
    };

    useEffect(() => {
        if (!userId) return;
        const handler = () => fetchExpenses(userId);
        window.addEventListener('blip:expense-added', handler);
        return () => window.removeEventListener('blip:expense-added', handler);
    }, [userId]);

    // Mês: filtros, totais de gasto/rendimento e as variações dos cartões.
    const monthData = useMemo(() => {
        const today          = new Date();
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd   = new Date(today.getFullYear(), today.getMonth(), 0);
        const lastMonthKey   = monthKey(lastMonthStart);

        const thisMonthExpenses = expenses.filter(e => { const d = new Date(e.date); return d >= thisMonthStart && d <= today; });
        const lastMonthExpenses = expenses.filter(e => { const d = new Date(e.date); return d >= lastMonthStart && d <= lastMonthEnd; });

        // Gasto = valores positivos; rendimento = negativos (linhas de rendimento recorrente).
        const monthSpent      = sumSpent(thisMonthExpenses);
        const monthIncome     = sumIncome(thisMonthExpenses);
        const lastMonthSpent  = sumSpent(lastMonthExpenses);
        const lastMonthIncome = sumIncome(lastMonthExpenses);
        const lastMonthDays   = lastMonthEnd.getDate();

        // Saldo total = saldo inicial + o líquido de todas as transações até agora.
        const balance         = computeBalance(currentBalance, expenses);
        const lastBalEntry    = balanceHistory.find(h => h.month === lastMonthKey);
        const balanceChange   = pctOrZero(balance, lastBalEntry?.balance);
        const balancePositive = lastBalEntry != null ? balance >= lastBalEntry.balance : true;
        const incomeChange    = pctOrZero(monthIncome, lastMonthIncome || null);
        const incomePositive  = monthIncome >= lastMonthIncome;
        const spentChange     = pctOrZero(monthSpent, lastMonthSpent || null);
        const spentPositive   = monthSpent <= lastMonthSpent;

        return {
            today, thisMonthStart, lastMonthKey, lastMonthDays,
            thisMonthExpenses, lastMonthExpenses,
            monthSpent, monthIncome, lastMonthSpent,
            balance,
            balanceChange, balancePositive,
            incomeChange, incomePositive,
            spentChange, spentPositive,
        };
    }, [expenses, currentBalance, balanceHistory]);

    // Dados do gráfico e o índice da barra a destacar.
    const { chartData, highlightIndex } = useMemo(() => {
        const today        = new Date();
        const todayStr     = toLocalDateStr(today);
        const weekStartStr = toLocalDateStr(getWeekStart(today));

        // O gráfico só mostra gastos, por isso ignora as linhas de rendimento (negativas).
        const spend = (exp: Expense) => Math.max(0, Number(exp.amount));

        if (chartPeriod === 'week') {
            const data = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(n => ({ name: n, value: 0 }));
            expenses.forEach(exp => {
                const d = new Date(exp.date);
                const s = toLocalDateStr(d);
                if (s >= weekStartStr && s <= todayStr) data[(d.getDay() + 6) % 7].value += spend(exp);
            });
            return { chartData: data, highlightIndex: (today.getDay() + 6) % 7 };
        }

        if (chartPeriod === 'month') {
            const data = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map(n => ({ name: n, value: 0 }));
            expenses.forEach(exp => {
                const d = new Date(exp.date);
                if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear())
                    data[Math.min(Math.floor((d.getDate() - 1) / 7), 4)].value += spend(exp);
            });
            return { chartData: data, highlightIndex: Math.min(Math.floor((today.getDate() - 1) / 7), 4) };
        }

        const data = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(n => ({ name: n, value: 0 }));
        expenses.forEach(exp => {
            const d = new Date(exp.date);
            if (d.getFullYear() === today.getFullYear()) data[d.getMonth()].value += spend(exp);
        });
        return { chartData: data, highlightIndex: today.getMonth() };
    }, [expenses, chartPeriod]);

    // Quick stats e as métricas de orçamento/poupança.
    const quickStats = useMemo(() => {
        const { today, lastMonthKey, lastMonthDays, thisMonthExpenses, lastMonthExpenses, monthSpent, lastMonthSpent } = monthData;

        const daysElapsed       = Math.max(1, today.getDate());
        const avgDailySpend     = monthSpent / daysElapsed;
        const lastAvgDailySpend = lastMonthSpent / lastMonthDays;
        const avgDailyChange    = pctOrZero(avgDailySpend, lastMonthSpent > 0 ? lastAvgDailySpend : null);

        // Maior despesa única — só gastos (ignora rendimento).
        const spends = (rows: typeof thisMonthExpenses) => rows.map(e => Number(e.amount)).filter(a => a > 0);
        const thisSpends = spends(thisMonthExpenses);
        const lastSpends = spends(lastMonthExpenses);
        const largestExpense     = thisSpends.length > 0 ? Math.max(...thisSpends) : 0;
        const lastLargestExpense = lastSpends.length > 0 ? Math.max(...lastSpends) : null;
        const largestChange      = pctOrZero(largestExpense, lastLargestExpense);

        const { budgetUtilization, savingsRate } = computeMonthlyMetrics(thisMonthExpenses, budgets);

        const lastBudUtilEntry  = budgetUtilHistory.find(h => h.month === lastMonthKey);
        const budgetUtilChange  = budgetUtilization !== null ? pctOrZero(budgetUtilization, lastBudUtilEntry?.utilization ?? null) : null;

        const lastSavEntry      = savingsRateHistory.find(h => h.month === lastMonthKey);
        const savingsRateChange = savingsRate !== null ? pctOrZero(savingsRate, lastSavEntry?.rate ?? null) : null;

        return { avgDailySpend, avgDailyChange, largestExpense, largestChange, budgetUtilization, budgetUtilChange, savingsRate, savingsRateChange };
    }, [monthData, budgets, budgetUtilHistory, savingsRateHistory]);

    // Transações recentes.
    const recentTransactions = useMemo(() =>
        [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
        [expenses]
    );

    return {
        expenses, showForm, setShowForm, username, userId,
        categories, expenseTypes,
        currentBalance: monthData.balance,   // calculado: saldo inicial + líquido de tudo
        chartPeriod, setChartPeriod,
        fetchExpenses,
        chartData, highlightIndex,
        recentTransactions,
        // Totais e variações mensais (cartões de resumo)
        summary: {
            monthSpent:      monthData.monthSpent,
            monthIncome:     monthData.monthIncome,
            balanceChange:   monthData.balanceChange,
            balancePositive: monthData.balancePositive,
            incomeChange:    monthData.incomeChange,
            incomePositive:  monthData.incomePositive,
            spentChange:     monthData.spentChange,
            spentPositive:   monthData.spentPositive,
        },
        // Caixa "Quick Stats"
        quickStats,
    };
}
