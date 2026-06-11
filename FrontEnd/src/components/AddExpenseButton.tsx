import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../styles/AddExpenseButton.scss';

type AddExpenseButtonProps = {
  onAddManual: () => void;
  onAddAi: () => void;
};

/** Split button: manual "+ Add Expense" on the left, AI quick-add (lightning) on the right. */
export function AddExpenseButton({ onAddManual, onAddAi }: AddExpenseButtonProps) {
  const { t } = useTranslation();

  return (
    <div className="add-expense-split">
      <button className="add-manual-btn" onClick={onAddManual}>
        {t('filters.add_expense')}
      </button>
      <button
        className="add-ai-btn"
        onClick={onAddAi}
        title={t('aiMenu.button_title')}
        aria-label={t('aiMenu.button_title')}
      >
        <Zap size={18} />
      </button>
    </div>
  );
}
