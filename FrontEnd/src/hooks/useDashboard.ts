import { useEffect, useState, useMemo } from 'react';
import { API_BASE } from '../constants/api';
import type { Expense, RegularTransaction, Budget, BalanceEntry, BudgetUtilEntry, SavingsRateEntry } from '../types';
import { getWeekStart, toLocalDateStr, monthKey, pctOrZero, calcIncome } from '../utils/finance';

export function useDashboard() {
    const [expenses, setExpenses]                       = useState<Expense[]>([]);
    const [showForm, setShowForm]                       = useState(false);
    const [username, setUsername]                       = useState('');
    const [userId, setUserId]                           = useState('');
    const [categories, setCategories]                   = useState<string[]>([]);
    const [expenseTypes, setExpenseTypes]               = useState<string[]>([]);
    const [currentBalance, setCurrentBalance]           = useState(0);
    const [regularTransactions, setRegularTransactions] = useState<RegularTransaction[]>([]);
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

        fetch(`${API_BASE}/expense-config`)
            .then(r => r.json())
            .then(data => { setCategories(data.categories); setExpenseTypes(data.expenseTypes); });

        Promise.all([
            fetch(`${API_BASE}/expenses/${storedUserId}`).then(r => r.json()),
            fetch(`${API_BASE}/users/${storedUserId}/settings`).then(r => r.json()),
        ]).then(([expenseData, settingsData]: [Expense[], any]) => {
            const balance:       number               = settingsData.currentBalance ?? 0;
            const regularTxns:   RegularTransaction[] = settingsData.regularTransactions ?? [];
            const budgetList:    Budget[]             = settingsData.budgets ?? [];
            const balHist:       BalanceEntry[]       = settingsData.balanceHistory ?? [];
            const budUtilHist:   BudgetUtilEntry[]    = settingsData.budgetUtilHistory ?? [];
            const savRateHist:   SavingsRateEntry[]   = settingsData.savingsRateHistory ?? [];

            setExpenses(expenseData);
            setCurrentBalance(balance);
            setRegularTransactions(regularTxns);
            setBudgets(budgetList);

            const now      = new Date();
            const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const thisKey   = monthKey(now);

            const thisMonthExps      = expenseData.filter(e => { const d = new Date(e.date); return d >= thisStart && d <= now; });
            const monthSpentNow      = thisMonthExps.reduce((s, e) => s + Number(e.amount), 0);
            const monthIncomeNow     = calcIncome(regularTxns, thisStart, now);
            const monthlyBudgets     = budgetList.filter(b => b.period === 'monthly');
            const totalBudgetLimit   = monthlyBudgets.reduce((s, b) => s + b.limit, 0);
            const thisBudgetSpentNow = monthlyBudgets.reduce((s, b) =>
                s + thisMonthExps.filter(e => e.category === b.category).reduce((c, e) => c + Number(e.amount), 0), 0);

            const budgetUtil = totalBudgetLimit > 0 ? Math.round(thisBudgetSpentNow / totalBudgetLimit * 100) : 0;
            const savRate    = monthIncomeNow > 0 ? Math.round((monthIncomeNow - monthSpentNow) / monthIncomeNow * 100) : 0;

            const newBalHist     = [...balHist.filter(h => h.month !== thisKey),     { month: thisKey, balance }];
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
        const res = await fetch(`${API_BASE}/expenses/${id}`);
        if (res.ok) setExpenses(await res.json());
    };

    useEffect(() => {
        if (!userId) return;
        const handler = () => fetchExpenses(userId);
        window.addEventListener('blip:expense-added', handler);
        return () => window.removeEventListener('blip:expense-added', handler);
    }, [userId]);

    // --- Memo 1: monthly filters, spend/income totals, and change pills ---
    const monthData = useMemo(() => {
        const today          = new Date();
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd   = new Date(today.getFullYear(), today.getMonth(), 0);
        const lastMonthKey   = monthKey(lastMonthStart);

        const thisMonthExpenses = expenses.filter(e => { const d = new Date(e.date); return d >= thisMonthStart && d <= today; });
        const lastMonthExpenses = expenses.filter(e => { const d = new Date(e.date); return d >= lastMonthStart && d <= lastMonthEnd; });

        const monthSpent      = thisMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
        const monthIncome     = calcIncome(regularTransactions, thisMonthStart, today);
        const lastMonthSpent  = lastMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
        const lastMonthIncome = calcIncome(regularTransactions, lastMonthStart, lastMonthEnd);
        const lastMonthDays   = lastMonthEnd.getDate();

        const lastBalEntry    = balanceHistory.find(h => h.month === lastMonthKey);
        const balanceChange   = pctOrZero(currentBalance, lastBalEntry?.balance);
        const balancePositive = lastBalEntry != null ? currentBalance >= lastBalEntry.balance : true;
        const incomeChange    = pctOrZero(monthIncome, lastMonthIncome || null);
        const incomePositive  = monthIncome >= lastMonthIncome;
        const spentChange     = pctOrZero(monthSpent, lastMonthSpent || null);
        const spentPositive   = monthSpent <= lastMonthSpent;

        return {
            today, lastMonthKey, lastMonthDays,
            thisMonthExpenses, lastMonthExpenses,
            monthSpent, monthIncome, lastMonthSpent,
            balanceChange, balancePositive,
            incomeChange, incomePositive,
            spentChange, spentPositive,
        };
    }, [expenses, regularTransactions, currentBalance, balanceHistory]);

    // --- Memo 2: chart data and highlight index ---
    const { chartData, highlightIndex } = useMemo(() => {
        const today        = new Date();
        const todayStr     = toLocalDateStr(today);
        const weekStartStr = toLocalDateStr(getWeekStart(today));

        if (chartPeriod === 'week') {
            const data = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(n => ({ name: n, value: 0 }));
            expenses.forEach(exp => {
                const d = new Date(exp.date);
                const s = toLocalDateStr(d);
                if (s >= weekStartStr && s <= todayStr) data[(d.getDay() + 6) % 7].value += Number(exp.amount);
            });
            return { chartData: data, highlightIndex: (today.getDay() + 6) % 7 };
        }

        if (chartPeriod === 'month') {
            const data = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map(n => ({ name: n, value: 0 }));
            expenses.forEach(exp => {
                const d = new Date(exp.date);
                if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear())
                    data[Math.min(Math.floor((d.getDate() - 1) / 7), 4)].value += Number(exp.amount);
            });
            return { chartData: data, highlightIndex: Math.min(Math.floor((today.getDate() - 1) / 7), 4) };
        }

        const data = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(n => ({ name: n, value: 0 }));
        expenses.forEach(exp => {
            const d = new Date(exp.date);
            if (d.getFullYear() === today.getFullYear()) data[d.getMonth()].value += Number(exp.amount);
        });
        return { chartData: data, highlightIndex: today.getMonth() };
    }, [expenses, chartPeriod]);

    // --- Memo 3: quick stats and budget/savings metrics ---
    const quickStats = useMemo(() => {
        const { today, lastMonthKey, lastMonthDays, thisMonthExpenses, lastMonthExpenses, monthSpent, lastMonthSpent, monthIncome } = monthData;

        const daysElapsed       = Math.max(1, today.getDate());
        const avgDailySpend     = monthSpent / daysElapsed;
        const lastAvgDailySpend = lastMonthSpent / lastMonthDays;
        const avgDailyChange    = pctOrZero(avgDailySpend, lastMonthSpent > 0 ? lastAvgDailySpend : null);

        const largestExpense     = thisMonthExpenses.length > 0 ? Math.max(...thisMonthExpenses.map(e => Number(e.amount))) : 0;
        const lastLargestExpense = lastMonthExpenses.length > 0 ? Math.max(...lastMonthExpenses.map(e => Number(e.amount))) : null;
        const largestChange      = pctOrZero(largestExpense, lastLargestExpense);

        const monthlyBudgets   = budgets.filter(b => b.period === 'monthly');
        const totalBudgetLimit = monthlyBudgets.reduce((s, b) => s + b.limit, 0);
        const thisBudgetSpent  = monthlyBudgets.reduce((s, b) =>
            s + thisMonthExpenses.filter(e => e.category === b.category).reduce((c, e) => c + Number(e.amount), 0), 0);

        const budgetUtilization = totalBudgetLimit > 0 ? Math.round(thisBudgetSpent / totalBudgetLimit * 100) : null;
        const lastBudUtilEntry  = budgetUtilHistory.find(h => h.month === lastMonthKey);
        const budgetUtilChange  = budgetUtilization !== null ? pctOrZero(budgetUtilization, lastBudUtilEntry?.utilization ?? null) : null;

        const savingsRate       = monthIncome > 0 ? Math.round((monthIncome - monthSpent) / monthIncome * 100) : null;
        const lastSavEntry      = savingsRateHistory.find(h => h.month === lastMonthKey);
        const savingsRateChange = savingsRate !== null ? pctOrZero(savingsRate, lastSavEntry?.rate ?? null) : null;

        return { avgDailySpend, avgDailyChange, largestExpense, largestChange, budgetUtilization, budgetUtilChange, savingsRate, savingsRateChange };
    }, [monthData, budgets, budgetUtilHistory, savingsRateHistory]);

    // --- Memo 4: recent transactions ---
    const recentTransactions = useMemo(() =>
        [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
        [expenses]
    );

    return {
        expenses, showForm, setShowForm, username, userId,
        categories, expenseTypes, currentBalance,
        chartPeriod, setChartPeriod,
        fetchExpenses,
        monthSpent:      monthData.monthSpent,
        monthIncome:     monthData.monthIncome,
        balanceChange:   monthData.balanceChange,
        balancePositive: monthData.balancePositive,
        incomeChange:    monthData.incomeChange,
        incomePositive:  monthData.incomePositive,
        spentChange:     monthData.spentChange,
        spentPositive:   monthData.spentPositive,
        chartData, highlightIndex,
        avgDailySpend:     quickStats.avgDailySpend,
        avgDailyChange:    quickStats.avgDailyChange,
        largestExpense:    quickStats.largestExpense,
        largestChange:     quickStats.largestChange,
        budgetUtilization: quickStats.budgetUtilization,
        budgetUtilChange:  quickStats.budgetUtilChange,
        savingsRate:       quickStats.savingsRate,
        savingsRateChange: quickStats.savingsRateChange,
        recentTransactions,
    };
}
