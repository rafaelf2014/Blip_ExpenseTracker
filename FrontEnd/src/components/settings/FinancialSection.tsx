import { useState } from 'react';
import { DollarSign, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { RegularTransaction } from '../../types';
import { CATEGORIES } from '../../constants/categories';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../Context/CurrencyContext';

interface FinancialSectionProps {
    currentBalance: number;
    setCurrentBalance: (v: number) => void;
    regularTransactions: RegularTransaction[];
    setRegularTransactions: React.Dispatch<React.SetStateAction<RegularTransaction[]>>;
    saveFinancial: () => Promise<void>;
}

export function FinancialSection({ currentBalance, setCurrentBalance, regularTransactions, setRegularTransactions, saveFinancial }: FinancialSectionProps) {
    const [rtDesc, setRtDesc] = useState('');
    const [rtAmount, setRtAmount] = useState('');
    const [rtIsIncome, setRtIsIncome] = useState(true);
    const [rtCategory, setRtCategory] = useState(CATEGORIES[0]);
    const [rtFrequency, setRtFrequency] = useState<RegularTransaction['frequency']>('monthly');
    const [rtDate, setRtDate] = useState(new Date().toISOString().split('T')[0]);
    const { t } = useTranslation();
    const { currencySymbol } = useCurrency();
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

    return (
        <div className="settings-card">
            <div className="card-header">
                <div className="card-icon" style={{ backgroundColor: '#10B981' }}>
                    <DollarSign size={20} color="white" />
                </div>
                <h2>{t('settings.financial.title')}</h2>
            </div>

            <div className="financial-section">
                <h3 className="section-subtitle">{t('settings.financial.balance_Title')}</h3>
                <p className="section-hint">{t('settings.financial.balance_subTitle')}</p>
                <div className="form-group">
                    <label>{t('settings.financial.balance')} ({currencySymbol})</label>
                    <input className="form-control balance-input" type="number" value={currentBalance}
                        onChange={(e) => setCurrentBalance(Number(e.target.value))}
                        placeholder="0.00" step="0.01" />
                </div>
            </div>

            <div className="section-divider" />

            <div className="financial-section">
                <h3 className="section-subtitle">{t('settings.financial.transactions_Title')}</h3>
                <p className="section-hint">{t('settings.financial.transactions_subTitle')}</p>

                <div className="add-rt-form">
                    <input className="form-control" type="text" value={rtDesc}
                        onChange={e => setRtDesc(e.target.value)} placeholder={t('settings.financial.description')} />
                    <input className="form-control" type="number" value={rtAmount}
                        onChange={e => setRtAmount(e.target.value)} placeholder={t('settings.financial.amount', { currencySymbol })} step="0.01" min="0" />
                    <input className="form-control" type="date" value={rtDate}
                        onChange={e => setRtDate(e.target.value)}
                        title="First occurrence — determines which day of the month/week/year this repeats" />
                    <div className="income-expense-toggle">
                        <button type="button" className={`toggle-btn ${rtIsIncome ? 'active-income' : ''}`} onClick={() => setRtIsIncome(true)}>
                            + {t('settings.financial.income')}
                        </button>
                        <button type="button" className={`toggle-btn ${!rtIsIncome ? 'active-expense' : ''}`} onClick={() => setRtIsIncome(false)}>
                            − {t('settings.financial.expense')}
                        </button>
                    </div>
                    <select className="form-control" value={rtCategory} onChange={e => setRtCategory(e.target.value)}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c.toLowerCase()}`)}</option>)}
                    </select>
                    <select className="form-control" value={rtFrequency} onChange={e => setRtFrequency(e.target.value as RegularTransaction['frequency'])}>
                        <option value="weekly">{t('dates.weekly')}</option>
                        <option value="monthly">{t('dates.monthly')}</option>
                        <option value="yearly">{t('dates.yearly')}</option>
                    </select>
                    <button type="button" className="add-btn" onClick={addRegularTransaction}>
                        <Plus size={15} /> {t('settings.financial.add')}
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
                                <button className="remove-btn" onClick={() => setRegularTransactions(prev => prev.filter(r => r.id !== rt.id))}>
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button className="save-button" style={{ marginTop: '8px' }} onClick={saveFinancial}>
                <Save size={16} /> {t('settings.save')}
            </button>
        </div>
    );
}
