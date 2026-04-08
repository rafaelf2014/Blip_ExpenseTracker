import { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import type { Expense } from './ExpenseTable';
import '../styles/EditExpenseModal.scss';
import { useCurrency } from '../Context/CurrencyContext';

type EditExpenseModalProps = {
  expense: Expense;
  categories: string[];
  expenseTypes: string[];
  onClose: () => void;
  onSave: (id: string, updatedData: any) => void;
  onDelete: (id: string) => void;
};

export function EditExpenseModal({ expense, categories, expenseTypes, onClose, onSave, onDelete }: EditExpenseModalProps) {
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount);
  const [category, setCategory] = useState(expense.category);
  const [type, setType] = useState(expense.type || '');
  const [date, setDate] = useState(expense.date ? expense.date.split('T')[0] : '');

  const { currencySymbol } = useCurrency();

  return (
    <div className='edit-modal-overlay'>
      <div className='edit-modal-card'>

        <button className='close-btn' onClick={onClose} >
          <X size={24} />
        </button>

        <h3 className='modal-title'>Edit Transaction</h3>

        <div className='form-fields' >
          <input className='edit-input' type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <div className="currency-input-wrapper">
            <span className="currency-symbol-text">{currencySymbol}</span>
            <input
              className='edit-input'
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Amount"
              step="0.01"
            />
          </div>
          <input
            className='edit-input'
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <select className='edit-input' value={category} onChange={(e) => setCategory(e.target.value)} >
            <option value="">Select Category</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select className='edit-input' value={type} onChange={(e) => setType(e.target.value)} >
            <option value="">Select Type</option>
            {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className='action-buttons'>
          <button className='delete-btn' onClick={() => onDelete(expense.id)}>
            <Trash2 size={18} /> Delete
          </button>

          <button className='save-btn' onClick={() => onSave(expense.id, { description, amount, category, type, date })}>
            <Save size={18} /> Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}