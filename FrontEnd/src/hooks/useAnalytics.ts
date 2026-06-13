import { useState, useEffect } from 'react';
import type { Expense, CategoryDatum, TrendDatum } from '../types';
import { makeExpenseFilter, sumIncome } from '../utils/finance';
import { syncRecurring, fetchExpenses, fetchExpenseConfig } from '../services/api';

const COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1', '#64748b'];

export function useAnalytics() {
    const [categoryData, setCategoryData] = useState<CategoryDatum[]>([]);
    const [trendData, setTrendData]       = useState<TrendDatum[]>([]);
    const [stats, setStats] = useState({
        avgMonthlyIncome:  0,
        avgMonthlyExpense: 0,
        avgDaily:          0,
        topCategory:       'N/A',
    });

    const [rawExpenses, setRawExpenses]                 = useState<Expense[]>([]);
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
            syncRecurring(storedUserId)
                .then(() => fetchExpenses(storedUserId))
                .then(setRawExpenses)
                .catch(err => console.error('Erro ao carregar analytics:', err));
        }
        fetchExpenseConfig().then(cfg => { setCategories(cfg.categories); setExpenseTypes(cfg.expenseTypes); });
    }, []);

    useEffect(() => {
        const today    = new Date();
        const filtered = rawExpenses.filter(
            makeExpenseFilter({ searchTerm, filterCategory, filterType, filterTime, filterMin, filterMax })
        );

        const totalIncome = sumIncome(filtered);

        let totalExpense = 0;
        const categoryTotals: Record<string, number> = {};
        const monthlyData: Record<string, { income: number; expenses: number; label: string }> = {};

        filtered.forEach(exp => {
            const amount = Number(exp.amount);
            const spend  = Math.max(0, amount);   // só gastos, para os totais por categoria/despesa
            const income = Math.max(0, -amount);  // as linhas de rendimento têm valor negativo
            const d      = new Date(exp.date);
            const key    = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label  = d.toLocaleString('default', { month: 'short' });
            if (!monthlyData[key]) monthlyData[key] = { income: 0, expenses: 0, label };
            totalExpense += spend;
            monthlyData[key].expenses += spend;
            monthlyData[key].income   += income;
            if (spend > 0) categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + spend;
        });

        const newCategoryData = Object.keys(categoryTotals)
            .map((key, i) => ({ name: key, value: Number(categoryTotals[key].toFixed(2)), color: COLORS[i % COLORS.length] }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);

        const newTrendData = Object.keys(monthlyData)
            .sort()
            .map(key => ({
                month:    monthlyData[key].label,
                income:   Number(monthlyData[key].income.toFixed(2)),
                expenses: Number(monthlyData[key].expenses.toFixed(2)),
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

    }, [rawExpenses, searchTerm, filterCategory, filterType, filterTime, filterMin, filterMax]);

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
