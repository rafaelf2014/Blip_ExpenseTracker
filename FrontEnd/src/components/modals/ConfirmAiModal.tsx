import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save } from 'lucide-react';
import type { NewExpense } from '../../types';
import '../../styles/AiModals.scss';
import { ModalBase } from './ModalBase';
import { toLocalDateStr } from '../../utils/finance';

type ConfirmAiModalProps = {
  aiData: NewExpense;
  categories: string[];
  expenseTypes: string[];
  onClose: () => void;
  onConfirm: (finalData: NewExpense) => void;
};

export function ConfirmAiModal({ aiData, categories, expenseTypes, onClose, onConfirm }: ConfirmAiModalProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState(aiData.description || '');
  const [amount, setAmount]           = useState(aiData.amount || 0);
  const [category, setCategory]       = useState(aiData.category || '');
  const [type, setType]               = useState(aiData.type || 'One-time');
  const [date, setDate] = useState(() => aiData.date || toLocalDateStr(new Date()));

  return (
    <ModalBase overlayClass="ai-modal-overlay" cardClass="ai-modal-content">
      <button onClick={onClose} className="close-btn"><X size={24} /></button>
      <h3 className="modal-title">{t('modals.ai_confirm_title')}</h3>
      <p className="modal-subtitle">{t('modals.ai_confirm_subtitle')}</p>

      <div className="input-stack">
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('modals.description')} />
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder={t('modals.amount')} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t('editExpenseModal.select_category')}</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">{t('editExpenseModal.select_type')}</option>
          {expenseTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <button onClick={() => onConfirm({ description, amount, category, type, date })} className="save-btn">
        <Save size={18} /> {t('modals.save_expense')}
      </button>
    </ModalBase>
  );
}
