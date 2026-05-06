import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initLLM } from '../services/llmService';
import { API_BASE } from '../constants/api';
import type { Expense, RegularTransaction, Budget, BalanceEntry, BudgetUtilEntry, SavingsRateEntry } from '../types';
import { getWeekStart, toLocalDateStr, monthKey, pctOrZero, calcIncome } from '../utils/finance';

export function useDashboard() {
    const navigate = useNavigate();

    const [expenses, setExpenses]                     = useState<Expense[]>([]);
    const [showForm, setShowForm]                     = useState(false);
    const [username, setUsername]                     = useState('');
    const [userId, setUserId]                         = useState('');
    const [categories, setCategories]                 = useState<string[]>([]);
    const [expenseTypes, setExpenseTypes]             = useState<string[]>([]);
    const [currentBalance, setCurrentBalance]         = useState(0);
    const [regularTransactions, setRegularTransactions] = useState<RegularTransaction[]>([]);
    const [budgets, setBudgets]                       = useState<Budget[]>([]);
    const [balanceHistory, setBalanceHistory]         = useState<BalanceEntry[]>([]);
    const [budgetUtilHistory, setBudgetUtilHistory]   = useState<BudgetUtilEntry[]>([]);
    const [savingsRateHistory, setSavingsRateHistory] = useState<SavingsRateEntry[]>([]);
    const [chartPeriod, setChartPeriod]               = useState<'week' | 'month' | 'year'>('week');

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        const storedUserId   = localStorage.getItem('userId');
        initLLM().catch(console.error);

        if (!storedUsername || !storedUserId) {
            navigate('/');
            return;
        }

        setUsername(storedUsername);
        setUserId(storedUserId);

        fetch(`${API_BASE}/expense-config`)
            .then(r => r.json())
            .then(data => { setCategories(data.categories); setExpenseTypes(data.expenseTypes); });

        // carrega despesas + settings em paralelo para calcular o snapshot de uma vez
        Promise.all([
            fetch(`${API_BASE}/expenses/${storedUserId}`).then(r => r.json()),
            fetch(`${API_BASE}/users/${storedUserId}/settings`).then(r => r.json()),
        ]).then(([expenseData, settingsData]: [Expense[], any]) => {
            const balance:      number              = settingsData.currentBalance ?? 0;
            const regularTxns:  RegularTransaction[] = settingsData.regularTransactions ?? [];
            const budgetList:   Budget[]            = settingsData.budgets ?? [];
            const balHist:      BalanceEntry[]      = settingsData.balanceHistory ?? [];
            const budUtilHist:  BudgetUtilEntry[]   = settingsData.budgetUtilHistory ?? [];
            const savRateHist:  SavingsRateEntry[]  = settingsData.savingsRateHistory ?? [];

            setExpenses(expenseData);
            setCurrentBalance(balance);
            setRegularTransactions(regularTxns);
            setBudgets(budgetList);

            const now       = new Date();
            const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const thisKey   = monthKey(now);

            const thisMonthExps     = expenseData.filter(e => { const d = new Date(e.date); return d >= thisStart && d <= now; });
            const monthSpentNow     = thisMonthExps.reduce((s, e) => s + Number(e.amount), 0);
            const monthIncomeNow    = calcIncome(regularTxns, thisStart, now);
            const monthlyBudgets    = budgetList.filter(b => b.period === 'monthly');
            const totalBudgetLimit  = monthlyBudgets.reduce((s, b) => s + b.limit, 0);
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
    }, [navigate]);

    const fetchExpenses = async (id: string) => {
        const res = await fetch(`${API_BASE}/expenses/${id}`);
        if (res.ok) setExpenses(await res.json());
    };

    // ── Derivações ────────────────────────────────────────────────────────────

    const today          = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(today.getFullYear(), today.getMonth(), 0);

    const thisMonthExpenses = expenses.filter(e => { const d = new Date(e.date); return d >= thisMonthStart && d <= today; });
    const lastMonthExpenses = expenses.filter(e => { const d = new Date(e.date); return d >= lastMonthStart && d <= lastMonthEnd; });

    const monthSpent      = thisMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const monthIncome     = calcIncome(regularTransactions, thisMonthStart, today);
    const lastMonthSpent  = lastMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const lastMonthIncome = calcIncome(regularTransactions, lastMonthStart, lastMonthEnd);

    const lastMonthKey    = monthKey(lastMonthStart);
    const lastBalEntry    = balanceHistory.find(h => h.month === lastMonthKey);

    const balanceChange   = pctOrZero(currentBalance, lastBalEntry?.balance);
    const balancePositive = lastBalEntry != null ? currentBalance >= lastBalEntry.balance : true;
    const incomeChange    = pctOrZero(monthIncome, lastMonthIncome || null);
    const incomePositive  = monthIncome >= lastMonthIncome;
    const spentChange     = pctOrZero(monthSpent, lastMonthSpent || null);
    const spentPositive   = monthSpent <= lastMonthSpent;

    const todayStr     = toLocalDateStr(today);
    const weekStartStr = toLocalDateStr(getWeekStart(today));

    const chartData = (() => {
        if (chartPeriod === 'week') {
            const data = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(n => ({ name: n, value: 0 }));
            expenses.forEach(exp => {
                const d = new Date(exp.date);
                const s = toLocalDateStr(d);
                if (s >= weekStartStr && s <= todayStr) data[(d.getDay() + 6) % 7].value += Number(exp.amount);
            });
            return data;
        }
        if (chartPeriod === 'month') {
            const data = ['Week 1','Week 2','Week 3','Week 4','Week 5'].map(n => ({ name: n, value: 0 }));
            expenses.forEach(exp => {
                const d = new Date(exp.date);
                if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear())
                    data[Math.min(Math.floor((d.getDate() - 1) / 7), 4)].value += Number(exp.amount);
            });
            return data;
        }
        const data = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(n => ({ name: n, value: 0 }));
        expenses.forEach(exp => {
            const d = new Date(exp.date);
            if (d.getFullYear() === today.getFullYear()) data[d.getMonth()].value += Number(exp.amount);
        });
        return data;
    })();

    const highlightIndex =
        chartPeriod === 'week'  ? (today.getDay() + 6) % 7 :
        chartPeriod === 'month' ? Math.min(Math.floor((today.getDate() - 1) / 7), 4) :
        today.getMonth();

    const daysElapsed        = Math.max(1, today.getDate());
    const lastMonthDays      = lastMonthEnd.getDate();
    const avgDailySpend      = monthSpent / daysElapsed;
    const lastAvgDailySpend  = lastMonthSpent / lastMonthDays;
    const avgDailyChange     = pctOrZero(avgDailySpend, lastMonthSpent > 0 ? lastAvgDailySpend : null);

    const largestExpense     = thisMonthExpenses.length > 0 ? Math.max(...thisMonthExpenses.map(e => Number(e.amount))) : 0;
    const lastLargestExpense = lastMonthExpenses.length > 0 ? Math.max(...lastMonthExpenses.map(e => Number(e.amount))) : null;
    const largestChange      = pctOrZero(largestExpense, lastLargestExpense);

    const monthlyBudgets     = budgets.filter(b => b.period === 'monthly');
    const totalBudgetLimit   = monthlyBudgets.reduce((s, b) => s + b.limit, 0);
    const thisBudgetSpent    = monthlyBudgets.reduce((s, b) =>
        s + thisMonthExpenses.filter(e => e.category === b.category).reduce((c, e) => c + Number(e.amount), 0), 0);

    const budgetUtilization  = totalBudgetLimit > 0 ? Math.round(thisBudgetSpent / totalBudgetLimit * 100) : null;
    const lastBudUtilEntry   = budgetUtilHistory.find(h => h.month === lastMonthKey);
    const budgetUtilChange   = budgetUtilization !== null ? pctOrZero(budgetUtilization, lastBudUtilEntry?.utilization ?? null) : null;

    const savingsRate        = monthIncome > 0 ? Math.round((monthIncome - monthSpent) / monthIncome * 100) : null;
    const lastSavEntry       = savingsRateHistory.find(h => h.month === lastMonthKey);
    const savingsRateChange  = savingsRate !== null ? pctOrZero(savingsRate, lastSavEntry?.rate ?? null) : null;

    const recentTransactions = [...expenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return {
        expenses, showForm, setShowForm, username, userId,
        categories, expenseTypes, currentBalance,
        chartPeriod, setChartPeriod,
        fetchExpenses,
        monthSpent, monthIncome,
        balanceChange, balancePositive,
        incomeChange, incomePositive,
        spentChange, spentPositive,
        chartData, highlightIndex,
        avgDailySpend, avgDailyChange,
        largestExpense, largestChange,
        budgetUtilization, budgetUtilChange,
        savingsRate, savingsRateChange,
        recentTransactions,
    };
}
