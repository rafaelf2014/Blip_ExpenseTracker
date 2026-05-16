import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../constants/api';
import type { Expense, RegularTransaction } from '../types';
import { getWeekStart, toLocalDateStr, calcIncome } from '../utils/finance';

function incomeForPeriod(regularTransactions: RegularTransaction[], filterTime: string): number {
    const today = new Date();
    let start: Date;
    if (filterTime === 'week')       start = getWeekStart(today);
    else if (filterTime === 'month') start = new Date(today.getFullYear(), today.getMonth(), 1);
    else if (filterTime === 'year')  start = new Date(today.getFullYear(), 0, 1);
    else                             start = new Date(0);
    return calcIncome(regularTransactions, start, today);
}

export function useTransactions() {
    const navigate = useNavigate();

    const [username, setUsername]                       = useState('');
    const [userId, setUserId]                           = useState('');
    const [showForm, setShowForm]                       = useState(false);
    const [categories, setCategories]                   = useState<string[]>([]);
    const [expenseTypes, setExpenseTypes]               = useState<string[]>([]);
    const [expenses, setExpenses]                       = useState<Expense[]>([]);
    const [regularTransactions, setRegularTransactions] = useState<RegularTransaction[]>([]);

    const [searchTerm, setSearchTerm]         = useState('');
    const [showFilters, setShowFilters]       = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterType, setFilterType]         = useState('');
    const [filterTime, setFilterTime]         = useState('');
    const [filterMin, setFilterMin]           = useState('');
    const [filterMax, setFilterMax]           = useState('');

    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        const storedUserId   = localStorage.getItem('userId');

        if (!storedUsername || !storedUserId) {
            navigate('/');
        } else {
            setUsername(storedUsername);
            setUserId(storedUserId);
            fetchExpenses(storedUserId);

            fetch(`${API_BASE}/expense-config`)
                .then(res => res.json())
                .then(data => { setCategories(data.categories); setExpenseTypes(data.expenseTypes); });

            fetch(`${API_BASE}/users/${storedUserId}/settings`)
                .then(res => res.json())
                .then(data => setRegularTransactions(data.regularTransactions ?? []))
                .catch(console.error);
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('username');
        navigate('/');
    };

    const fetchExpenses = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/expenses/${id}`);
            if (res.ok) setExpenses(await res.json());
        } catch (err) {
            console.error('Erro ao carregar despesas:', err);
        }
    };

    const handleUpdateExpense = async (id: string, updatedData: Omit<Expense, 'id'>) => {
        await fetch(`${API_BASE}/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });
        setEditingExpense(null);
        fetchExpenses(userId);
    };

    const handleDeleteExpense = async (id: string) => {
        await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
        setEditingExpense(null);
        fetchExpenses(userId);
    };


    const applyTimeFilter = (expense: Expense): boolean => {
        if (filterTime === '') return true;
        const today  = new Date();
        const expStr = toLocalDateStr(new Date(expense.date));
        if (filterTime === 'week')
            return expStr >= toLocalDateStr(getWeekStart(today)) && expStr <= toLocalDateStr(today);
        if (filterTime === 'month') {
            const d = new Date(expense.date);
            return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        }
        if (filterTime === 'year')
            return new Date(expense.date).getFullYear() === today.getFullYear();
        return true;
    };

    const filteredExpenses = expenses.filter(e => {
        const matchesSearch   = e.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === '' || e.category === filterCategory;
        const matchesType     = filterType === '' || e.type === filterType;
        const amount          = Number(e.amount);
        const matchesMin      = filterMin === '' || amount >= Number(filterMin);
        const matchesMax      = filterMax === '' || amount <= Number(filterMax);
        return matchesSearch && matchesCategory && matchesType && matchesMin && matchesMax && applyTimeFilter(e);
    });

    // cartões de resumo usam só o filtro de tempo (não pesquisa/categoria/valor)
    const timeFilteredExpenses = expenses.filter(applyTimeFilter);

    const periodLabel     = filterTime === 'week' ? 'Weekly' : filterTime === 'month' ? 'Monthly' : filterTime === 'year' ? 'Yearly' : '';
    const displayedSpent  = timeFilteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const displayedIncome = incomeForPeriod(regularTransactions, filterTime);
    const netBalance      = displayedIncome - displayedSpent;

    return {
        username, userId,
        showForm, setShowForm,
        categories, expenseTypes,
        expenses, filteredExpenses,
        searchTerm, setSearchTerm,
        showFilters, setShowFilters,
        filterCategory, setFilterCategory,
        filterType, setFilterType,
        filterTime, setFilterTime,
        filterMin, setFilterMin,
        filterMax, setFilterMax,
        editingExpense, setEditingExpense,
        fetchExpenses,
        handleLogout,
        handleUpdateExpense,
        handleDeleteExpense,
        periodLabel, displayedSpent, displayedIncome, netBalance,
    };
}
