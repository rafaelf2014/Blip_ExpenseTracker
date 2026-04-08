import { useState } from 'react';
import '../styles/ExpenseModal.scss';
import '../styles/global.scss';
import toast from 'react-hot-toast';
import { useCurrency } from '../Context/CurrencyContext';

type ExpenseModalProps = {
  userId: string;
  categories: string[];
  expenseTypes: string[];
  onClose: () => void;
  onExpenseAdded: () => void;
};

export function ExpenseModal({ userId, categories, expenseTypes, onClose, onExpenseAdded }: ExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories.length > 0 ? categories[0] : '');
  const [type, setType] = useState(expenseTypes.length > 0 ? expenseTypes[0] : '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { currencySymbol } = useCurrency();

  const handleAddExpense = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const response = await fetch('http://localhost:5000/api/expenses', {
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
    <div className='modal-overlay'>
      <div className='modal-card'>
        <h3 className='modal-title'>Add New Expense</h3>

        <form className="settings-form" onSubmit={handleAddExpense} >
          <div className='form-group'>
            <label >Description</label>
            <input className='form-control' type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className='form-row'>
            <div className='form-group'>
              <label >Amount ({currencySymbol}) </label>
              <input className='form-control' type="number" placeholder="Amount" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>

            <div className='form-group'>
              <label >Date</label>
              <input className='form-control' type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

          </div>
          <div className='form-row'>
            <div className='form-group'>
              <label >Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className='form-group'>
              <label >Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} required>
                {expenseTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className='modal-actions'>
            <button type="button" onClick={onClose} className='save-button btn-cancel'  >
              Cancel
            </button>
            <button type="submit" className='save-button btn-save'  >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
