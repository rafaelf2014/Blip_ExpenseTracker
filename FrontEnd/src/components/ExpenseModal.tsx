import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/ExpenseModal.scss';
import '../styles/global.scss';
import toast from 'react-hot-toast';
import { useCurrency } from '../Context/CurrencyContext';
import { ModalBase } from './ModalBase';
import { API_BASE } from '../constants/api';
import { toLocalDateStr } from '../utils/finance';

type ExpenseModalProps = {
  userId: string;
  categories: string[];
  expenseTypes: string[];
  onClose: () => void;
  onExpenseAdded: () => void;
};

export function ExpenseModal({ userId, categories, expenseTypes, onClose, onExpenseAdded }: ExpenseModalProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [category, setCategory]       = useState(categories.length > 0 ? categories[0] : '');
  const [type, setType]               = useState(expenseTypes.length > 0 ? expenseTypes[0] : '');
  const [date, setDate] = useState(() => toLocalDateStr(new Date()));

  const { currencySymbol } = useCurrency();

  const handleAddExpense = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const response = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, description, amount, category, type, date })
    });

    if (response.ok) {
      toast.success(t('modals.added_success'));
      window.dispatchEvent(new Event('blip:expense-added'));
      onExpenseAdded();
      onClose();
    } else {
      toast.error(t('modals.add_failed'));
    }
  };

  return (
    <ModalBase>
      <h3 className='modal-title'>{t('modals.add_title')}</h3>

      <form className="settings-form" onSubmit={handleAddExpense}>
        <div className='form-group'>
          <label>{t('modals.description')}</label>
          <input className='form-control' type="text" placeholder={t('modals.description')} value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div className='form-row'>
          <div className='form-group'>
            <label>{t('modals.amount')} ({currencySymbol})</label>
            <input className='form-control' type="number" placeholder={t('modals.amount')} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className='form-group'>
            <label>{t('modals.date')}</label>
            <input className='form-control' type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        </div>
        <div className='form-row'>
          <div className='form-group'>
            <label>{t('modals.category')}</label>
            <select className='form-control' value={category} onChange={(e) => setCategory(e.target.value)} required>
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className='form-group'>
            <label>{t('modals.type')}</label>
            <select className='form-control' value={type} onChange={(e) => setType(e.target.value)} required>
              {expenseTypes.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
        <div className='modal-actions'>
          <button type="button" onClick={onClose} className='save-button btn-cancel'>{t('modals.cancel')}</button>
          <button type="submit" className='save-button btn-save'>{t('modals.save_expense')}</button>
        </div>
      </form>
    </ModalBase>
  );
}
