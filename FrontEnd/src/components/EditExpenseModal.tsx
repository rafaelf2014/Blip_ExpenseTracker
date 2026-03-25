import { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import type { Expense } from './ExpenseTable';

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
  const [date, setDate] = useState(expense.date);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(11, 18, 33, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: '#151E2D', padding: '30px', borderRadius: '16px', border: '1px solid #2A3441', width: '400px', position: 'relative' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <h3 style={{ marginTop: 0, color: 'white', fontSize: '20px', marginBottom: '20px' }}>Edit Transaction</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0F172A', color: 'white', border: '1px solid #334155' }} />
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount" style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0F172A', color: 'white', border: '1px solid #334155' }} />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0F172A', color: 'white', border: '1px solid #334155' }} />
          
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0F172A', color: 'white', border: '1px solid #334155' }}>
            <option value="">Select Category</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0F172A', color: 'white', border: '1px solid #334155' }}>
            <option value="">Select Type</option>
            {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
          <button onClick={() => onDelete(expense.id)} style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Trash2 size={18} /> Delete
          </button>
          
          <button onClick={() => onSave(expense.id, { description, amount, category, type, date })} style={{ flex: 2, padding: '12px', backgroundColor: '#06B6D4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Save size={18} /> Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}