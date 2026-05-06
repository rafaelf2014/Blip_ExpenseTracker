import { useState, useEffect } from 'react';
import { API_BASE } from '../constants/api';
import type { Expense, RegularTransaction } from '../types';
import { getWeekStart, toLocalDateStr, calcIncome } from '../utils/finance';

const COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1', '#64748b'];

export function useAnalytics() {
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [trendData, setTrendData]       = useState<any[]>([]);
    const [stats, setStats] = useState({
        avgMonthlyIncome:  0,
        avgMonthlyExpense: 0,
        avgDaily:          0,
        topCategory:       'N/A',
    });

    const [rawExpenses, setRawExpenses]                 = useState<Expense[]>([]);
    const [regularTransactions, setRegularTransactions] = useState<RegularTransaction[]>([]);
    const [categories, setCategories]                   = useState<string[]>([]);
    const [expenseTypes, setExpenseTypes]               = useState<string[]>([]);

    const [searchTerm, setSearchTerm]         = useState('');
    const [showFilters, setShowFilters]       = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterType, setFilterType]         = useState('');
    const [filterTime, setFilterTime]         = useState('');
    const [filterMin, setFilterMin]           = useState('');
    const [filterMax, setFilterMax]           = useState('');

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            fetch(`${API_BASE}/expenses/${storedUserId}`)
                .then(res => res.json())
                .then(data => setRawExpenses(data))
                .catch(err => console.error('Erro ao carregar analytics:', err));
            fetch(`${API_BASE}/users/${storedUserId}/settings`)
                .then(res => res.json())
                .then(data => setRegularTransactions(data.regularTransactions ?? []))
                .catch(console.error);
        }
        fetch(`${API_BASE}/expense-config`)
            .then(res => res.json())
            .then(data => { setCategories(data.categories); setExpenseTypes(data.expenseTypes); });
    }, []);

    useEffect(() => {
        const today        = new Date();
        const todayStr     = toLocalDateStr(today);
        const weekStartStr = toLocalDateStr(getWeekStart(today));

        const filtered = rawExpenses.filter(e => {
            const matchesSearch   = e.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === '' || e.category === filterCategory;
            const matchesType     = filterType === '' || e.type === filterType;
            const amount          = Number(e.amount);
            const matchesMin      = filterMin === '' || amount >= Number(filterMin);
            const matchesMax      = filterMax === '' || amount <= Number(filterMax);

            let matchesTime = true;
            if (filterTime !== '') {
                const expStr = toLocalDateStr(new Date(e.date));
                if (filterTime === 'week')
                    matchesTime = expStr >= weekStartStr && expStr <= todayStr;
                else if (filterTime === 'month') {
                    const d = new Date(e.date);
                    matchesTime = d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
                } else if (filterTime === 'year')
                    matchesTime = new Date(e.date).getFullYear() === today.getFullYear();
            }
            return matchesSearch && matchesCategory && matchesType && matchesMin && matchesMax && matchesTime;
        });

        let periodStart: Date;
        if (filterTime === 'week')       periodStart = getWeekStart(today);
        else if (filterTime === 'month') periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
        else if (filterTime === 'year')  periodStart = new Date(today.getFullYear(), 0, 1);
        else {
            const earliest = rawExpenses.reduce((min, e) => Math.min(min, new Date(e.date).getTime()), Infinity);
            periodStart = isFinite(earliest) ? new Date(earliest) : new Date(0);
        }
        const totalIncome = calcIncome(regularTransactions, periodStart, today);

        // ── processa dados dos gráficos ───────────────────────────────────────

        let totalExpense = 0;
        const categoryTotals: Record<string, number> = {};
        const monthlyData: Record<string, { income: number; expenses: number }> = {};

        filtered.forEach(exp => {
            const amount = Number(exp.amount);
            const month  = new Date(exp.date).toLocaleString('default', { month: 'short' });
            if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0 };
            totalExpense += amount;
            monthlyData[month].expenses += amount;
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amount;
        });

        const newCategoryData = Object.keys(categoryTotals)
            .map((key, i) => ({ name: key, value: Number(categoryTotals[key].toFixed(2)), color: COLORS[i % COLORS.length] }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);

        const newTrendData = Object.keys(monthlyData).map(month => ({
            month,
            income:   Number(monthlyData[month].income.toFixed(2)),
            expenses: Number(monthlyData[month].expenses.toFixed(2)),
        }));

        let numDays: number, numMonths: number;
        if (filterTime === 'week') {
            numDays = 7; numMonths = 1;
        } else if (filterTime === 'month') {
            numDays = today.getDate(); numMonths = 1;
        } else if (filterTime === 'year') {
            const yearStart = new Date(today.getFullYear(), 0, 1);
            numDays   = Math.ceil((today.getTime() - yearStart.getTime()) / 86400000) + 1;
            numMonths = today.getMonth() + 1;
        } else {
            numDays = filtered.length > 0
                ? Math.ceil((today.getTime() - filtered.reduce((min, e) => Math.min(min, new Date(e.date).getTime()), Infinity)) / 86400000) + 1
                : 1;
            numMonths = Object.keys(monthlyData).length || 1;
        }

        const avgDaily          = totalExpense / Math.max(numDays, 1);
        const avgMonthlyExpense = filterTime === 'week' ? totalExpense * 4 : totalExpense / Math.max(numMonths, 1);
        const avgMonthlyIncome  = filterTime === 'week' ? totalIncome  * 4 : totalIncome  / Math.max(numMonths, 1);

        setCategoryData(newCategoryData);
        setTrendData(newTrendData);
        setStats({ avgMonthlyIncome, avgMonthlyExpense, avgDaily, topCategory: newCategoryData[0]?.name ?? 'N/A' });

    }, [rawExpenses, regularTransactions, searchTerm, filterCategory, filterType, filterTime, filterMin, filterMax]);

    return {
        categoryData, trendData, stats,
        categories, expenseTypes,
        searchTerm, setSearchTerm,
        showFilters, setShowFilters,
        filterCategory, setFilterCategory,
        filterType, setFilterType,
        filterTime, setFilterTime,
        filterMin, setFilterMin,
        filterMax, setFilterMax,
    };
}
