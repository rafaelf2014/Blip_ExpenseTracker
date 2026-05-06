import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { API_BASE } from '../constants/api';
import type { RegularTransaction, Budget } from '../types';

export function useSettings() {
    const userId = localStorage.getItem('userId') ?? '';

    const [username, setUsername]                       = useState('');
    const [profilePicture, setProfilePicture]           = useState('');
    const [loading, setLoading]                         = useState(false);
    const [currentBalance, setCurrentBalance]           = useState(0);
    const [regularTransactions, setRegularTransactions] = useState<RegularTransaction[]>([]);
    const [budgets, setBudgets]                         = useState<Budget[]>([]);

    useEffect(() => {
        const storedName = localStorage.getItem('username');
        if (storedName) setUsername(storedName);

        if (userId) {
            fetch(`${API_BASE}/users/${userId}/settings`)
                .then(r => r.json())
                .then(data => {
                    setProfilePicture(data.profilePicture ?? '');
                    setCurrentBalance(data.currentBalance ?? 0);
                    setRegularTransactions(data.regularTransactions ?? []);
                    setBudgets(data.budgets ?? []);
                })
                .catch(console.error);
        }
    }, [userId]);

    const saveSettings = async (patch: Record<string, unknown>) => {
        const res = await fetch(`${API_BASE}/users/${userId}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error('Save failed');
    };

    const saveProfile = async (newUsername: string, pic: string) => {
        setLoading(true);
        const oldUsername = localStorage.getItem('username');
        try {
            const [usernameRes] = await Promise.all([
                fetch(`${API_BASE}/users/update`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oldUsername, newUsername }),
                }),
                saveSettings({ profilePicture: pic }),
            ]);
            const data = await usernameRes.json();
            if (usernameRes.ok) {
                localStorage.setItem('username', newUsername);
                setUsername(newUsername);
                toast.success('Profile saved!');
            } else {
                toast.error(data.error || 'Failed to update username');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // retorna true se a password foi alterada com sucesso (para o componente limpar os campos)
    const savePassword = async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<boolean> => {
        if (newPassword !== confirmPassword) { toast.error('New passwords do not match!'); return false; }
        setLoading(true);
        try {
            const res  = await fetch(`${API_BASE}/users/update-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: localStorage.getItem('username'), currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) { toast.success(data.message); return true; }
            toast.error(data.error);
            return false;
        } catch {
            toast.error('Error connecting to the server');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const saveFinancial = async () => {
        try {
            await saveSettings({ currentBalance, regularTransactions });
            toast.success('Financial settings saved!');
        } catch {
            toast.error('Failed to save financial settings');
        }
    };

    const saveBudgets = async () => {
        try {
            await saveSettings({ budgets });
            toast.success('Budgets saved!');
        } catch {
            toast.error('Failed to save budgets');
        }
    };

    return {
        username, setUsername,
        profilePicture, setProfilePicture,
        loading,
        currentBalance, setCurrentBalance,
        regularTransactions, setRegularTransactions,
        budgets, setBudgets,
        saveProfile,
        savePassword,
        saveFinancial,
        saveBudgets,
    };
}
