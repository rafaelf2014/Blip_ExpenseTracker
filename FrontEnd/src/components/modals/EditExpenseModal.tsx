import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Trash2 } from 'lucide-react';
import type { Expense } from '../../types';
import '../../styles/EditExpenseModal.scss';
import { ModalBase } from './ModalBase';

type EditExpenseModalProps = {
  expense: Expense;
  categories: string[];
  expenseTypes: string[];
  onClose: () => void;
  onSave: (id: string, updatedData: Omit<Expense, 'id'>) => void;
  onDelete: (id: string) => void;
};

export function EditExpenseModal({ expense, categories, expenseTypes, onClose, onSave, onDelete }: EditExpenseModalProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount]           = useState(expense.amount);
  const [category, setCategory]       = useState(expense.category);
  const [type, setType]               = useState(expense.type || '');
  const [date, setDate]               = useState(expense.date.split('T')[0]);

  return (
    <ModalBase overlayClass="edit-modal-overlay" cardClass="edit-modal-card">
      <button className='close-btn' onClick={onClose}><X size={24} /></button>
      <h3 className='modal-title'>{t('editExpenseModal.title')}</h3>

      <div className='form-fields'>
        <input className='edit-input' type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('modals.description')} />
        <input className='edit-input' type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder={t('modals.amount')} />
        <input className='edit-input' type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <select className='edit-input' value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t('editExpenseModal.select_category')}</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className='edit-input' value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">{t('editExpenseModal.select_type')}</option>
          {expenseTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div className='action-buttons'>
        <button className='delete-btn' onClick={() => onDelete(expense.id)}>
          <Trash2 size={18} /> {t('editExpenseModal.delete')}
        </button>
        <button className='save-btn' onClick={() => onSave(expense.id, { description, amount, category, type, date })}>
          <Save size={18} /> {t('editExpenseModal.save')}
        </button>
      </div>
    </ModalBase>
  );
}
