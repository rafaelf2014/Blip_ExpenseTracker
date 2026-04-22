import { User, Save, Lock, Palette, DollarSign, PiggyBank, Plus, Trash2, Camera } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import '../styles/Settings.scss';
import { useCurrency } from "../Context/CurrencyContext";

type RegularTransaction = {
    id: string;
    description: string;
    amount: number;
    isIncome: boolean;
    category: string;
    frequency: 'weekly' | 'monthly' | 'yearly';
    date: string; // ISO date of first occurrence — defines the repeating day
};

type Budget = {
    id: string;
    category: string;
    limit: number;
    period: 'weekly' | 'monthly' | 'yearly';
};

const CATEGORIES = ['Food', 'Health', 'Clothes', 'Housing', 'Transportation', 'Entertainment', 'Other'];

export default function Settings() {
    const userId = localStorage.getItem('userId') ?? '';
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    // Profile picture
    const [profilePicture, setProfilePicture] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Financial
    const [currentBalance, setCurrentBalance] = useState(0);
    const [regularTransactions, setRegularTransactions] = useState<RegularTransaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);

    // New regular transaction form
    const [rtDesc, setRtDesc] = useState('');
    const [rtAmount, setRtAmount] = useState('');
    const [rtIsIncome, setRtIsIncome] = useState(true);
    const [rtCategory, setRtCategory] = useState(CATEGORIES[0]);
    const [rtFrequency, setRtFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [rtDate, setRtDate] = useState(new Date().toISOString().split('T')[0]);

    // New budget form
    const [budgetCategory, setBudgetCategory] = useState(CATEGORIES[0]);
    const [budgetLimit, setBudgetLimit] = useState('');
    const [budgetPeriod, setBudgetPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

    // Preferences
    const { currency, setCurrency } = useCurrency();
    const [language, setLanguage] = useState('en');
    const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

    useEffect(() => {
        const storedName = localStorage.getItem('username');
        if (storedName) setUsername(storedName);

        if (userId) {
            fetch(`http://localhost:5000/api/users/${userId}/settings`)
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
        const res = await fetch(`http://localhost:5000/api/users/${userId}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error('Save failed');
    };

    // ── Profile ───────────────────────────────────────────────────────────────

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setProfilePicture(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const oldUsername = localStorage.getItem('username');
        try {
            const [usernameRes] = await Promise.all([
                fetch('http://localhost:5000/api/users/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oldUsername, newUsername: username }),
                }),
                saveSettings({ profilePicture }),
            ]);
            const data = await usernameRes.json();
            if (usernameRes.ok) {
                localStorage.setItem('username', username);
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

    // ── Password ──────────────────────────────────────────────────────────────

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return toast.error("New passwords do not match!");
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/users/update-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: localStorage.getItem('username'), currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            } else {
                toast.error(data.error);
            }
        } catch {
            toast.error("Error connecting to the server");
        } finally {
            setLoading(false);
        }
    };

    // ── Financial ─────────────────────────────────────────────────────────────

    const handleFinancialSave = async () => {
        try {
            await saveSettings({ currentBalance, regularTransactions });
            toast.success('Financial settings saved!');
        } catch {
            toast.error('Failed to save financial settings');
        }
    };

    const addRegularTransaction = () => {
        if (!rtDesc.trim() || !rtAmount) return toast.error('Fill in description and amount');
        const next: RegularTransaction = {
            id: Date.now().toString(),
            description: rtDesc.trim(),
            amount: Number(rtAmount),
            isIncome: rtIsIncome,
            category: rtCategory,
            frequency: rtFrequency,
            date: rtDate,
        };
        setRegularTransactions(prev => [...prev, next]);
        setRtDesc('');
        setRtAmount('');
    };

    // ── Budgets ───────────────────────────────────────────────────────────────

    const handleBudgetsSave = async () => {
        try {
            await saveSettings({ budgets });
            toast.success('Budgets saved!');
        } catch {
            toast.error('Failed to save budgets');
        }
    };

    const addBudget = () => {
        if (!budgetLimit) return toast.error('Enter a budget limit');
        if (budgets.some(b => b.category === budgetCategory && b.period === budgetPeriod)) {
            return toast.error('A budget for that category + period already exists');
        }
        setBudgets(prev => [...prev, {
            id: Date.now().toString(),
            category: budgetCategory,
            limit: Number(budgetLimit),
            period: budgetPeriod,
        }]);
        setBudgetLimit('');
    };

    // ── Preferences ───────────────────────────────────────────────────────────

    const handlePreferencesSave = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Preferences updated!");
    };

    return (
        <div className="settings-layout">
            <Sidebar />

            <main className="settings-page">
                <div className="settings-header">
                    <h1>Settings</h1>
                    <p>Manage your account and preferences</p>
                </div>

                <div className="settings-grid">

                    {/* ── Row 1: Profile + Security ── */}
                    <div className="settings-row-two">

                        {/* Profile */}
                        <div className="settings-card">
                            <div className="card-header">
                                <div className="card-icon"><User size={20} color="white" /></div>
                                <h2>Profile</h2>
                            </div>
                            <form onSubmit={handleProfileSave}>
                                <div className="profile-form-inner">
                                    <div className="profile-fields">
                                        <div className="form-group">
                                            <label>Username</label>
                                            <input className="form-control" type="text" value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                placeholder="Enter your username" required />
                                        </div>
                                        <button type="submit" className="save-button" disabled={loading}>
                                            <Save size={16} />{loading ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                    <div className="avatar-section">
                                        <div className="avatar-circle" onClick={() => fileInputRef.current?.click()}>
                                            {profilePicture
                                                ? <img src={profilePicture} alt="Profile" />
                                                : <Camera size={28} color="#64748B" />}
                                        </div>
                                        <span className="avatar-hint">Click to change</span>
                                        <input ref={fileInputRef} type="file" accept="image/*"
                                            style={{ display: 'none' }} onChange={handleFileChange} />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Security */}
                        <div className="settings-card">
                            <div className="card-header">
                                <div className="card-icon"><Lock size={20} color="white" /></div>
                                <h2>Security</h2>
                            </div>
                            <form className="settings-form" onSubmit={handlePasswordSave}>
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input className="form-control" type="password" value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Current password" required />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input className="form-control" type="password" value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New password" required />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input className="form-control" type="password" value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password" required />
                                </div>
                                <button type="submit" className="save-button" disabled={loading}>
                                    <Save size={16} />{loading ? "Saving..." : "Save Changes"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ── Financial Setup ── */}
                    <div className="settings-card">
                        <div className="card-header">
                            <div className="card-icon" style={{ backgroundColor: '#10B981' }}>
                                <DollarSign size={20} color="white" />
                            </div>
                            <h2>Financial Setup</h2>
                        </div>

                        {/* Current Balance */}
                        <div className="financial-section">
                            <h3 className="section-subtitle">Current Balance</h3>
                            <p className="section-hint">Your real account balance right now — used as the baseline for projections.</p>
                            <div className="form-group">
                                <label>Balance (€)</label>
                                <input className="form-control balance-input" type="number" value={currentBalance}
                                    onChange={(e) => setCurrentBalance(Number(e.target.value))}
                                    placeholder="0.00" step="0.01" />
                            </div>
                        </div>

                        <div className="section-divider" />

                        {/* Regular Transactions */}
                        <div className="financial-section">
                            <h3 className="section-subtitle">Regular Transactions</h3>
                            <p className="section-hint">Salary, rent, subscriptions — anything that repeats automatically.</p>

                            <div className="add-rt-form">
                                <input className="form-control" type="text" value={rtDesc}
                                    onChange={e => setRtDesc(e.target.value)} placeholder="Description (e.g. Salary)" />
                                <input className="form-control" type="number" value={rtAmount}
                                    onChange={e => setRtAmount(e.target.value)} placeholder="Amount (€)" step="0.01" min="0" />
                                <input className="form-control" type="date" value={rtDate}
                                    onChange={e => setRtDate(e.target.value)}
                                    title="First occurrence — determines which day of the month/week/year this repeats" />
                                <div className="income-expense-toggle">
                                    <button type="button"
                                        className={`toggle-btn ${rtIsIncome ? 'active-income' : ''}`}
                                        onClick={() => setRtIsIncome(true)}>
                                        + Income
                                    </button>
                                    <button type="button"
                                        className={`toggle-btn ${!rtIsIncome ? 'active-expense' : ''}`}
                                        onClick={() => setRtIsIncome(false)}>
                                        − Expense
                                    </button>
                                </div>
                                <select className="form-control" value={rtCategory} onChange={e => setRtCategory(e.target.value)}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select className="form-control" value={rtFrequency}
                                    onChange={e => setRtFrequency(e.target.value as RegularTransaction['frequency'])}>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                                <button type="button" className="add-btn" onClick={addRegularTransaction}>
                                    <Plus size={15} /> Add
                                </button>
                            </div>

                            {regularTransactions.length > 0 && (
                                <div className="rt-list">
                                    {regularTransactions.map(rt => (
                                        <div key={rt.id} className={`rt-item ${rt.isIncome ? 'is-income' : 'is-expense'}`}>
                                            <div className="rt-badge">{rt.isIncome ? '+' : '−'}</div>
                                            <div className="rt-info">
                                                <span className="rt-desc">{rt.description}</span>
                                                <span className="rt-meta">{rt.category} · {rt.frequency} · from {rt.date}</span>
                                            </div>
                                            <span className="rt-amount">
                                                {rt.isIncome ? '+' : '−'}€{rt.amount.toFixed(2)}
                                            </span>
                                            <button className="remove-btn" onClick={() =>
                                                setRegularTransactions(prev => prev.filter(r => r.id !== rt.id))}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="save-button" style={{ marginTop: '8px' }} onClick={handleFinancialSave}>
                            <Save size={16} /> Save Financial Settings
                        </button>
                    </div>

                    {/* ── Category Budgets ── */}
                    <div className="settings-card">
                        <div className="card-header">
                            <div className="card-icon" style={{ backgroundColor: '#F59E0B' }}>
                                <PiggyBank size={20} color="white" />
                            </div>
                            <h2>Category Budgets</h2>
                        </div>
                        <p className="section-hint">Set monthly (or weekly/yearly) spending caps per category.</p>

                        <div className="add-budget-form">
                            <select className="form-control" value={budgetCategory}
                                onChange={e => setBudgetCategory(e.target.value)}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input className="form-control" type="number" value={budgetLimit}
                                onChange={e => setBudgetLimit(e.target.value)}
                                placeholder="Limit (€)" step="0.01" min="0" />
                            <select className="form-control" value={budgetPeriod}
                                onChange={e => setBudgetPeriod(e.target.value as Budget['period'])}>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                            <button type="button" className="add-btn" onClick={addBudget}>
                                <Plus size={15} /> Add Budget
                            </button>
                        </div>

                        {budgets.length > 0 && (
                            <div className="budget-list">
                                {budgets.map(b => (
                                    <div key={b.id} className="budget-item">
                                        <div className="budget-category-pill">{b.category}</div>
                                        <span className="budget-period">{b.period}</span>
                                        <span className="budget-limit">€{b.limit.toFixed(2)}</span>
                                        <button className="remove-btn" onClick={() =>
                                            setBudgets(prev => prev.filter(x => x.id !== b.id))}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button className="save-button" style={{ marginTop: '8px' }} onClick={handleBudgetsSave}>
                            <Save size={16} /> Save Budgets
                        </button>
                    </div>

                    {/* ── Preferences ── */}
                    <div className="settings-card">
                        <div className="card-header">
                            <div className="card-icon" style={{ backgroundColor: '#8B5CF6' }}>
                                <Palette size={20} color="white" />
                            </div>
                            <h2>Preferences</h2>
                        </div>
                        <form className="settings-form" onSubmit={handlePreferencesSave}>
                            <div className="prefs-grid">
                                <div className="form-group">
                                    <label>Currency</label>
                                    <select className="form-control" value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="BRL">BRL (R$)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Language</label>
                                    <select className="form-control" value={language}
                                        onChange={(e) => setLanguage(e.target.value)}>
                                        <option value="en">English</option>
                                        <option value="pt">Português</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Date Format</label>
                                    <select className="form-control" value={dateFormat}
                                        onChange={(e) => setDateFormat(e.target.value)}>
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="save-button">
                                <Save size={16} /> Save Preferences
                            </button>
                        </form>
                    </div>

                </div>
            </main>
        </div>
    );
}
