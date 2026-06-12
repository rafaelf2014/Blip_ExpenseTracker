import { useState } from 'react';
import { DollarSign, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { RegularTransaction } from '../../types';
import { CATEGORIES } from '../../constants/categories';
import { toLocalDateStr } from '../../utils/finance';

interface FinancialSectionProps {
    currentBalance: number;
    setCurrentBalance: (v: number) => void;
    regularTransactions: RegularTransaction[];
    setRegularTransactions: React.Dispatch<React.SetStateAction<RegularTransaction[]>>;
    saveFinancial: () => Promise<void>;
}

export function FinancialSection({ currentBalance, setCurrentBalance, regularTransactions, setRegularTransactions, saveFinancial }: FinancialSectionProps) {
    const [rtDesc, setRtDesc]           = useState('');
    const [rtAmount, setRtAmount]       = useState('');
    const [rtIsIncome, setRtIsIncome]   = useState(true);
    const [rtCategory, setRtCategory]   = useState(CATEGORIES[0]);
    const [rtFrequency, setRtFrequency] = useState<RegularTransaction['frequency']>('monthly');
    const [rtDate, setRtDate]           = useState(toLocalDateStr(new Date()));

    const addRegularTransaction = () => {
        if (!rtDesc.trim() || !rtAmount) return toast.error('Fill in description and amount');
        setRegularTransactions(prev => [...prev, {
            id: Date.now().toString(),
            description: rtDesc.trim(),
            amount: Number(rtAmount),
            isIncome: rtIsIncome,
            category: rtCategory,
            frequency: rtFrequency,
            date: rtDate,
        }]);
        setRtDesc('');
        setRtAmount('');
    };

    const removeRegularTransaction = (rt: RegularTransaction) => {
        const ok = window.confirm(
            `Stop the recurring ${rt.isIncome ? 'income' : 'expense'} "${rt.description}"?\n\n` +
            `Transactions it already created stay in your history — only future ones stop. ` +
            `Click "Save Financial Settings" to apply.`
        );
        if (ok) setRegularTransactions(prev => prev.filter(r => r.id !== rt.id));
    };

    return (
        <div className="settings-card">
            <div className="card-header">
                <div className="card-icon icon-green">
                    <DollarSign size={20} color="white" />
                </div>
                <h2>Financial Setup</h2>
            </div>

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
                        <button type="button" className={`toggle-btn ${rtIsIncome ? 'active-income' : ''}`} onClick={() => setRtIsIncome(true)}>
                            + Income
                        </button>
                        <button type="button" className={`toggle-btn ${!rtIsIncome ? 'active-expense' : ''}`} onClick={() => setRtIsIncome(false)}>
                            − Expense
                        </button>
                    </div>
                    <select className="form-control" value={rtCategory} onChange={e => setRtCategory(e.target.value)}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="form-control" value={rtFrequency} onChange={e => setRtFrequency(e.target.value as RegularTransaction['frequency'])}>
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
                                <span className="rt-amount">{rt.isIncome ? '+' : '−'}€{rt.amount.toFixed(2)}</span>
                                <button className="remove-btn" onClick={() => removeRegularTransaction(rt)}>
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button className="save-button" style={{ marginTop: '8px' }} onClick={saveFinancial}>
                <Save size={16} /> Save Financial Settings
            </button>
        </div>
    );
}
