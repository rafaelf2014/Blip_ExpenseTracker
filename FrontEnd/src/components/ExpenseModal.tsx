import { useState } from 'react';

type ExpenseModalProps = {
  userId: string;
  categories: string[];
  expenseTypes: string[];
  onClose: () => void;
  onExpenseAdded: () => void; 
};

export function ExpenseModal({ userId, categories, expenseTypes, onClose, onExpenseAdded }: ExpenseModalProps){
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
    <div style={{
      position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#0F172A', padding: '30px', borderColor: 'white', border: '2px solid', borderRadius: '8px', width: '350px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>Add New Expense</h3>
        <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
          <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          <input type="number" placeholder="Amount" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} required>
            {expenseTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', width: '100%' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
