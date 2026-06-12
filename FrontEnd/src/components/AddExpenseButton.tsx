import { Zap, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLLMStatus } from '../hooks/useLLMStatus';
import '../styles/AddExpenseButton.scss';

type AddExpenseButtonProps = {
  onAddManual: () => void;
  onAddAi: () => void;
};

/** Split button: manual "+ Add Expense" on the left, AI quick-add (lightning) on the right. */
export function AddExpenseButton({ onAddManual, onAddAi }: AddExpenseButtonProps) {
  const { t } = useTranslation();
  const llmStatus = useLLMStatus();
  const loading = llmStatus === 'loading';

  return (
    <div className="add-expense-split">
      <button className="add-manual-btn" onClick={onAddManual}>
        {t('filters.add_expense')}
      </button>
      <button
        className="add-ai-btn"
        onClick={onAddAi}
        title={loading ? t('aiMenu.loading') : t('aiMenu.button_title')}
        aria-label={loading ? t('aiMenu.loading') : t('aiMenu.button_title')}
      >
        {loading ? <Loader2 size={18} className="spin-anim" /> : <Zap size={18} />}
      </button>
    </div>
  );
}
