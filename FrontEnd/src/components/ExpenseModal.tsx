import { useState } from 'react';
import '../styles/ExpenseModal.scss';
import '../styles/global.scss';

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

  const handleAddExpense = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const response = await fetch('http://localhost:5000/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, description, amount, category, type, date })
    });

        if (response.ok) {
            alert('Expense added successfully!');
            onExpenseAdded();
            onClose();
        } else {
            alert('Failed to add expense. Please try again.');
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className='form-group'>
              <label >Amount ($) </label>
              <input className='form-control' type="number" placeholder="Amount" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className='form-group'>
              <label >Date</label>
              <input className='form-control' type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
            <button type="button" onClick={onClose} className='save-button cancel-button' style={{ backgroundColor: '#EF4444', color: 'white' }}  >
              Cancel
            </button>
            <button type="submit" className='save-button' style={{ backgroundColor: '#10B981', color: 'white' }} >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
