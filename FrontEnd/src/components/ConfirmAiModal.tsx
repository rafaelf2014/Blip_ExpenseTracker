import { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { NewExpense } from '../types';
import '../styles/AiBar.scss';

type ConfirmAiModalProps = {
  aiData: NewExpense;
  categories: string[];
  expenseTypes: string[];
  onClose: () => void;
  onConfirm: (finalData: NewExpense) => void;
};

export function ConfirmAiModal({ aiData, categories, expenseTypes, onClose, onConfirm }: ConfirmAiModalProps) {
  const [description, setDescription] = useState(aiData.description || '');
  const [amount, setAmount] = useState(aiData.amount || 0);
  const [category, setCategory] = useState(aiData.category || '');
  const [type, setType] = useState(aiData.type || 'One-time');
  const [date, setDate] = useState(() => {
    if (aiData.date) return aiData.date;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  return (
    <div className="ai-modal-overlay">
      <div className="ai-modal-content">
        <button onClick={onClose} className="close-btn"><X size={24} /></button>

        <h3 className="modal-title">🤖 Confirmação da IA</h3>
        <p className="modal-subtitle">Verifica os dados extraídos antes de guardar.</p>

        <div className="input-stack">
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Selecione Categoria</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Selecione Tipo</option>
            {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <button onClick={() => onConfirm({ description, amount, category, type, date })} className="save-btn">
          <Save size={18} /> Guardar Despesa
        </button>
      </div>
    </div>
  );
}
