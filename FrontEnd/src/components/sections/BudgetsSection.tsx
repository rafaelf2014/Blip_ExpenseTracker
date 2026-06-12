import { useState } from 'react';
import { PiggyBank, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Budget } from '../../types';
import { CATEGORIES } from '../../constants/categories';

interface BudgetsSectionProps {
    budgets: Budget[];
    setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
    saveBudgets: () => Promise<void>;
}

export function BudgetsSection({ budgets, setBudgets, saveBudgets }: BudgetsSectionProps) {
    const [budgetCategory, setBudgetCategory] = useState(CATEGORIES[0]);
    const [budgetLimit, setBudgetLimit]       = useState('');
    const [budgetPeriod, setBudgetPeriod]     = useState<Budget['period']>('monthly');

    const addBudget = () => {
        if (!budgetLimit) return toast.error('Enter a budget limit');
        if (budgets.some(b => b.category === budgetCategory && b.period === budgetPeriod))
            return toast.error('A budget for that category + period already exists');
        setBudgets(prev => [...prev, {
            id: Date.now().toString(),
            category: budgetCategory,
            limit: Number(budgetLimit),
            period: budgetPeriod,
        }]);
        setBudgetLimit('');
    };

    return (
        <div className="settings-card">
            <div className="card-header">
                <div className="card-icon icon-amber">
                    <PiggyBank size={20} color="white" />
                </div>
                <h2>Category Budgets</h2>
            </div>
            <p className="section-hint">Set monthly (or weekly/yearly) spending caps per category.</p>

            <div className="add-budget-form">
                <select className="form-control" value={budgetCategory} onChange={e => setBudgetCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className="form-control" type="number" value={budgetLimit}
                    onChange={e => setBudgetLimit(e.target.value)}
                    placeholder="Limit (€)" step="0.01" min="0" />
                <select className="form-control" value={budgetPeriod} onChange={e => setBudgetPeriod(e.target.value as Budget['period'])}>
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
                            <button className="remove-btn" onClick={() => setBudgets(prev => prev.filter(x => x.id !== b.id))}>
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <button className="save-button" style={{ marginTop: '8px' }} onClick={saveBudgets}>
                <Save size={16} /> Save Budgets
            </button>
        </div>
    );
}
