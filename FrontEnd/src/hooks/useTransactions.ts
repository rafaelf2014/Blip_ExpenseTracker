import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE } from '../constants/api';
import type { Expense } from '../types';
import { makeTimeFilter, makeExpenseFilter, sumSpent, sumIncome } from '../utils/finance';
import { syncRecurring, fetchExpenses as apiFetchExpenses, fetchExpenseConfig } from '../services/api';

export function useTransactions() {
    const navigate = useNavigate();

    const [username, setUsername]                       = useState('');
    const [userId, setUserId]                           = useState('');
    const [showForm, setShowForm]                       = useState(false);
    const [categories, setCategories]                   = useState<string[]>([]);
    const [expenseTypes, setExpenseTypes]               = useState<string[]>([]);
    const [expenses, setExpenses]                       = useState<Expense[]>([]);
    const [searchTerm, setSearchTerm]         = useState('');
    const [showFilters, setShowFilters]       = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterType, setFilterType]         = useState('');
    const [filterTime, setFilterTime]         = useState('');
    const [filterMin, setFilterMin]           = useState('');
    const [filterMax, setFilterMax]           = useState('');

    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const fetchExpenses = async (id: string) => {
        setExpenses(await apiFetchExpenses(id));
    };

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        const storedUserId   = localStorage.getItem('userId');
        if (!storedUsername || !storedUserId) return;

        setUsername(storedUsername);
        setUserId(storedUserId);

        // Cria os recorrentes em atraso e só depois carrega a lista (já completa).
        syncRecurring(storedUserId).then(() => fetchExpenses(storedUserId));

        fetchExpenseConfig().then(cfg => { setCategories(cfg.categories); setExpenseTypes(cfg.expenseTypes); });
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        navigate('/');
    };

    useEffect(() => {
        if (!userId) return;
        const handler = () => fetchExpenses(userId);
        window.addEventListener('blip:expense-added', handler);
        return () => window.removeEventListener('blip:expense-added', handler);
    }, [userId]);

    const handleUpdateExpense = async (id: string, updatedData: Omit<Expense, 'id'>) => {
        try {
            const res = await fetch(`${API_BASE}/expenses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });
            if (!res.ok) { toast.error('Erro ao atualizar a despesa.'); return; }
            setEditingExpense(null);
            fetchExpenses(userId);
        } catch {
            toast.error('Erro de ligação ao servidor.');
        }
    };

    const handleDeleteExpense = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
            if (!res.ok) { toast.error('Erro ao eliminar a despesa.'); return; }
            setEditingExpense(null);
            fetchExpenses(userId);
        } catch {
            toast.error('Erro de ligação ao servidor.');
        }
    };


    const filteredExpenses = expenses.filter(
        makeExpenseFilter({ searchTerm, filterCategory, filterType, filterTime, filterMin, filterMax })
    );

    // cartões de resumo usam só o filtro de tempo (não pesquisa/categoria/valor)
    const timeFilteredExpenses = expenses.filter(makeTimeFilter(filterTime));

    const periodLabel     = filterTime === 'week' ? 'Weekly' : filterTime === 'month' ? 'Monthly' : filterTime === 'year' ? 'Yearly' : '';
    const displayedSpent  = sumSpent(timeFilteredExpenses);
    const displayedIncome = sumIncome(timeFilteredExpenses);
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
