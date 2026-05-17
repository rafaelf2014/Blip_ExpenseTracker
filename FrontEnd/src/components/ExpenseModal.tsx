import { useState } from 'react';
import '../styles/ExpenseModal.scss';
import '../styles/global.scss';
import toast from 'react-hot-toast';
import { useCurrency } from '../Context/CurrencyContext';
import { ModalBase } from './ModalBase';
import { API_BASE } from '../constants/api';
import { useTranslation } from 'react-i18next';

type ExpenseModalProps = {
  userId: string;
  categories: string[];
  expenseTypes: string[];
  expenses: any[];
  onClose: () => void;
  onExpenseAdded: () => void;
};

export function ExpenseModal({ userId, categories, expenseTypes, onClose, onExpenseAdded }: ExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories.length > 0 ? categories[0] : '');
  const [type, setType] = useState(expenseTypes.length > 0 ? expenseTypes[0] : '');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const { currencySymbol } = useCurrency();
  const { t } = useTranslation();

  const handleAddExpense = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const response = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, description, amount, category, type, date })
    });

    if (response.ok) {
      toast.success('Expense added successfully!');
      onExpenseAdded();
      onClose();
    } else {
      toast.error('Failed to add expense. Please try again.');
    }
  };

  return (
    <ModalBase>
      <h3 className='modal-title'>{t('addExpenseModal.title')}</h3>

      <form className="settings-form" onSubmit={handleAddExpense}>
        <div className='form-group'>
          <label>{t('addExpenseModal.description')}</label>
          <input className='form-control' type="text" placeholder={t('addExpenseModal.description')} value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div className='form-row'>
          <div className='form-group'>
            <label>{t('addExpenseModal.ammount')} ({currencySymbol})</label>
            <input className='form-control' type="number" placeholder={t('addExpenseModal.ammount')} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className='form-group'>
            <label>{t('addExpenseModal.date')}</label>
            <input className='form-control' type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        </div>
        <div className='form-row'>
          <div className='form-group'>
            <label>{t('addExpenseModal.category')}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} required>
              {categories.map((cat) => <option key={cat} value={cat}>{t(`categories.${cat.toLowerCase()}`)}</option>)}
            </select>
          </div>
          <div className='form-group'>
            <label>{t('addExpenseModal.type')}</label>
            <select value={type} onChange={(e) => setType(e.target.value)} required>
              {expenseTypes.map((ty) => <option key={ty} value={ty}>{t(`types.${ty.toLowerCase()}`)}</option>)}
            </select>
          </div>
        </div>
        <div className='modal-actions'>
          <button type="button" onClick={onClose} className='save-button btn-cancel'>{t('addExpenseModal.cancel')}</button>
          <button type="submit" className='save-button btn-save'>{t('addExpenseModal.save')}</button>
        </div>
      </form>
    </ModalBase>
  );
}
