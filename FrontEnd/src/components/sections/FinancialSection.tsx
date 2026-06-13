import { useState } from 'react';
import { DollarSign, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const [rtDesc, setRtDesc]           = useState('');
    const [rtAmount, setRtAmount]       = useState('');
    const [rtIsIncome, setRtIsIncome]   = useState(true);
    const [rtCategory, setRtCategory]   = useState(CATEGORIES[0]);
    const [rtFrequency, setRtFrequency] = useState<RegularTransaction['frequency']>('monthly');
    const [rtDate, setRtDate]           = useState(toLocalDateStr(new Date()));

    const addRegularTransaction = () => {
        if (!rtDesc.trim() || !rtAmount) return toast.error(t('planning.err_fill_desc_amount'));
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
        const ok = window.confirm(t('planning.confirm_stop_recurring', {
            kind: rt.isIncome ? t('planning.income').toLowerCase() : t('planning.expense').toLowerCase(),
            description: rt.description,
        }));
        if (ok) setRegularTransactions(prev => prev.filter(r => r.id !== rt.id));
    };

    return (
        <div className="settings-card">
            <div className="card-header">
                <div className="card-icon icon-green">
                    <DollarSign size={20} color="white" />
                </div>
                <h2>{t('planning.financial_setup')}</h2>
            </div>

            <div className="financial-section">
                <h3 className="section-subtitle">{t('planning.current_balance')}</h3>
                <p className="section-hint">{t('planning.current_balance_hint')}</p>
                <div className="form-group">
                    <label>{t('planning.balance_label')} (€)</label>
                    <input className="form-control balance-input" type="number" value={currentBalance}
                        onChange={(e) => setCurrentBalance(Number(e.target.value))}
                        placeholder="0.00" step="0.01" />
                </div>
            </div>

            <div className="section-divider" />

            <div className="financial-section">
                <h3 className="section-subtitle">{t('planning.regular_transactions')}</h3>
                <p className="section-hint">{t('planning.regular_transactions_hint')}</p>

                <div className="add-rt-form">
                    <input className="form-control" type="text" value={rtDesc}
                        onChange={e => setRtDesc(e.target.value)} placeholder={t('planning.desc_placeholder')} />
                    <input className="form-control" type="number" value={rtAmount}
                        onChange={e => setRtAmount(e.target.value)} placeholder={`${t('planning.amount_placeholder')} (€)`} step="0.01" min="0" />
                    <input className="form-control" type="date" value={rtDate}
                        onChange={e => setRtDate(e.target.value)}
                        title={t('planning.first_occurrence_title')} />
                    <div className="income-expense-toggle">
                        <button type="button" className={`toggle-btn ${rtIsIncome ? 'active-income' : ''}`} onClick={() => setRtIsIncome(true)}>
                            + {t('planning.income')}
                        </button>
                        <button type="button" className={`toggle-btn ${!rtIsIncome ? 'active-expense' : ''}`} onClick={() => setRtIsIncome(false)}>
                            − {t('planning.expense')}
                        </button>
                    </div>
                    <select className="form-control" value={rtCategory} onChange={e => setRtCategory(e.target.value)}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c.toLowerCase()}`, c)}</option>)}
                    </select>
                    <select className="form-control" value={rtFrequency} onChange={e => setRtFrequency(e.target.value as RegularTransaction['frequency'])}>
                        <option value="weekly">{t('planning.weekly')}</option>
                        <option value="monthly">{t('planning.monthly')}</option>
                        <option value="yearly">{t('planning.yearly')}</option>
                    </select>
                    <button type="button" className="add-btn" onClick={addRegularTransaction}>
                        <Plus size={15} /> {t('planning.add')}
                    </button>
                </div>

                {regularTransactions.length > 0 && (
                    <div className="rt-list">
                        {regularTransactions.map(rt => (
                            <div key={rt.id} className={`rt-item ${rt.isIncome ? 'is-income' : 'is-expense'}`}>
                                <div className="rt-badge">{rt.isIncome ? '+' : '−'}</div>
                                <div className="rt-info">
                                    <span className="rt-desc">{rt.description}</span>
                                    <span className="rt-meta">{t(`categories.${rt.category.toLowerCase()}`, rt.category)} · {t(`planning.${rt.frequency}`)} · {t('planning.from')} {rt.date}</span>
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
                <Save size={16} /> {t('planning.save_financial')}
            </button>
        </div>
    );
}
